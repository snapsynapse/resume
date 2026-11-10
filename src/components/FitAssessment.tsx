import { lazy, Suspense, useState, type ClipboardEvent, type ReactNode } from "react";
import { FileText, Check, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { lengthBucket, scanJD } from "@/lib/jd-review";
import { isFitResult, type FitResult } from "@/lib/fit-result";

export type { FitResult } from "@/lib/fit-result";

const JDReviewPanel = lazy(() => import("./JDReviewPanel"));

interface FitAssessmentProps {
  onResult?: (result: FitResult | null) => void;
  onJobDescriptionStateChange?: (hasJobDescription: boolean) => void;
}

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 8000;

const JOB_BOARD_STOP_MARKERS = [
  "How we're different",
  "Create a Job Alert",
  "Apply for this job",
  "Voluntary Self-Identification",
  "Submit application",
  "Powered by",
];

function cleanPastedJobDescription(text: string) {
  let cleaned = text.replace(/\r\n?/g, "\n");
  let trimmedByMarker = false;

  const markerPositions = JOB_BOARD_STOP_MARKERS
    .map((marker) => cleaned.indexOf(marker))
    .filter((index) => index > 0);
  if (markerPositions.length > 0) {
    cleaned = cleaned.slice(0, Math.min(...markerPositions));
    trimmedByMarker = true;
  }

  cleaned = cleaned
    .split("\n")
    .filter((line) => {
      const value = line.trim();
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}, .*Job Application for /i.test(value)) {
        return false;
      }
      if (/^https:\/\/job-boards\.greenhouse\.io\//i.test(value)) return false;
      if (/^\d+\/\d+$/.test(value)) return false;
      if (["Back to jobs", "New", "Apply"].includes(value)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text: cleaned, trimmedByMarker };
}

const FitAssessment = ({
  onResult,
  onJobDescriptionStateChange,
}: FitAssessmentProps) => {
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [reviewEnabled, setReviewEnabled] = useState(true);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);

  const showReviewPanel =
    reviewEnabled && !reviewConfirmed && jobDescription.trim().length >= MIN_JD_LENGTH;
  // Only gate Analyze on an unresolved review when there's something flagged to
  // resolve — an empty "Nothing flagged" panel shouldn't force a confirmation click.
  const reviewGateActive = showReviewPanel && scanJD(jobDescription).length > 0;

  const handleJDChange = (value: string) => {
    setJobDescription(value);
    setPasteNotice(null);
    onJobDescriptionStateChange?.(value.trim().length >= MIN_JD_LENGTH);
    if (result) {
      setResult(null);
      onResult?.(null);
    }
    // Editing the text invalidates a prior confirmation.
    if (reviewConfirmed) setReviewConfirmed(false);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;

    const { text, trimmedByMarker } = cleanPastedJobDescription(pasted);
    const target = event.currentTarget;
    const selectionStart = target.selectionStart ?? jobDescription.length;
    const selectionEnd = target.selectionEnd ?? jobDescription.length;
    const nextValue = `${jobDescription.slice(0, selectionStart)}${text}${jobDescription.slice(selectionEnd)}`;
    const overLimit = nextValue.length > MAX_JD_LENGTH;
    const finalValue = overLimit ? nextValue.slice(0, MAX_JD_LENGTH) : nextValue;

    if (trimmedByMarker || overLimit || pasted !== text) {
      event.preventDefault();
      handleJDChange(finalValue);
      if (trimmedByMarker) {
        setPasteNotice(
          "Cleaned pasted job-board/PDF text and kept the role description before application-form content.",
        );
      } else if (overLimit) {
        setPasteNotice(
          `Pasted text exceeded ${MAX_JD_LENGTH} characters, so only the first ${MAX_JD_LENGTH} characters were kept.`,
        );
      } else {
        setPasteNotice("Cleaned pasted PDF/job-board formatting before analysis.");
      }
    }
  };

  const handleToggleReview = () => {
    const next = !reviewEnabled;
    setReviewEnabled(next);
    if (!next) {
      setReviewConfirmed(false);
      track("jd_review_skipped", { lengthBucket: lengthBucket(jobDescription.trim().length) });
    }
  };

  const handleReviewConfirm = (
    reviewedText: string,
    meta: { flagCount: number; edited: boolean },
  ) => {
    // Discard the original by overwriting the only state that holds it.
    setJobDescription(reviewedText);
    setReviewConfirmed(true);
    track("jd_review_completed", {
      flagCount: meta.flagCount,
      edited: meta.edited,
      lengthBucket: lengthBucket(reviewedText.length),
    });
  };

  const handleAnalyze = async () => {
    const jd = jobDescription.trim();
    if (jd.length < MIN_JD_LENGTH) {
      setError(`Paste at least ${MIN_JD_LENGTH} characters of the job description.`);
      return;
    }
    // Defense in depth: the Analyze button is already disabled while there
    // are unresolved flags (see reviewGateActive), but never send the
    // original, unreviewed text if this is somehow reached anyway.
    if (reviewGateActive) {
      setError("Confirm or dismiss the review first.");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    onResult?.(null);
    setError(null);
    track("fit_assessment_started", { lengthBucket: lengthBucket(jd.length) });

    try {
      const res = await fetch("/api/analyze-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 && typeof data.detail === "string") {
          setError(
            `${data.detail} (Retry in ~${data.retryAfterSeconds ?? 0}s.)`,
          );
        } else {
          setError(data.detail || data.error || `Server returned HTTP ${res.status}.`);
        }
        track("fit_assessment_failed", { status: res.status });
        return;
      }

      const data: unknown = await res.json();
      if (!isFitResult(data)) {
        setError("The assessment response was invalid. Try again or email Sam for a manual review.");
        track("fit_assessment_failed", { status: "invalid_response" });
        return;
      }
      setResult(data);
      onResult?.(data);
      track("fit_assessment_completed", { verdict: data.verdict });
    } catch (err) {
      setError("Something went wrong. Email hire@sam-rogers.com with the JD and I'll review it manually.");
      track("fit_assessment_failed", { status: "network" });
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const verdictTone =
    result?.verdict === "strong"
      ? { wrap: "bg-success-muted border-success/30", icon: "bg-success/20", iconColor: "text-success", title: "text-success" }
      : result?.verdict === "weak"
        ? { wrap: "bg-warning-muted border-warning/30", icon: "bg-warning/20", iconColor: "text-warning", title: "text-warning" }
        : { wrap: "bg-secondary border-border", icon: "bg-muted", iconColor: "text-foreground", title: "text-foreground" };

  return (
    <section id="fit-assessment" aria-labelledby="fit-assessment-heading" className="scroll-mt-24 py-24 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h2 id="fit-assessment-heading" className="mb-4 font-serif text-4xl text-foreground md:text-5xl">
            Fit Assessment
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Paste a job description and see where my evidence matches, where it doesn't, and what I'd recommend.
          </p>
        </header>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-6">
            <p className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                <FileText className="h-4 w-4 text-accent" />
              </span>
              Paste the full job description (50-8000 characters)
            </p>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Job descriptions are sent to the configured cloud LLM provider for analysis and are not intentionally stored by this app. Do not paste confidential, proprietary, regulated, or unreleased role data. For sensitive roles, email hire@sam-rogers.com instead.
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => handleJDChange(e.target.value)}
              onPaste={handlePaste}
              placeholder="Paste the JD here — title, requirements, responsibilities, anything that defines the role..."
              disabled={analyzing}
              rows={10}
              maxLength={MAX_JD_LENGTH}
              aria-label="Job description"
              aria-describedby="jd-privacy-note"
              className="w-full bg-secondary rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-accent focus:outline-hidden transition-colors disabled:opacity-50 resize-y font-mono leading-relaxed"
            />
            <span id="jd-privacy-note" className="sr-only">
              Job descriptions are sent to the configured cloud LLM provider for analysis and are not intentionally stored by this app. Do not paste confidential, proprietary, regulated, or unreleased role data.
            </span>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {jobDescription.length} / {MAX_JD_LENGTH} characters
              </span>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || jobDescription.trim().length < MIN_JD_LENGTH || reviewGateActive}
                aria-describedby={reviewGateActive ? "jd-review-gate-note" : undefined}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze fit</span>
                  </>
                )}
              </button>
            </div>
            {reviewGateActive && (
              <p
                id="jd-review-gate-note"
                className="mt-4 text-sm text-muted-foreground bg-secondary border border-border rounded-lg px-4 py-3"
              >
                Confirm or dismiss the review first. The Analyze button unlocks once you use the
                reviewed job description below, or uncheck "Review business-sensitive details" to
                send the original text as pasted.
              </p>
            )}
            {error && (
              <p className="mt-4 text-sm text-warning bg-warning-muted border border-warning/20 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
            {pasteNotice && (
              <p className="mt-4 text-sm text-muted-foreground bg-secondary border border-border rounded-lg px-4 py-3">
                {pasteNotice}
              </p>
            )}

            <label className="mt-4 flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={reviewEnabled}
                onChange={handleToggleReview}
                className="h-3.5 w-3.5 shrink-0 accent-accent"
              />
              <span>Review business-sensitive details before analysis.</span>
            </label>

            {showReviewPanel && (
              <Suspense
                fallback={
                  <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                    Loading review panel...
                  </div>
                }
              >
                <JDReviewPanel
                  originalText={jobDescription}
                  onConfirm={handleReviewConfirm}
                  onOpened={() =>
                    track("jd_review_panel_opened", {
                      lengthBucket: lengthBucket(jobDescription.trim().length),
                    })
                  }
                />
              </Suspense>
            )}

            {reviewEnabled && reviewConfirmed && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-success-muted border border-success/30 px-3 py-2 text-xs text-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Reviewed JD ready. Click Analyze fit to continue.
              </p>
            )}
          </div>

          <div className="p-6">
            {analyzing && !result ? (
              <p className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
                Reading the JD against 25 years of track record...
              </p>
            ) : null}

            {result && !analyzing ? <FitResultView result={result} tone={verdictTone} /> : null}

            {!result && !analyzing && !error ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Paste a JD above and click Analyze fit.</p>
            ) : null}
          </div>
        </div>

        <aside className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-card p-6 text-center leading-relaxed text-muted-foreground">
          <p className="mb-4">This tool exists so you can check fit before spending a call on it.</p>
          <p className="font-medium text-foreground">Honest answers here save both of us an interview loop.</p>
        </aside>
      </div>
    </section>
  );
};

