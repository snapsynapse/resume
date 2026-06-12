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
  });

  it("renders suggested recruiter questions", () => {
    render(<AIChat isOpen onClose={() => {}} />);

    expect(screen.getByText("Ask AI About Sam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /senior L&D or certification role/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /senior L&D or certification role/i }));

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
});
