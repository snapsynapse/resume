import { boundaryResponse } from "./boundaries.js";

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8";

export const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function missingRateLimitConfigResponse(): Response {
  return boundaryResponse({
    status: 503,
    error: "rate_limit_config_missing",
    detail:
      "Rate limiting is required in production and the Upstash Redis environment variables are missing.",
    why: "Public AI endpoints must fail closed in production when cost-control and abuse-control limits cannot be enforced.",
  });
}
