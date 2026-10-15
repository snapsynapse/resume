// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ create: vi.fn(), stream: vi.fn() }));

// Failures must be reproducible offline, including on machines with real provider
// or Redis configuration. No test below can instantiate a configured SDK client.
vi.mock("../../api/config", () => ({
  ANTHROPIC_MODEL: "offline-regression-mock",
  hasAnthropicConfig: () => true,
  hasUpstashConfig: false,
  isProductionRuntime: () => false,
  missingAnthropicConfigResponse: vi.fn(),
  missingRateLimitConfigResponse: vi.fn(),
}));
vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    static APIError = class extends Error {};
    static RateLimitError = class extends Error {};
    messages = provider;
  }
  return { default: MockAnthropic };
});

import { handleChatRequest } from "../../api/chat";
import { handleAnalyzeFitRequest } from "../../api/analyze-fit";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe.each([
  { path: "chat", handle: handleChatRequest },
  { path: "analyze-fit", handle: handleAnalyzeFitRequest },
])("/$path request shape", ({ path, handle }) => {
  it.each([
    { label: "null", value: null },
    { label: "array", value: [] },
    { label: "string", value: "not an object" },
    { label: "number", value: 7 },
    { label: "boolean", value: true },
  ])("returns a structured 400 for JSON $label without provider work", async ({ value }) => {
    const response = await handle(new Request(`https://example.test/api/${path}`, {
      method: "POST", body: JSON.stringify(value),
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.any(String), detail: expect.any(String), why: expect.any(String),
    });
    expect(provider.stream).not.toHaveBeenCalled();
    expect(provider.create).not.toHaveBeenCalled();
  });
});

const validFit = {
  verdict: "moderate", title: "Discuss the scope", summary: "Relevant evidence exists.",
  matches: [{ requirement: "Education", evidence: "Built education systems." }],
  gaps: [], whatTransfers: "Delivery and measurement.", recommendation: "Discuss with Sam.",
};

describe("fit output boundary", () => {
  it.each([
    { label: "empty object", input: {} },
    { label: "array", input: [] },
    { label: "unknown verdict", input: { ...validFit, verdict: "invented" } },
    { label: "missing summary", input: { ...validFit, summary: undefined } },
    { label: "wrong matches container", input: { ...validFit, matches: "not a list" } },
    { label: "invalid match entry", input: { ...validFit, matches: [{ requirement: "Education", evidence: 7 }] } },
    { label: "null gaps", input: { ...validFit, gaps: null } },
    { label: "invalid gap entry", input: { ...validFit, gaps: [{ area: "Unverified scope" }] } },
  ])("rejects $label with a structured 502", async ({ input }) => {
    provider.create.mockResolvedValue({ content: [{ type: "tool_use", name: "record_fit_assessment", input }] });
    const response = await handleAnalyzeFitRequest(new Request("https://example.test/api/analyze-fit", {
      method: "POST", body: JSON.stringify({ jobDescription: "A public role delivering education programs, curriculum and measurement for customers." }),
    }));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: "model_returned_invalid_json", detail: expect.any(String), why: expect.any(String),
    });
  });
});

it("aborts the provider stream when its returned response is cancelled", async () => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const abort = vi.fn(() => release());
  provider.stream.mockReturnValue({
    abort,
    async *[Symbol.asyncIterator]() {
      yield { type: "content_block_delta", delta: { type: "text_delta", text: "first" } };
      await pending;
    },
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const response = await handleChatRequest(new Request("https://example.test/api/chat", {
    method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "A public question?" }] }),
  }));
  const reader = response.body!.getReader();
  try {
    await reader.read();
    await reader.cancel();
    await vi.waitFor(() => expect(abort).toHaveBeenCalledTimes(1), { timeout: 500 });
  } finally { release(); }
});
