import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ShieldCheck, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyFlag, scanJD, type Flag } from "@/lib/jd-review";

interface JDReviewPanelProps {
  /** The pasted job description to review. */
  originalText: string;
  /** Called when the user confirms the reviewed text. */
  onConfirm: (reviewedText: string, meta: { flagCount: number; edited: boolean }) => void;
  /** Fired the first time the user expands the panel. */
  onOpened?: () => void;
}

const CHECKLIST = [
  "I removed non-public client, internal project, search, or strategy details.",
  "I kept useful public context like company, role, tools, responsibilities, and published salary information.",
  "Use this reviewed JD for fit analysis.",
];

const confidenceTone: Record<Flag["confidence"], string> = {
  high: "bg-warning-muted border-warning/30 text-warning",
  medium: "bg-secondary border-border text-muted-foreground",
};

interface AppliedReplacement {
  id: string;
  original: string;
  placeholder: string;
}

function renderHighlightedText(text: string, flags: Flag[]) {
  if (flags.length === 0) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const flag of flags) {
    if (cursor < flag.start) {
      parts.push(text.slice(cursor, flag.start));
    }
    parts.push(
      <mark
        key={flag.id}
        className="rounded bg-warning-muted px-1 py-0.5 text-warning"
      >
        {text.slice(flag.start, flag.end)}
      </mark>,
    );
    cursor = flag.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

const JDReviewPanel = ({ originalText, onConfirm, onOpened }: JDReviewPanelProps) => {
  const [open, setOpen] = useState(false);
  const [workingText, setWorkingText] = useState(originalText);
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const [appliedReplacements, setAppliedReplacements] = useState<AppliedReplacement[]>([]);
  const openedOnce = useRef(false);

  // Reset the working copy whenever a fresh JD is pasted.
  useEffect(() => {
    setWorkingText(originalText);
    setChecked(CHECKLIST.map(() => false));
    setAppliedReplacements([]);
  }, [originalText]);

  // Live flags against the working text — applied placeholders drop out,
  // newly typed sensitive text gets caught.
  const flags = useMemo(() => scanJD(workingText), [workingText]);
  // Candidate count from the original paste, reported to analytics only.
  const initialFlagCount = useMemo(() => scanJD(originalText).length, [originalText]);

  const edited = workingText !== originalText;
  const allChecked = checked.every(Boolean);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !openedOnce.current) {
      openedOnce.current = true;
      onOpened?.();
    }
  };

  const handleApply = (flag: Flag) => {
    setWorkingText((current) => applyFlag(current, flag));
    setAppliedReplacements((current) => [
      ...current,
      {
        id: flag.id,
        original: flag.match,
        placeholder: flag.placeholder,
      },
    ]);
  };

  const handleUndo = (replacement: AppliedReplacement) => {
    setWorkingText((current) =>
      current.replace(replacement.placeholder, replacement.original),
    );
    setAppliedReplacements((current) =>
      current.filter((item) => item.id !== replacement.id),
    );
  };

  const handleConfirm = () => {
    onConfirm(workingText.trim(), { flagCount: initialFlagCount, edited });
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-secondary/40">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="jd-review-body"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ShieldCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">
          Review business-sensitive details
        </span>
        {flags.length > 0 ? (
          <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs font-medium text-warning">
            {flags.length} to review
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Nothing flagged</span>
        )}
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id="jd-review-body" className="border-t border-border px-4 py-4">
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Company name, public tools, public products, salary ranges, responsibilities, and
            skills usually help the assessment. This review looks for non-public details like
            internal codes, confidential searches, client names, and unreleased plans. It is risk
            reduction and transparency, not anonymization, compliance certification, or legal
            advice.
          </p>

          {flags.length > 0 ? (
            <>
              <div
                aria-label="Flagged job description preview"
                className="mb-5 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-3 font-mono text-xs leading-relaxed text-foreground"
              >
                {renderHighlightedText(workingText, flags)}
              </div>
              <ul className="mb-5 space-y-3">
                {flags.map((flag) => (
                  <li
                    key={flag.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground break-all">
                            {flag.match}
                          </code>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                              confidenceTone[flag.confidence],
                            )}
                          >
                            {flag.confidence === "high" ? "Likely" : "Maybe"}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                          {flag.explanation}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApply(flag)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent transition-colors"
                      >
                        <Wand2 className="h-3 w-3" aria-hidden="true" />
                        <span className="whitespace-nowrap">{flag.placeholder}</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mb-5 rounded-lg border border-border bg-card px-3 py-3 text-xs text-muted-foreground">
              No non-public business details detected. Read through the text below and edit
              anything the scanner may have missed.
            </p>
          )}

          {appliedReplacements.length > 0 && (
            <div className="mb-5 rounded-lg border border-border bg-card p-3">
              <h3 className="text-xs font-medium text-foreground">
                Applied replacements
              </h3>
              <ul className="mt-2 space-y-2">
                {appliedReplacements.map((replacement) => (
                  <li
                    key={replacement.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
                  >
                    <span>
                      <code className="rounded bg-secondary px-1 py-0.5 text-foreground">
                        {replacement.original}
                      </code>{" "}
                      replaced with{" "}
                      <code className="rounded bg-secondary px-1 py-0.5 text-foreground">
                        {replacement.placeholder}
                      </code>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUndo(replacement)}
                      className="rounded-lg border border-border bg-secondary px-2.5 py-1.5 font-medium text-foreground hover:border-accent transition-colors"
                    >
                      Undo
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label htmlFor="jd-reviewed-text" className="mb-1.5 block text-xs font-medium text-foreground">
            Reviewed job description (editable)
          </label>
          <textarea
            id="jd-reviewed-text"
            value={workingText}
            onChange={(e) => setWorkingText(e.target.value)}
            rows={8}
            className="w-full resize-y rounded-xl border border-border bg-secondary p-3 font-mono text-xs leading-relaxed text-foreground focus:border-accent focus:outline-none"
          />

          <fieldset className="mt-4">
            <legend className="sr-only">Confirm before using the reviewed job description</legend>
            <div className="space-y-2">
              {CHECKLIST.map((item, i) => (
                <label key={i} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={checked[i]}
                    onChange={(e) =>
                      setChecked((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))
                    }
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-accent"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!allChecked}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Use reviewed JD
          </button>
        </div>
      )}
    </div>
  );
};

export default JDReviewPanel;
