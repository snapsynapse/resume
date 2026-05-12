import Anthropic from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { samProfile } from "../src/data/sam-profile";

export const config = { runtime: "edge" };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Two sliding windows. Burst protection + sustained-use cap.
// Skips silently if Upstash env vars are missing (local dev without `vercel env pull`).
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

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

function buildSystemPrompt(roleContext: string | null): string {
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

  const roleBlock = roleContext
    ? `\n=== VISITOR CONTEXT ===\nThe person asking these questions appears to be evaluating Sam for a role at: ${roleContext}.\nWhen they ask fit questions, use the ANTHROPIC CONTEXT block in the base prompt above to give role-specific answers. Lead with concrete evidence from his track record before any framing.\n`
    : "";

  return `${samProfile.systemPrompt}

${experienceContext}

${skillsContext}

${failuresContext}
${roleBlock}

RESPONSE STYLE
- Be direct and specific. Skip preamble like "Great question" or "Based on Sam's experience".
- Use concrete details from the experience blocks above, not generic language.
- When asked "is Sam a fit for X", structure the answer: where he matches (with evidence), where he doesn't (named gaps), and an honest recommendation.
- Keep answers under ~250 words unless the question genuinely warrants more.
- Never invent details. If something isn't in this context, say so.`;
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

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (burstLimiter && sustainedLimiter) {
    const ip = getClientIp(req);
    const [burst, sustained] = await Promise.all([
      burstLimiter.limit(ip),
      sustainedLimiter.limit(ip),
    ]);

    if (!burst.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((burst.reset - Date.now()) / 1000),
      );
      return gracefulBoundary(
        "Slow down — you're sending messages faster than the rate limit allows. Try again in a moment.",
        retryAfter,
      );
    }
    if (!sustained.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((sustained.reset - Date.now()) / 1000),
      );
      return gracefulBoundary(
        "You've hit the hourly cap for this conversation. The site is rate-limited to keep costs predictable — try again later, or email sam@sam-rogers.com to keep talking.",
        retryAfter,
      );
    }
  }

  let body: { messages?: ChatMessage[]; roleContext?: string | null };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (messages.length > 20) {
    return gracefulBoundary(
      "Conversation length capped at 20 turns. Start a new conversation to continue, or email Sam directly.",
      0,
    );
  }
  for (const m of messages) {
    if (typeof m.content !== "string" || m.content.length > 4000) {
      return new Response(
        JSON.stringify({ error: "message too long (max 4000 chars)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const systemPrompt = buildSystemPrompt(body.roleContext ?? null);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
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

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return new Response(
      JSON.stringify({
        text,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_read_input_tokens:
            response.usage.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens:
            response.usage.cache_creation_input_tokens ?? 0,
        },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
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
