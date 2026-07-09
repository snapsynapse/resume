import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AIChat from "./AIChat";

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock("@/lib/analytics", () => analyticsMock);

describe("AIChat", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("renders suggested recruiter questions", () => {
    render(<AIChat isOpen onClose={() => {}} />);

    expect(screen.getByText("Ask AI About Sam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /content operations or AI education systems role/i })).toBeInTheDocument();
  });

  it("renders target and company specific questions", () => {
    window.history.pushState({}, "", "/?target=content-ops&company=openai");

    render(<AIChat isOpen onClose={() => {}} />);

    expect(screen.getByText(/Here about OpenAI - Customer Education/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /OpenAI's Customer Education/i })).toBeInTheDocument();
  });

  it("labels sample responses when the live endpoint fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<AIChat isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /What's PAICE/i }));

    await waitFor(() => {
      expect(screen.getByText(/Live AI is unavailable/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Sample response because the live AI endpoint is unavailable/)).toBeInTheDocument();
  });

  it("tracks chat text lengths as coarse buckets", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Sam matches this role.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    render(<AIChat isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /content operations or AI education systems role/i }));

    await waitFor(() => {
      expect(screen.getByText("Sam matches this role.")).toBeInTheDocument();
    });

    expect(analyticsMock.track).toHaveBeenCalledWith(
      "ai_chat_message_sent",
      expect.objectContaining({ lengthBucket: "0-499" }),
    );
    expect(analyticsMock.track).toHaveBeenCalledWith(
      "ai_chat_response_received",
      expect.objectContaining({ lengthBucket: "0-499" }),
    );
    for (const [, properties] of analyticsMock.track.mock.calls) {
      expect(properties).not.toHaveProperty("questionLength");
      expect(properties).not.toHaveProperty("responseLength");
    }
  });

  it("re-enables the input after a 429 rate-limit response instead of locking up the chat", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "rate_limited",
          detail: "Slow down. You are sending messages faster than the burst limit allows.",
          limit: "5 requests per 60 seconds for /api/chat.",
          retryAfterSeconds: 12,
          graceful_boundary: { spec: "https://gracefulboundaries.dev/", level: 2 },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<AIChat isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /What's PAICE/i }));

    await screen.findByText(/Rate limit: 5 requests per 60 seconds/);
    expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();

    const input = screen.getByLabelText("Ask a follow-up question") as HTMLInputElement;
    expect(input.disabled).toBe(false);

    // Prove the chat is genuinely usable again, not just visually re-enabled.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("All clear.", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    fireEvent.change(input, { target: { value: "Try again" } });
    fireEvent.click(screen.getByLabelText("Send question"));
    await screen.findByText("All clear.");
  });

  it("keeps accumulated streamed text and flags it as interrupted on a mid-stream read failure", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let reads = 0;
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      body: {
        getReader: () => ({
          read: async () => {
            reads += 1;
            if (reads === 1) {
              return { done: false, value: new TextEncoder().encode("Sam has shipped ") };
            }
            throw new Error("network drop");
          },
        }),
      },
    } as unknown as Response);

    render(<AIChat isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /What's PAICE/i }));

    const message = await screen.findByText((_, node) =>
      Boolean(
        node?.tagName === "P" &&
          node?.textContent?.includes("Sam has shipped") &&
          node?.textContent?.includes("[Response interrupted") &&
          node?.textContent?.includes("connection dropped mid-answer."),
      ),
    );
    expect(message).toBeInTheDocument();

    // Must not fall back to the labeled "sample response" copy — the live partial
    // answer should be kept, not discarded.
    expect(screen.queryByText(/Sample response because the live AI endpoint/)).not.toBeInTheDocument();

    const input = screen.getByLabelText("Ask a follow-up question") as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it("silently trims the request payload to stay under the server's 20-message cap", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response("ok", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AIChat isOpen onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /What's PAICE/i }));
    await screen.findAllByText("ok");

    const input = screen.getByLabelText("Ask a follow-up question") as HTMLInputElement;
    for (let round = 0; round < 9; round += 1) {
      fireEvent.change(input, { target: { value: `Question number ${round}` } });
      fireEvent.click(screen.getByLabelText("Send question"));
      await screen.findAllByText("ok");
    }

    fetchMock.mockClear();
    fireEvent.change(input, { target: { value: "One more question that would push the request over the cap" } });
    fireEvent.click(screen.getByLabelText("Send question"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, requestInit] = fetchMock.mock.calls[0];
    const sentBody = JSON.parse((requestInit as RequestInit).body as string);

    expect(sentBody.messages.length).toBeLessThanOrEqual(20);
    expect(sentBody.messages[0].role).toBe("user");
    expect(
      sentBody.messages.some((m: { content: string }) => m.content === "One more question that would push the request over the cap"),
    ).toBe(true);
  });
});