type VerdictTone = { wrap: string; icon: string; iconColor: string; title: string };

const VERDICT_ICON = { strong: Check, weak: AlertTriangle } as const;

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{children}</h3>
);

// Matches and gaps share one layout: a marked row with a bold lead line and a supporting line.
const EvidenceList = ({
  label,
  mark,
  markColor,
  rows,
}: {
  label: string;
  mark: string;
  markColor: string;
  rows: ReadonlyArray<{ lead: string; detail: string }>;
}) => (
  <section className="mb-6">
    <SectionLabel>{label}</SectionLabel>
    <ul className="space-y-4">
      {rows.map(({ lead, detail }, i) => (
        <li key={`${i}-${lead}`} className="flex items-start gap-3 rounded-xl border border-border bg-secondary p-4">
          <span aria-hidden="true" className={cn("mt-0.5", markColor)}>{mark}</span>
          <div>
            <p className="mb-1.5 font-medium text-foreground">{lead}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

const FitResultView = ({ result, tone }: { result: FitResult; tone: VerdictTone }) => {
  const Icon = result.verdict === "strong" || result.verdict === "weak" ? VERDICT_ICON[result.verdict] : Sparkles;
  return (
    <div className="animate-slide-up">
      <div className={cn("mb-6 flex items-center gap-4 rounded-xl border p-4", tone.wrap)}>
        <span aria-hidden="true" className={cn("flex h-12 w-12 items-center justify-center rounded-full", tone.icon)}>
          <Icon className={cn("h-6 w-6", tone.iconColor)} />
        </span>
        <div>
          <h3 className={cn("font-serif text-xl", tone.title)}>{result.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{result.summary}</p>
        </div>
      </div>

      {result.matches.length > 0 ? (
        <EvidenceList
          label="Where I match"
          mark="✓"
          markColor="text-success"
          rows={result.matches.map((m) => ({ lead: m.requirement, detail: m.evidence }))}
        />
      ) : null}

      {result.gaps.length > 0 ? (
        <EvidenceList
          label="Gaps to name"
          mark="○"
          markColor="text-warning"
          rows={result.gaps.map((g) => ({ lead: g.area, detail: g.note }))}
        />
      ) : null}

      {result.whatTransfers ? (
        <section className="mb-6 rounded-xl border border-border bg-secondary p-4">
          <SectionLabel>What does transfer</SectionLabel>
          <p className="text-sm leading-relaxed text-foreground">{result.whatTransfers}</p>
        </section>
      ) : null}

      <section className={cn("rounded-xl border p-4", tone.wrap)}>
        <SectionLabel>My recommendation</SectionLabel>
        <p className={cn("leading-relaxed", tone.title)}>{result.recommendation}</p>
      </section>
    </div>
  );
};

export default FitAssessment;
