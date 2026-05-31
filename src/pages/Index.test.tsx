import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Index from "./Index";

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock("@/lib/analytics", () => analyticsMock);

describe("Index Interview Decision Brief integration", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("clears JD-tailored sidebar blocks when the JD is edited after analysis", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verdict: "strong",
          title: "Strong Fit",
          summary: "The role maps well to certification and governance adoption.",
          matches: [
            {
              requirement: "Certification architecture",
              evidence: "Built and scaled YouTube certification.",
            },
          ],
          gaps: [
            {
              area: "Direct ML infrastructure",
              note: "Would need specialist engineering support.",
            },
          ],
          whatTransfers: "Governance and enablement systems transfer.",
          recommendation: "Shortlist for a focused conversation.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<Index />);

    const textarea = await screen.findByLabelText("Job description");
    fireEvent.change(textarea, {
      target: {
        value:
          "We need a senior leader to build certification architecture, governance enablement, and cross-functional AI adoption measurement across teams.",
      },
    });

    expect(screen.getByText(/Role context detected/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /analyze fit/i }));

    await waitFor(() => {
      expect(screen.getByText("Shortlist Recommendation")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Certification architecture")).toHaveLength(1);
    expect(screen.getByText("Certification architecture: Built and scaled YouTube certification.")).toBeInTheDocument();

    fireEvent.change(textarea, {
      target: {
        value:
          "We now need a different senior leader focused on learning systems, capability measurement, and regulated AI adoption across business functions.",
      },
    });

    expect(screen.queryByText("Shortlist Recommendation")).not.toBeInTheDocument();
    expect(screen.queryByText("Certification architecture: Built and scaled YouTube certification.")).not.toBeInTheDocument();
    expect(screen.getByText("Recruiter Summary")).toBeInTheDocument();
    expect(screen.getByText(/Role context detected/i)).toBeInTheDocument();
  });
});
