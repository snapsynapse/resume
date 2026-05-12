import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AIChat from "./AIChat";

describe("AIChat", () => {
  afterEach(() => {
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
});
