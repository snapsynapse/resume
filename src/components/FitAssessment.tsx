import { useState, type ClipboardEvent } from "react";
import { FileText, Check, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { lengthBucket } from "@/lib/jd-review";
import JDReviewPanel from "./JDReviewPanel";

type Verdict = "strong" | "moderate" | "weak";

export interface FitResult {
  verdict: Verdict;
  title: string;
  summary: string;
  matches: { requirement: string; evidence: string }[];
  gaps: { area: string; note: string }[];
  whatTransfers: string;
  recommendation: string;
}

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
    setAnalyzing(true);
    setResult(null);
    onResult?.(null);
    setError(null);
    track("fit_assessment_started", { descriptionLength: jd.length });

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

      const data: FitResult = await res.json();
      setResult(data);
      onResult?.(data);
      track("fit_assessment_completed", { verdict: data.verdict });
    } catch (err) {
      setError("Something went wrong. Email sam@sam-rogers.com with the JD and I'll review it manually.");
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
    <section id="fit-assessment" aria-labelledby="fit-assessment-heading" className="py-24 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="fit-assessment-heading" className="text-4xl md:text-5xl font-serif text-foreground mb-4">
            Honest Fit Assessment
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Paste a job description. Get an honest assessment of whether I'm the right person — including when I'm not.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">
                Paste the full job description (50-8000 characters)
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Job descriptions are sent to Anthropic for analysis and are not intentionally stored by this app. Do not paste confidential, proprietary, regulated, or unreleased role data. For sensitive roles, email sam@sam-rogers.com instead.
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
              className="w-full bg-secondary rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-accent focus:outline-none transition-colors disabled:opacity-50 resize-y font-mono leading-relaxed"
            />
            <span id="jd-privacy-note" className="sr-only">
              Job descriptions are sent to Anthropic for analysis and are not intentionally stored by this app. Do not paste confidential, proprietary, regulated, or unreleased role data.
            </span>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {jobDescription.length} / {MAX_JD_LENGTH} characters
              </span>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || jobDescription.trim().length < MIN_JD_LENGTH}
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
              <JDReviewPanel
                originalText={jobDescription}
                onConfirm={handleReviewConfirm}
                onOpened={() =>
                  track("jd_review_panel_opened", {
                    lengthBucket: lengthBucket(jobDescription.trim().length),
                  })
                }
              />
            )}

            {reviewEnabled && reviewConfirmed && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-success-muted border border-success/30 px-3 py-2 text-xs text-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Reviewed JD ready. Click Analyze fit to continue.
              </p>
            )}
          </div>

          <div className="p-6">
            {analyzing && !result && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Reading the JD against 25 years of track record...</span>
                </div>
              </div>
            )}

            {result && !analyzing && (
              <div className="animate-slide-up">
                <div className={cn("flex items-center gap-4 mb-6 p-4 rounded-xl border", verdictTone.wrap)}>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", verdictTone.icon)}>
                    {result.verdict === "strong" ? (
                      <Check className={cn("w-6 h-6", verdictTone.iconColor)} />
                    ) : result.verdict === "weak" ? (
                      <AlertTriangle className={cn("w-6 h-6", verdictTone.iconColor)} />
                    ) : (
                      <Sparkles className={cn("w-6 h-6", verdictTone.iconColor)} />
                    )}
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-serif", verdictTone.title)}>{result.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{result.summary}</p>
                  </div>
                </div>

                {result.matches.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Where I match
                    </h3>
                    {result.matches.map((m, i) => (
                      <div key={i} className="p-4 bg-secondary rounded-xl border border-border">
                        <div className="flex items-start gap-3">
                          <span className="text-success mt-0.5">✓</span>
                          <div>
                            <p className="text-foreground font-medium mb-2">{m.requirement}</p>
                            <p className="text-muted-foreground text-sm leading-relaxed">{m.evidence}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.gaps.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Gaps to name
                    </h3>
                    {result.gaps.map((g, i) => (
                      <div key={i} className="p-4 bg-secondary rounded-xl border border-border">
                        <div className="flex items-start gap-3">
                          <span className="text-warning mt-0.5">○</span>
                          <div>
                            <p className="text-foreground font-medium mb-1">{g.area}</p>
                            <p className="text-muted-foreground text-sm">{g.note}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.whatTransfers && (
                  <div className="p-4 bg-secondary rounded-xl border border-border mb-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      What does transfer
                    </h3>
                    <p className="text-foreground text-sm leading-relaxed">{result.whatTransfers}</p>
                  </div>
                )}

                <div className={cn("p-4 rounded-xl border", verdictTone.wrap)}>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    My recommendation
                  </h3>
                  <p className={cn("leading-relaxed", verdictTone.title)}>{result.recommendation}</p>
                </div>
              </div>
            )}

            {!result && !analyzing && !error && (
              <p className="text-center text-muted-foreground text-sm py-6">
                Paste a JD above and click Analyze fit.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-block p-6 bg-card rounded-2xl border border-border max-w-2xl">
            <p className="text-muted-foreground leading-relaxed">
              This signals something completely different than "please consider my resume."
              <br />
              <br />
              <span className="text-foreground font-medium">
                You're qualifying me. Your time is valuable too.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FitAssessment;
