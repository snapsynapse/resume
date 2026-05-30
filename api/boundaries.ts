export type BoundaryBody = {
  error: string;
  detail: string;
  why: string;
  graceful_boundary?: {
    spec: "https://gracefulboundaries.dev/";
    level: 2;
  };
};

export type RateLimitBody = BoundaryBody & {
  limit: string;
  retryAfterSeconds: number;
  graceful_boundary: {
    spec: "https://gracefulboundaries.dev/";
    level: 2;
  };
};

type BoundaryResponseOptions = {
  status: number;
  error: string;
  detail: string;
  why: string;
  headers?: HeadersInit;
};

type RateLimitResponseOptions = BoundaryResponseOptions & {
  limit: string;
  retryAfterSeconds: number;
};

function jsonResponse(body: BoundaryBody | RateLimitBody, status: number, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function boundaryResponse({
  status,
  error,
  detail,
  why,
  headers,
}: BoundaryResponseOptions): Response {
  return jsonResponse({ error, detail, why }, status, headers);
}

export function rateLimitResponse({
  status,
  error,
  detail,
  why,
  limit,
  retryAfterSeconds,
  headers,
}: RateLimitResponseOptions): Response {
  return jsonResponse(
    {
      error,
      detail,
      why,
      limit,
      retryAfterSeconds,
      graceful_boundary: {
        spec: "https://gracefulboundaries.dev/",
        level: 2,
      },
    },
    status,
    {
      "Retry-After": String(retryAfterSeconds),
      ...headers,
    },
  );
}
