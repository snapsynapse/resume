import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { samProfile } from "../src/data/sam-profile.js";
import { explicitAiOfficerContext } from "./explicit-role-context.js";
import {
  ANTHROPIC_MODEL,
  hasAnthropicConfig,
  hasUpstashConfig,
  isProductionRuntime,
  missingAnthropicConfigResponse,
  missingRateLimitConfigResponse,
} from "./config.js";
import { boundaryResponse, rateLimitResponse } from "./boundaries.js";
import { withVercelAdapter } from "./vercel-adapter.js";

const redis = hasUpstashConfig ? Redis.fromEnv() : null;

// Heavier rate limit on fit analysis — each call is a large structured generation.
const fitLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      analytics: true,
      prefix: "rl:fit",
    })
  : null;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function gracefulBoundary(detail: string, retryAfterSeconds: number, limit: string) {
  return rateLimitResponse({
    status: 429,
    error: "rate_limited",
    detail,
    why: "The resume API enforces public limits to control cost, abuse, and accidental overuse.",
    limit,
    retryAfterSeconds,
  });
}

const fitSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: {
      type: "string",
      enum: ["strong", "moderate", "weak"],
    },
    title: { type: "string" },
    summary: { type: "string" },
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          requirement: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["requirement", "evidence"],
      },
    },
    gaps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string" },
          note: { type: "string" },
        },
        required: ["area", "note"],
      },
    },
    whatTransfers: { type: "string" },
    recommendation: { type: "string" },
  },
  required: [
    "verdict",
    "title",
    "summary",
    "matches",
    "gaps",
    "whatTransfers",
    "recommendation",
  ],
};

function buildFitSystemPrompt(): string {
  // Reuse the same backbone the chat AI uses — Sam's track record + voice — but tailor
  // the closing instructions for structured fit assessment.
  const experienceSummary = samProfile.experience
    .map(
      (e) =>
        `- ${e.company} (${e.role}, ${e.period}): ${e.highlights.join(" / ")}`,
    )
    .join("\n");

  const skillsSummary = `Strong: ${samProfile.skills.strong.join(", ")}. Moderate: ${samProfile.skills.moderate.join(", ")}. Gaps: ${samProfile.skills.gaps.join(", ")}.`;

  return `You are analyzing a job description against Sam Rogers's track record. Return a structured fit assessment.

SAM'S EXPERIENCE:
${experienceSummary}

SKILLS:
${skillsSummary}

THESIS: Sam is founder of PAICE.work PBC. 25 years in L&D and performance consulting. Building open infrastructure for human-AI collaboration. Best suited to senior IC roles where the work makes AI safer in practice.

${explicitAiOfficerContext}

INSTRUCTIONS:
- Read the job description carefully.
- Identify 3–4 specific requirements and cite concrete evidence from Sam's experience for each (matches).
- Identify 1–3 honest gaps where his background doesn't directly fit (gaps).
- Set verdict to "strong" only if the role aligns with senior L&D, certification design, AI measurement, talent enablement, or governance work. Set "weak" if it requires production engineering ownership, direct fundraising leadership, consumer growth, or specialty domains he hasn't worked in. "moderate" otherwise.
- Use Sam's voice: direct, specific, no hedging. First-person ("I have shipped...", "I am not the senior engineer who..."). No preamble like "Based on the description".
- Title is a short verdict line ("Strong Fit — Let's Talk" / "Honest Assessment — Probably Not Your Person" / "Worth a Conversation").
- Summary is one sentence introducing the assessment.
- whatTransfers covers transferable skills even in a weak-fit case (always populate, even on strong fits).
- recommendation closes with what should happen next.
- Use the record_fit_assessment tool. Do not return markdown or prose outside the tool call.`;
}

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function readFitResult(response: Anthropic.Messages.Message): unknown {
  const toolBlock = response.content.find(
    (block) => block.type === "tool_use" && block.name === "record_fit_assessment",
  );
  if (toolBlock && toolBlock.type === "tool_use") return toolBlock.input;

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock && textBlock.type === "text" ? textBlock.text : "";
  if (!text) return null;
  return JSON.parse(text);
}

export async function handleAnalyzeFitRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return boundaryResponse({
      status: 405,
      error: "method_not_allowed",
      detail: "Use POST to submit a job description for fit analysis.",
      why: "/api/analyze-fit accepts request bodies and does not expose a read-only representation.",
    });
  }

  if (!hasUpstashConfig && isProductionRuntime()) {
    return missingRateLimitConfigResponse();
  }

  if (!hasAnthropicConfig()) {
    return missingAnthropicConfigResponse();
  }

  if (fitLimiter) {
    const ip = getClientIp(req);
    const { success, reset } = await fitLimiter.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return gracefulBoundary(
        "Fit assessments are capped at 10 per hour. Try again later or email sam@sam-rogers.com with the JD directly.",
        retryAfter,
        "10 requests per 1 hour for /api/analyze-fit.",
      );
    }
  }

  let body: { jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return boundaryResponse({
      status: 400,
      error: "invalid_json",
      detail: "The request body could not be parsed as JSON.",
      why: "/api/analyze-fit requires a JSON body with a jobDescription string.",
    });
  }

  const jd = body.jobDescription;
  if (typeof jd !== "string" || jd.trim().length < 50) {
    return boundaryResponse({
      status: 400,
      error: "job_description_required",
      detail: "Job description text is required and must be at least 50 characters.",
      why: "The fit assessment needs enough role context to produce a useful comparison.",
    });
  }
  if (jd.length > 8000) {
    return boundaryResponse({
      status: 400,
      error: "job_description_too_long",
      detail: "Job description text must be 8000 characters or fewer.",
      why: "The limit keeps public API calls bounded before upstream model processing.",
    });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2500,
      system: [
        {
          type: "text",
          text: buildFitSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Analyze this job description against my track record:\n\n${jd}`,
        },
      ],
      tools: [
        {
          name: "record_fit_assessment",
          description: "Return the structured fit assessment for this role.",
          input_schema: fitSchema,
        },
      ],
      tool_choice: { type: "tool", name: "record_fit_assessment" },
    });

    let parsed;
    try {
      parsed = readFitResult(response);
    } catch {
      return boundaryResponse({
        status: 502,
        error: "model_returned_invalid_json",
        detail: "The model response did not match the required JSON output shape.",
        why: "The app cannot safely render a structured fit assessment from malformed model output.",
      });
    }
    if (!parsed || typeof parsed !== "object") {
      return boundaryResponse({
        status: 502,
        error: "model_returned_invalid_json",
        detail: "The model response did not include a structured fit assessment.",
        why: "The app cannot safely render a structured fit assessment from an empty or unsupported model output shape.",
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return gracefulBoundary(
        "Anthropic API rate limit hit. Try again in a moment.",
        60,
        "Upstream model provider rate limit.",
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return boundaryResponse({
        status: 502,
        error: "upstream_error",
        detail: "The upstream model provider returned an error.",
        why: `Anthropic returned status ${error.status}.`,
      });
    }
    console.error("Unexpected error:", error);
    return boundaryResponse({
      status: 502,
      error: "upstream_error",
      detail: "The upstream model provider could not complete the fit assessment.",
      why: "The request reached the model boundary but could not be completed reliably.",
    });
  }
}

export default withVercelAdapter(handleAnalyzeFitRequest);
