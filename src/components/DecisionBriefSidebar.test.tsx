import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DecisionBriefSidebar from "./DecisionBriefSidebar";
import type { FitResult } from "./FitAssessment";

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock("@/lib/analytics", () => analyticsMock);

const localStorageMock = vi.hoisted(() => {
  let store: Record<string, string> = {};
  return {
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
});

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: localStorageMock,
});

const fitResult: FitResult = {
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
};

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

describe("DecisionBriefSidebar", () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("renders expanded recruiter copy blocks by default on desktop and tablet surfaces", () => {
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    const sidebar = screen.getByLabelText("Interview Decision Brief");
    expect(sidebar).toHaveClass("hidden");
    expect(sidebar).toHaveClass("lg:block");
    expect(sidebar).toHaveClass("sticky");
    expect(sidebar).toHaveClass("top-0");
    expect(sidebar).toHaveClass("z-[60]");
    expect(sidebar).toHaveClass("h-screen");
    expect(screen.getByText("Recruiter Summary")).toBeInTheDocument();
    expect(screen.getByText("Shortlist Rationale")).toBeInTheDocument();
    expect(screen.getByText(/YouTube certification 10x/i)).toBeInTheDocument();

    const copyButton = screen.getByRole("button", { name: "Copy recruiter summary" });
    expect(copyButton).toHaveClass("cursor-copy");

    // Blocks populate expanded by default; the toggle folds them individually.
    const toggle = screen.getByRole("button", { name: "Recruiter Summary" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", "decision-brief-content-summary");

    const region = document.getElementById("decision-brief-content-summary");
    expect(region).toHaveClass("max-h-[40rem]");
    expect(region?.querySelector(".bg-gradient-to-b")).not.toBeInTheDocument();
  });

  it("collapses and re-expands a block on tap without copying", () => {
    const writeText = mockClipboard();
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    const toggle = screen.getByRole("button", { name: "Recruiter Summary" });
    const region = document.getElementById("decision-brief-content-summary");

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveClass("max-h-[40rem]");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(region).toHaveClass("max-h-10");
    expect(region?.querySelector(".bg-gradient-to-b")).toBeInTheDocument();

    // Collapsing one block must not fold the others (multi-open, not accordion).
    expect(
      screen.getByRole("button", { name: "Shortlist Rationale" }),
    ).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).toHaveClass("max-h-[40rem]");

    // Toggling expansion must never trigger a clipboard copy.
    expect(writeText).not.toHaveBeenCalled();
  });

  it("opens the mobile brief overlay on the header broadcast event", () => {
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent(window, new CustomEvent("resume:open-interview-brief"));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Interview Decision Brief" }),
    ).toBeInTheDocument();
  });

  it("copies individual blocks with metadata-only analytics", async () => {
    const writeText = mockClipboard();
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy recruiter summary" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Recruiter Summary"));
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Sam Rogers is strongest"));
    expect(analyticsMock.track).toHaveBeenCalledWith("decision_brief_copied", {
      block: "summary",
      mode: "recruiter",
      fitVerdict: undefined,
    });

    const [, properties] = analyticsMock.track.mock.calls[0];
    expect(Object.keys(properties)).toEqual(["block", "mode", "fitVerdict"]);
  });

  it("copies all visible blocks", async () => {
    const writeText = mockClipboard();
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy all Interview Decision Brief blocks" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Recruiter Summary"));
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Interview Probes"));
    expect(analyticsMock.track).toHaveBeenCalledWith("decision_brief_copied", {
      block: "copy-all",
      mode: "recruiter",
      fitVerdict: undefined,
    });
  });

  it("remembers hiring manager mode locally", () => {
    const { unmount } = render(
      <DecisionBriefSidebar fitResult={null} hasJobDescription={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hiring Manager" }));
    expect(screen.getByText("Best Use Case")).toBeInTheDocument();

    unmount();
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);
    expect(screen.getByText("Best Use Case")).toBeInTheDocument();
  });

  it("remembers collapsed state locally", () => {
    const { unmount } = render(
      <DecisionBriefSidebar fitResult={null} hasJobDescription={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Collapse Interview Decision Brief" }));
    expect(screen.getByRole("button", { name: "Open Interview Decision Brief" })).toBeInTheDocument();

    unmount();
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription={false} />);
    expect(screen.getByRole("button", { name: "Open Interview Decision Brief" })).toBeInTheDocument();
  });

  it("switches to JD-tailored blocks after fit assessment returns", async () => {
    const writeText = mockClipboard();
    render(<DecisionBriefSidebar fitResult={fitResult} hasJobDescription />);

    expect(screen.getByText("Shortlist Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Certification architecture: Built and scaled YouTube certification.")).toBeInTheDocument();
    expect(screen.getByText("Direct ML infrastructure: Would need specialist engineering support.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy matched evidence" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Certification architecture"));
    });
    expect(analyticsMock.track).toHaveBeenCalledWith("decision_brief_copied", {
      block: "fit-matches",
      mode: "recruiter",
      fitVerdict: "strong",
    });
  });

  it("shows JD context without tailoring before analysis", () => {
    render(<DecisionBriefSidebar fitResult={null} hasJobDescription />);

    expect(screen.getByText(/Role context detected/i)).toBeInTheDocument();
    expect(screen.getByText("Recruiter Summary")).toBeInTheDocument();
    expect(screen.queryByText("Shortlist Recommendation")).not.toBeInTheDocument();
  });
});
