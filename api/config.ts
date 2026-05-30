export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8";

export const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function missingRateLimitConfigResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_config_missing",
      message:
        "Rate limiting is required in production and the Upstash Redis environment variables are missing.",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
