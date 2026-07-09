import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { samProfile } from "../src/data/sam-profile.js";
import {
  composeRoleContext,
  targetPresets,
  companyPresets,
  type RoleSelection,
  type TargetKey,
  type CompanyKey,
} from "../src/lib/role-context.js";
import { explicitAiOfficerContext } from "./explicit-role-context.js";
import {
  ANTHROPIC_MODEL,
  hasAnthropicConfig,
  hasUpstashConfig,
  isProductionRuntime,
  missingAnthropicConfigResponse,
  missingRateLimitConfigResponse,
} from "./config.js";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8000;
import { boundaryResponse, rateLimitResponse } from "./boundaries.js";
import { withVercelAdapter } from "./vercel-adapter.js";

// Two sliding windows. Burst protection + sustained-use cap.
// Missing Upstash config is allowed in local dev, but production fails closed below.
const redis = hasUpstashConfig ? Redis.fromEnv() : null;

const burstLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "rl:burst",
    })
  : null;

const sustainedLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      analytics: true,
      prefix: "rl:hour",
    })
  : null;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// The role/company keys are used to index preset records. Client-supplied keys
// must be validated against known own-property keys before use, or a
// prototype-polluting key (e.g. "__proto__") yields a degenerate context.
function sanitizeRoleSelection(raw: unknown): RoleSelection {
  if (!raw || typeof raw !== "object") return {};
  const candidate = raw as Record<string, unknown>;
  const selection: RoleSelection = {};
  const { target, company } = candidate;
  if (typeof target === "string" && Object.hasOwn(targetPresets, target)) {
    selection.target = target as TargetKey;
  }
  if (typeof company === "string" && Object.hasOwn(companyPresets, company)) {
    selection.company = company as CompanyKey;
  }
  return selection;
}

