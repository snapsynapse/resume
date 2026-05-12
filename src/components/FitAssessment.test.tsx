import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FitAssessment from "./FitAssessment";

describe("FitAssessment", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks short job descriptions", () => {
    render(<FitAssessment />);

    fireEvent.change(screen.getByLabelText("Job description"), {
      target: { value: "Too short" },
    });

    expect(screen.getByRole("button", { name: /analyze fit/i })).toBeDisabled();
  });

  it("renders structured fit results", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verdict: "strong",
          title: "Strong Fit",
          summary: "This role maps well.",
          matches: [{ requirement: "Certification design", evidence: "Built certification systems." }],
          gaps: [{ area: "Direct team size", note: "Limited formal direct reports." }],
          whatTransfers: "Performance consulting transfers.",
          recommendation: "Talk next.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<FitAssessment />);

    fireEvent.change(screen.getByLabelText("Job description"), {
      target: {
        value:
          "We need a senior learning leader to design certification programs, enable technical teams, and evaluate role fit across AI workflows.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze fit/i }));

    await waitFor(() => {
      expect(screen.getByText("Strong Fit")).toBeInTheDocument();
    });
    expect(screen.getByText("Certification design")).toBeInTheDocument();
    expect(screen.getByText("Direct team size")).toBeInTheDocument();
    expect(screen.getByText("Talk next.")).toBeInTheDocument();
  });
});
