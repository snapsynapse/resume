// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import chatHandler from "../../api/chat";
import analyzeFitHandler from "../../api/analyze-fit";

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
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects non-POST chat requests", async () => {
    const res = await chatHandler(new Request("https://sam-rogers.com/api/chat", { method: "GET" }));

    expect(res.status).toBe(405);
  });

  it("rejects empty chat messages", async () => {
    const res = await chatHandler(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "messages required" });
  });

  it("rejects malformed chat JSON", async () => {
    const res = await chatHandler(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid_json" });
  });

  it("rate-limits chat history over 20 turns before upstream calls", async () => {
    const res = await chatHandler(
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
      graceful_boundary: {
        retry_after_seconds: 0,
      },
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });

  it("rejects chat messages over 8000 characters", async () => {
    const res = await chatHandler(
      new Request("https://sam-rogers.com/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "x".repeat(8001) }],
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "message too long (max 8000 chars)",
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });

  it("rejects short fit assessments", async () => {
    const res = await analyzeFitHandler(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({ jobDescription: "short" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "job description required (minimum 50 chars)",
    });
  });

  it("rejects malformed fit assessment JSON", async () => {
    const res = await analyzeFitHandler(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: "{not json",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "invalid_json" });
  });

  it("rejects fit assessments over 8000 characters", async () => {
    const res = await analyzeFitHandler(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({ jobDescription: "x".repeat(8001) }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "job description too long (max 8000 chars)",
    });
    expect(anthropicMocks.create).not.toHaveBeenCalled();
  });

  it("streams chat text from Anthropic", async () => {
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

    const res = await chatHandler(
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
      content: [{ type: "text", text: JSON.stringify(fitResult) }],
    });

    const res = await analyzeFitHandler(
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
        output_config: {
          format: expect.objectContaining({ type: "json_schema" }),
        },
      }),
    );
  });

  it("fails closed when fit analysis returns invalid JSON", async () => {
    anthropicMocks.create.mockResolvedValue({
      content: [{ type: "text", text: "not json" }],
    });

    const res = await analyzeFitHandler(
      new Request("https://sam-rogers.com/api/analyze-fit", {
        method: "POST",
        body: JSON.stringify({
          jobDescription:
            "We need a senior learning leader to design certification programs and evaluate AI workflow capability across teams.",
        }),
      }),
    );

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: "model_returned_invalid_json" });
  });

  it("fails closed in production when Upstash rate limiting is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const res = await chatHandler(
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
    });
    expect(anthropicMocks.stream).not.toHaveBeenCalled();
  });
});