function buildSystemPrompt(roleSelection: RoleSelection): string {
  const activeRoleContext = composeRoleContext(roleSelection);
  const experienceContext = samProfile.experience
    .map(
      (e) => `
=== ${e.company} — ${e.role} (${e.period}) ===
Highlights:
${e.highlights.map((h) => `- ${h}`).join("\n")}

Story behind the bullet:
- Situation: ${e.aiContext.situation}
- Approach: ${e.aiContext.approach}
- Work: ${e.aiContext.technicalWork}
- Lesson: ${e.aiContext.lessonsLearned}`,
    )
    .join("\n");

  const skillsContext = `
=== SKILLS ===
Strong: ${samProfile.skills.strong.join(", ")}
Moderate: ${samProfile.skills.moderate.join(", ")}
Gaps (be honest about these): ${samProfile.skills.gaps.join(", ")}`;

  const failuresContext = `
=== FAILURES ===
${samProfile.failures
  .map(
    (f) =>
      `${f.year} — ${f.title}\nSummary: ${f.summary}\nDetails: ${f.details}\nLesson: ${f.lessons}`,
  )
  .join("\n\n")}`;

  const credentialPhilosophyContext = samProfile.credentialPhilosophy
    ? `
=== CREDENTIAL DESIGN APPROACH ===
Sam's stated principles for cert / credential program design. Surface verbatim when asked about his approach to certification, dev ed, or assessment design.
${samProfile.credentialPhilosophy.map((p) => `- ${p}`).join("\n")}`
    : "";

  const recruiterFAQContext = samProfile.recruiterFAQ
    ? `
=== RECRUITER FAQ ===
Direct answers Sam has given to questions hiring managers ask in the first call. Use these verbatim or near-verbatim when the question is asked — they're his actual position, not inference. Don't hedge or improvise around them.

${samProfile.recruiterFAQ.map((qa) => `Q: ${qa.q}\nA: ${qa.a}`).join("\n\n")}`
    : "";

  const artifactsContext = samProfile.publicArtifacts
    ? `
=== PUBLIC ARTIFACTS ===
When the visitor asks "what has Sam shipped?", "where can I read his thinking?", "what's he writing about?", or similar, surface 2–4 with links. Lead-with first, then mention-if-asked. Always include the URL in plain text. Never list more than 4 in a single response. Match the artifact to the question — don't dump the whole catalog.

LEAD WITH:
${samProfile.publicArtifacts.leadWith.map((a) => `- ${a.title} (${a.format}) — ${a.url}\n  ${a.pitch}`).join("\n")}

MENTION IF ASKED:
${samProfile.publicArtifacts.mentionIfAsked.map((a) => `- ${a.title} — ${a.url}\n  ${a.pitch}`).join("\n")}

RECENT BLOG POSTS (sam-rogers.com):
${samProfile.publicArtifacts.recentBlogPosts.map((p) => `- ${p.title} — ${p.url}\n  ${p.pitch}`).join("\n")}

=== PAICE PORTFOLIO — 12+ PROJECTS ===
When a visitor asks about the portfolio breadth, name 3–5 most relevant to their question — never dump the whole list. When a visitor asks a specific question (e.g. "how does Siteline work?"), answer about that one project with the matching URL.

${samProfile.publicArtifacts.paicePortfolio.map((p) => `- ${p.name} [${p.category}] — ${p.url}\n  ${p.pitch}`).join("\n")}

=== ARCHIVES (volume signals — point at the URL, don't enumerate) ===
- PAICE blog: ${samProfile.publicArtifacts.archives.paiceBlog.url} — ${samProfile.publicArtifacts.archives.paiceBlog.note}
- Newsletter: ${samProfile.publicArtifacts.archives.newsletter.url} — ${samProfile.publicArtifacts.archives.newsletter.note}
- Founder monologues: ${samProfile.publicArtifacts.archives.youtube.url} — ${samProfile.publicArtifacts.archives.youtube.note}`
    : "";

  const roleBlock = activeRoleContext
    ? `\n=== VISITOR CONTEXT ===\nThe person asking these questions appears to be evaluating Sam in this context: ${activeRoleContext.label}.\n${activeRoleContext.promptContext}\nWhen they ask fit questions, lead with concrete evidence from Sam's track record before any framing. Keep the answer honest about gaps.\n`
    : "";

  return `${samProfile.systemPrompt}

${experienceContext}

${skillsContext}

${failuresContext}

${credentialPhilosophyContext}

${recruiterFAQContext}

${artifactsContext}
${roleBlock}
${explicitAiOfficerContext}

RESPONSE STYLE
- Be direct and specific. Skip preamble like "Great question" or "Based on Sam's experience".
- Use concrete details from the experience blocks above, not generic language.
- When asked "is Sam a fit for X", structure the answer: where he matches (with evidence), where he doesn't (named gaps), and an honest recommendation.
- Keep answers under ~250 words unless the question genuinely warrants more.
- Never invent details. If something isn't in this context, say so.

CONVERSION — when to offer the booking link (https://cal.com/paice)
- After a strong-fit answer ("yes, he's a fit because..."), close with one line: "If this looks right, book time with Sam directly: https://cal.com/paice"
- When the visitor explicitly signals interest ("how do I reach Sam", "can we talk", "want to continue this conversation"), surface the booking link.
- Offer the link AT MOST ONCE per conversation unless the visitor asks again. Never lead with it. Never include it in answers about gaps, failures, or weak fit.`;
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

// Limiter outage posture. Mirrors the missing-config 503 shape from config.ts:
// public AI endpoints fail closed in production when limits cannot be enforced.
function rateLimitUnavailableResponse(): Response {
  return boundaryResponse({
    status: 503,
    error: "rate_limit_unavailable",
    detail:
      "Rate limiting is temporarily unavailable, so this public AI endpoint is failing closed until it recovers.",
    why: "Public AI endpoints must fail closed in production when cost-control and abuse-control limits cannot be enforced.",
  });
}

// Enforce burst + sustained limits. Redis outages become a fail-closed 503 in
// production and a fail-open console warning in development, rather than an
// unhandled rejection surfacing as a bare 500.
async function enforceRateLimits(req: Request): Promise<Response | null> {
  if (!burstLimiter || !sustainedLimiter) return null;
  const ip = getClientIp(req);
  let burst: Awaited<ReturnType<typeof burstLimiter.limit>>;
  let sustained: Awaited<ReturnType<typeof sustainedLimiter.limit>>;
  try {
    [burst, sustained] = await Promise.all([
      burstLimiter.limit(ip),
      sustainedLimiter.limit(ip),
    ]);
  } catch (err) {
    if (isProductionRuntime()) {
      console.error("Rate limiter error:", err);
      return rateLimitUnavailableResponse();
    }
    console.warn("Rate limiter unavailable, failing open in development:", err);
    return null;
  }

  if (!burst.success) {
    const retryAfter = Math.max(1, Math.ceil((burst.reset - Date.now()) / 1000));
    return gracefulBoundary(
      "Slow down. You are sending messages faster than the burst limit allows. Try again in a moment.",
      retryAfter,
      "5 requests per 60 seconds for /api/chat.",
    );
  }
  if (!sustained.success) {
    const retryAfter = Math.max(1, Math.ceil((sustained.reset - Date.now()) / 1000));
    return gracefulBoundary(
      "You have hit the hourly cap for this conversation. Try again later, or email sam@sam-rogers.com to keep talking.",
      retryAfter,
      "50 requests per 1 hour for /api/chat.",
    );
  }
  return null;
}

// role must be user|assistant and content a non-empty string within the cap.
// Garbage/system roles otherwise reach Anthropic and surface as an opaque 502.
function validateChatMessages(messages: ChatMessage[]): Response | null {
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) {
      return boundaryResponse({
        status: 400,
        error: "invalid_message_role",
        detail: 'Each chat message must have a role of "user" or "assistant".',
        why: "Only user and assistant turns are valid conversation input for the resume chat model.",
      });
    }
    if (typeof m.content !== "string" || m.content.trim().length === 0) {
      return boundaryResponse({
        status: 400,
        error: "empty_message_content",
        detail: "Each chat message must include non-empty text content.",
        why: "Empty messages carry no question for the resume context to answer.",
      });
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return boundaryResponse({
        status: 400,
        error: "message_too_long",
        detail: `Each chat message must be a string of ${MAX_MESSAGE_CHARS} characters or fewer.`,
        why: "The limit keeps public API calls bounded before upstream model processing.",
      });
    }
  }
  return null;
}

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function handleChatRequest(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return boundaryResponse({
      status: 405,
      error: "method_not_allowed",
      detail: "Use POST to submit chat messages.",
      why: "/api/chat accepts request bodies and does not expose a read-only representation.",
    });
  }

  if (!hasUpstashConfig && isProductionRuntime()) {
    return missingRateLimitConfigResponse();
  }

  if (!hasAnthropicConfig()) {
    return missingAnthropicConfigResponse();
  }

  const limited = await enforceRateLimits(req);
  if (limited) return limited;

  let body: {
    messages?: ChatMessage[];
    roleSelection?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return boundaryResponse({
      status: 400,
      error: "invalid_json",
      detail: "The request body could not be parsed as JSON.",
      why: "/api/chat requires a JSON body with a messages array.",
    });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return boundaryResponse({
      status: 400,
      error: "messages_required",
      detail: "The request body must include at least one chat message.",
      why: "/api/chat compares user questions against the resume context, so an empty request cannot be answered.",
    });
  }
  if (messages.length > MAX_MESSAGES) {
    // Not a rate limit: retrying the same oversized conversation can never
    // succeed, so this is a validation-style boundary, not a 429/Retry-After.
    return boundaryResponse({
      status: 413,
      error: "conversation_too_long",
      detail: `Conversation length is capped at ${MAX_MESSAGES} messages per request. Start a new conversation to continue, or email Sam directly.`,
      why: "A single request carries the full conversation, so an unbounded history would grow cost and latency without limit.",
    });
  }
  const invalid = validateChatMessages(messages);
  if (invalid) return invalid;

  const systemPrompt = buildSystemPrompt(sanitizeRoleSelection(body.roleSelection));

  try {
    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
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
      detail: "The upstream model provider could not complete the chat request.",
      why: "The request reached the model boundary but could not be completed reliably.",
    });
  }
}

export default withVercelAdapter(handleChatRequest);
