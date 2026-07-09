// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleChatRequest } from "../../api/chat";
import { handleAnalyzeFitRequest } from "../../api/analyze-fit";
import limitsHandler, { handleLimitsRequest } from "../../api/limits";

const anthropicMocks = vi.hoisted(() => ({
  stream: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    static APIError = class APIError extends Error {
      status = 500;
    };

    static RateLimitError = class RateLimitError extends Error {};

    messages = anthropicMocks;
  }

  return {
    default: MockAnthropic,
  };
});

describe("API validation", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects non-POST chat requests", async () => {
    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", { method: "GET" }),
    );

    expect(res.status).toBe(405);
    await expect(res.json()).resolves.toMatchObject({
      error: "method_not_allowed",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("rejects empty chat messages", async () => {
    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "messages_required",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("rejects malformed chat JSON", async () => {
    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "invalid_json",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("rate-limits chat history over 20 turns before upstream calls", async () => {
    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: Array.from({ length: 21 }, () => ({
            role: "user",
            content: "Is Sam a fit for certification?",
          })),
        }),
      }),
    );

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({
      error: "rate_limited",
      detail: expect.any(String),
      why: expect.any(String),
      limit: "20 messages per /api/chat request.",
      retryAfterSeconds: 0,
      graceful_boundary: { spec: "https://gracefulboundaries.dev/", level: 2 },
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });

  it("rejects chat messages over 8000 characters", async () => {
    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "x".repeat(8001) }],
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "message_too_long",
      detail: expect.any(String),
      why: expect.any(String),
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });

  it("rejects short fit assessments", async () => {
    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({ jobDescription: "short" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "job_description_required",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("rejects malformed fit assessment JSON", async () => {
    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "invalid_json",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("rejects fit assessments over 8000 characters", async () => {
    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({ jobDescription: "x".repeat(8001) }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "job_description_too_long",
      detail: expect.any(String),
      why: expect.any(String),
    });
    expect(anthropicMocks.create).not.toHaveBeenCalled();
  });

  it("streams chat text from the configured provider", async () => {
    anthropicMocks.stream.mockReturnValue(
      (async function* () {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Sam " },
        };
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "matches." },
        };
      })(),
    );

    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Is Sam a fit for certification?" }],
        }),
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    await expect(res.text()).resolves.toBe("Sam matches.");
    expect(anthropicMocks.stream).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-4-8",
        messages: [{ role: "user", content: "Is Sam a fit for certification?" }],
      }),
    );
  });

  it("returns parsed structured fit results", async () => {
    const fitResult = {
      verdict: "strong",
      title: "Strong Fit",
      summary: "This role maps well.",
      matches: [{ requirement: "Certification", evidence: "Built YouTube certification." }],
      gaps: [{ area: "Direct reports", note: "Limited formal direct reports." }],
      whatTransfers: "Assessment design transfers.",
      recommendation: "Talk next.",
    };
    anthropicMocks.create.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "record_fit_assessment",
          input: fitResult,
        },
      ],
    });

    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({
          jobDescription:
            "We need a senior learning leader to design certification programs and evaluate AI workflow capability across teams.",
        }),
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(fitResult);
    expect(anthropicMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-opus-4-8",
        tools: [
          expect.objectContaining({
            name: "record_fit_assessment",
            input_schema: expect.objectContaining({ type: "object" }),
          }),
        ],
        tool_choice: { type: "tool", name: "record_fit_assessment" },
      }),
    );
  });

  it("fails closed when fit analysis returns invalid JSON", async () => {
    anthropicMocks.create.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
    });

    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({
          jobDescription:
            "We need a senior learning leader to design certification programs and evaluate AI workflow capability across teams.",
        }),
      }),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({
      error: "model_returned_invalid_json",
      detail: expect.any(String),
      why: expect.any(String),
    });
  });

  it("fails closed when the model provider is not configured", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const res = await handleAnalyzeFitRequest(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({
          jobDescription:
            "We need a senior learning leader to design certification programs and evaluate AI workflow capability across teams.",
        }),
      }),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: "anthropic_config_missing",
      detail: expect.any(String),
      why: expect.any(String),
    });
    expect(anthropicMocks.create).not.toHaveBeenCalled();
  });

  it("fails closed in production when Upstash rate limiting is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = await handleChatRequest(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Is Sam a fit for certification?" }],
        }),
      }),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({
      error: "rate_limit_config_missing",
      detail: expect.any(String),
      why: expect.any(String),
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });

  it("publishes Graceful Boundaries Level 2 limit discovery", async () => {
    const res = await handleLimitsRequest(
      new Request("https://sam-rogers.com/api/limits", { method: "GET" }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      spec: "https://gracefulboundaries.dev/",
      conformance: {
        standard: "Graceful Boundaries",
        level: 2,
      },
      endpoints: expect.arrayContaining([
        expect.objectContaining({ path: "/api/chat", method: "POST" }),
        expect.objectContaining({ path: "/api/analyze-fit", method: "POST" }),
      ]),
    });
  });

  it("adapts Vercel node-shaped requests and responses", async () => {
    const response = {
      status: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };
    response.status.mockImplementation(() => response);

    await limitsHandler(
      {
        method: "GET",
        url: "/api/limits",
        headers: { host: "sam-rogers.com" },
      } as never,
      response,
    );

    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.setHeader).toHaveBeenCalledWith("content-type", "application/json");
    expect(response.send).toHaveBeenCalledWith(expect.any(Buffer));
  });
});
