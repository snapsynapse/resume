import { useState } from "react";
import { FileText, Check, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Verdict = "strong" | "moderate" | "weak";

interface FitResult {
  verdict: Verdict;
  title: string;
  summary: string;
  matches: { requirement: string; evidence: string }[];
  gaps: { area: string; note: string }[];
  whatTransfers: string;
  recommendation: string;
}

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 8000;

const FitAssessment = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const jd = jobDescription.trim();
    if (jd.length < MIN_JD_LENGTH) {
      setError(`Paste at least ${MIN_JD_LENGTH} characters of the job description.`);
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429 && data.graceful_boundary) {
          setError(
            `${data.graceful_boundary.message} (Retry in ~${data.graceful_boundary.retry_after_seconds}s.)`,
          );
        } else {
          setError(data.error || `Server returned HTTP ${res.status}.`);
        }
        return;
      }

      const data: FitResult = await res.json();
      setResult(data);
    } catch (err) {
      setError("Something went wrong. Email sam@sam-rogers.com with the JD and I'll review it manually.");
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
    <section id="fit-assessment" className="py-24 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
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
                Paste the full job description (50–8000 characters)
              </span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the JD here — title, requirements, responsibilities, anything that defines the role..."
              disabled={analyzing}
              rows={10}
              maxLength={MAX_JD_LENGTH}
              className="w-full bg-secondary rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-accent focus:outline-none transition-colors disabled:opacity-50 resize-y font-mono leading-relaxed"
            />
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
                    <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Where I match
                    </h4>
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
                    <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      Gaps to name
                    </h4>
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
                    <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                      What does transfer
                    </h4>
                    <p className="text-foreground text-sm leading-relaxed">{result.whatTransfers}</p>
                  </div>
                )}

                <div className={cn("p-4 rounded-xl border", verdictTone.wrap)}>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    My recommendation
                  </h4>
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
