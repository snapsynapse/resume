import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { samProfile } from "../src/data/sam-profile";
import {
  ANTHROPIC_MODEL,
  hasUpstashConfig,
  isProductionRuntime,
  missingRateLimitConfigResponse,
} from "./config";

export const config = { runtime: "edge" };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

function gracefulBoundary(message: string, retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      graceful_boundary: {
        spec: "https://gracefulboundaries.dev",
        message,
        retry_after_seconds: retryAfterSeconds,
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
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

INSTRUCTIONS:
- Read the job description carefully.
- Identify 3–4 specific requirements and cite concrete evidence from Sam's experience for each (matches).
- Identify 1–3 honest gaps where his background doesn't directly fit (gaps).
- Set verdict to "strong" only if the role aligns with senior L&D, certification design, AI measurement, talent enablement, or governance work. Set "weak" if it requires production engineering ownership, direct fundraising leadership, consumer growth, or specialty domains he hasn't worked in. "moderate" otherwise.
- Use Sam's voice: direct, specific, no hedging. First-person ("I have shipped...", "I am not the senior engineer who..."). No preamble like "Based on the description".
- Title is a short verdict line ("Strong Fit — Let's Talk" / "Honest Assessment — Probably Not Your Person" / "Worth a Conversation").
- Summary is one sentence introducing the assessment.
- whatTransfers covers transferable skills even in a weak-fit case (always populate, even on strong fits).
- recommendation closes with what should happen next.`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!hasUpstashConfig && isProductionRuntime()) {
    return missingRateLimitConfigResponse();
  }

  if (fitLimiter) {
    const ip = getClientIp(req);
    const { success, reset } = await fitLimiter.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return gracefulBoundary(
        "Fit assessments are capped at 10 per hour. Try again later or email sam@sam-rogers.com with the JD directly.",
        retryAfter,
      );
    }
  }

  let body: { jobDescription?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jd = body.jobDescription;
  if (typeof jd !== "string" || jd.trim().length < 50) {
    return new Response(
      JSON.stringify({
        error: "job description required (minimum 50 chars)",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  if (jd.length > 8000) {
    return new Response(
      JSON.stringify({ error: "job description too long (max 8000 chars)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
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
      output_config: {
        format: {
          type: "json_schema",
          schema: fitSchema,
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "model_returned_invalid_json" }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return gracefulBoundary(
        "Anthropic API rate limit hit. Try again in a moment.",
        60,
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return new Response(
        JSON.stringify({
          error: "upstream_error",
          status: error.status,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
