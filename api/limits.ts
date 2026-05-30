import { boundaryResponse } from "./boundaries.js";

const limits = {
  schemaVersion: "1.0",
  spec: "https://gracefulboundaries.dev/",
  conformance: {
    standard: "Graceful Boundaries",
    level: 2,
    scope: "Public resume API endpoints.",
  },
  endpoints: [
    {
      path: "/api/chat",
      method: "POST",
      limits: [
        {
          id: "chat_burst",
          window: "60 s",
          maxRequests: 5,
          enforcedWhen: "Upstash Redis is configured.",
        },
        {
          id: "chat_sustained",
          window: "1 h",
          maxRequests: 50,
          enforcedWhen: "Upstash Redis is configured.",
        },
        {
          id: "chat_turns",
          maxMessages: 20,
          enforcedWhen: "Always.",
        },
        {
          id: "chat_message_length",
          maxCharacters: 8000,
          enforcedWhen: "Always.",
        },
      ],
    },
    {
      path: "/api/analyze-fit",
      method: "POST",
      limits: [
        {
          id: "fit_sustained",
          window: "1 h",
          maxRequests: 10,
          enforcedWhen: "Upstash Redis is configured.",
        },
        {
          id: "fit_job_description_length",
          maxCharacters: 8000,
          enforcedWhen: "Always.",
        },
        {
          id: "fit_job_description_minimum",
          minCharacters: 50,
          enforcedWhen: "Always.",
        },
      ],
    },
  ],
  operationalBehavior: {
    missingRateLimitConfig: "Local development skips Redis limits. Production fails closed with HTTP 503.",
    nonSuccessResponses: "JSON responses include error, detail, and why. HTTP 429 responses also include limit and retryAfterSeconds.",
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return boundaryResponse({
      status: 405,
      error: "method_not_allowed",
      detail: "Use GET to retrieve the API limits document.",
      why: "/api/limits is a read-only discovery endpoint.",
    });
  }

  return new Response(JSON.stringify(limits), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
