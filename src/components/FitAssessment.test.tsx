import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import FitAssessment from "./FitAssessment";

const analyticsMock = vi.hoisted(() => ({
  track: vi.fn(),
}));

vi.mock("@/lib/analytics", () => analyticsMock);

describe("FitAssessment", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
    expect(analyticsMock.track).toHaveBeenCalledWith(
      "fit_assessment_started",
      { lengthBucket: "0-499" },
    );
    expect(screen.getByText("Certification design")).toBeInTheDocument();
    expect(screen.getByText("Direct team size")).toBeInTheDocument();
    expect(screen.getByText("Talk next.")).toBeInTheDocument();
  });

  it("flags business-sensitive details and sends only the reviewed JD", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          verdict: "moderate",
          title: "Possible Fit",
          summary: "Reviewed.",
          matches: [],
          gaps: [],
          whatTransfers: "",
          recommendation: "Maybe.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<FitAssessment />);

    fireEvent.change(screen.getByLabelText("Job description"), {
      target: {
        value:
          "Confidential search for a senior leader. Requisition REQ-12345 to lead Project Atlas across the org.",
      },
    });

    // Review is on by default; the panel shows a flag count badge.
    expect(await screen.findByText(/to review/i)).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /review business-sensitive details/i }));
    fireEvent.click(await screen.findByRole("button", { name: /\[INTERNAL JOB CODE\]/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I removed non-public/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I kept useful public context/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Use this reviewed JD/i }));
    fireEvent.click(screen.getByRole("button", { name: /use reviewed jd/i }));

    // Original requisition code is discarded from the editable text.
    const textarea = screen.getByLabelText("Job description") as HTMLTextAreaElement;
    expect(textarea.value).toContain("[INTERNAL JOB CODE]");
    expect(textarea.value).not.toContain("REQ-12345");

    fireEvent.click(screen.getByRole("button", { name: /analyze fit/i }));

    await waitFor(() => {
      expect(screen.getByText("Possible Fit")).toBeInTheDocument();
    });

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.jobDescription).toContain("[INTERNAL JOB CODE]");
    expect(body.jobDescription).not.toContain("REQ-12345");
  });

  it("skips the review panel when the toggle is turned off", async () => {
    render(<FitAssessment />);

    fireEvent.change(screen.getByLabelText("Job description"), {
      target: {
        value:
          "Confidential search for a senior leader. Requisition REQ-12345 to lead Project Atlas across the org.",
      },
    });
    expect(await screen.findByText(/to review/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /review business-sensitive details before analysis/i }),
    );
    expect(screen.queryByText(/to review/i)).not.toBeInTheDocument();
  });

  it("cleans pasted job-board PDF text before application form content", () => {
    render(<FitAssessment />);

    const textarea = screen.getByLabelText("Job description") as HTMLTextAreaElement;
    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () =>
          [
            "5/10/26, 1:57 PM",
            "Job Application for Head of Content & Curriculum, Education at Anthropic",
            "https://job-boards.greenhouse.io/anthropic/jobs/5207861008?gh_src=LinkedIn",
            "1/10",
            "Head of Content & Curriculum, Education",
            "About the role",
            "Build innovative, Claude-enabled learning experiences that Ants actually use.",
            "Minimum qualifications",
            "Deep experience in curriculum, content quality, and learning measurement at high-growth tech companies.",
            "How we're different",
            "Generic company boilerplate that should not be needed for fit analysis.",
            "Apply for this job",
            "First Name *",
          ].join("\n"),
      },
    });

    expect(textarea.value).toContain("Head of Content & Curriculum, Education");
    expect(textarea.value).toContain("Minimum qualifications");
    expect(textarea.value).not.toContain("https://job-boards.greenhouse.io");
    expect(textarea.value).not.toContain("How we're different");
    expect(textarea.value).not.toContain("First Name");
    expect(
      screen.getByText(/kept the role description before application-form content/i),
    ).toBeInTheDocument();
  });

  it("warns instead of silently truncating long pasted text", () => {
    render(<FitAssessment />);

    const textarea = screen.getByLabelText("Job description") as HTMLTextAreaElement;
    fireEvent.paste(textarea, {
      clipboardData: {
        getData: () => "Senior learning leader ".repeat(500),
      },
    });

    expect(textarea.value.length).toBe(8000);
    expect(screen.getByText(/exceeded 8000 characters/i)).toBeInTheDocument();
  });

  it("keeps review analytics payloads metadata-only", async () => {
    const sensitiveJD =
      "Confidential search for Jane Smith. Requisition REQ-88888 to lead Project Atlas for the Acme Bank rollout.";
    const leakedTerms = [
      "Confidential",
      "Jane Smith",
      "REQ-88888",
      "Project Atlas",
      "Acme Bank",
      "[INTERNAL JOB CODE]",
    ];
    const allowedKeys = new Set(["flagCount", "lengthBucket", "edited"]);

    render(<FitAssessment />);

    fireEvent.change(screen.getByLabelText("Job description"), {
      target: { value: sensitiveJD },
    });
    fireEvent.click(await screen.findByRole("button", { name: /review business-sensitive details/i }));
    fireEvent.click(await screen.findByRole("button", { name: /\[INTERNAL JOB CODE\]/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I removed non-public/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /I kept useful public context/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Use this reviewed JD/i }));
    fireEvent.click(screen.getByRole("button", { name: /use reviewed jd/i }));

    const reviewEvents = analyticsMock.track.mock.calls.filter(([event]) =>
      String(event).startsWith("jd_review_"),
    );
    expect(reviewEvents.map(([event]) => event)).toEqual([
      "jd_review_panel_opened",
      "jd_review_completed",
    ]);

    for (const [, properties] of reviewEvents) {
      expect(properties).toBeDefined();
      expect(Object.keys(properties as Record<string, unknown>).every((key) => allowedKeys.has(key))).toBe(true);

      for (const value of Object.values(properties as Record<string, unknown>)) {
        if (typeof value !== "string") continue;
        for (const term of leakedTerms) {
          expect(value).not.toContain(term);
        }
      }
    }
  });
});
