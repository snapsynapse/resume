import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JDReviewPanel from "./JDReviewPanel";

const JD =
  "We are running a confidential search to lead Project Atlas. Req REQ-12345. Reports to Jane Smith.";

describe("JDReviewPanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a flag count badge while collapsed", () => {
    render(<JDReviewPanel originalText={JD} onConfirm={vi.fn()} />);
    expect(screen.getByText(/to review/i)).toBeInTheDocument();
  });

  it("fires onOpened the first time the panel expands", () => {
    const onOpened = vi.fn();
    render(<JDReviewPanel originalText={JD} onConfirm={vi.fn()} onOpened={onOpened} />);
    fireEvent.click(screen.getByRole("button", { name: /review business-sensitive details/i }));
    fireEvent.click(screen.getByRole("button", { name: /review business-sensitive details/i }));
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it("applies a placeholder and removes the flag from the list", () => {
    render(<JDReviewPanel originalText={JD} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /review business-sensitive details/i }));

    const applyReqCode = screen.getByRole("button", { name: /\[INTERNAL JOB CODE\]/ });
    fireEvent.click(applyReqCode);

    const textarea = screen.getByLabelText(/reviewed job description/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("[INTERNAL JOB CODE]");
    expect(textarea.value).not.toContain("REQ-12345");
  });

  it("gates the confirm button behind the checklist and returns reviewed text", () => {
    const onConfirm = vi.fn();
    render(<JDReviewPanel originalText={JD} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /review business-sensitive details/i }));

    const confirm = screen.getByRole("button", { name: /use reviewed jd/i });
    expect(confirm).toBeDisabled();

    screen.getAllByRole("checkbox").forEach((box) => fireEvent.click(box));
    expect(confirm).toBeEnabled();

    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [reviewedText, meta] = onConfirm.mock.calls[0];
    expect(typeof reviewedText).toBe("string");
    expect(meta.flagCount).toBeGreaterThan(0);
    expect(meta.edited).toBe(false);
  });

  it("reports edited=true after a manual edit", () => {
    const onConfirm = vi.fn();
    render(<JDReviewPanel originalText={JD} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /review business-sensitive details/i }));

    fireEvent.change(screen.getByLabelText(/reviewed job description/i), {
      target: { value: "Edited job description text for the role." },
    });
    screen.getAllByRole("checkbox").forEach((box) => fireEvent.click(box));
    fireEvent.click(screen.getByRole("button", { name: /use reviewed jd/i }));

    expect(onConfirm.mock.calls[0][1].edited).toBe(true);
  });
});
