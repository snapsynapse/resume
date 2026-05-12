import { useState } from "react";
import { FileText, Check, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fitAssessments } from "@/data/sam-profile";

type FitType = "strong" | "weak";

const jobDescriptions = {
  strong: `Lead, Talent Development & Enablement — Anthropic

You'll design and lead L&D at a fast-scaling AI lab where alignment is operational, not just research. The role owns manager development, certification design, and the practice of helping people trust Claude's outputs deliberately. Cross-functional with research, product, and policy...`,
  weak: `Senior Staff Engineer — Production Infrastructure

We need someone who has owned production platforms end-to-end, written the load-bearing code, and led incident response. Deep distributed systems, Kubernetes at scale, and ability to mentor senior engineers on infrastructure architecture...`,
};

const FitAssessment = () => {
  const [activeTab, setActiveTab] = useState<FitType>("strong");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof fitAssessments.strong | typeof fitAssessments.weak | null>(null);

  const handleAnalyze = (type: FitType) => {
    setActiveTab(type);
    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setResult(fitAssessments[type]);
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <section id="fit-assessment" className="py-24 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
            Honest Fit Assessment
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Paste a job description. Get an honest assessment of whether I'm the right person—including when I'm not.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleAnalyze("strong")}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all border",
              activeTab === "strong"
                ? "bg-success-muted text-success border-success/30"
                : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
            )}
          >
            Strong Fit Example
          </button>
          <button
            onClick={() => handleAnalyze("weak")}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all border",
              activeTab === "weak"
                ? "bg-warning-muted text-warning border-warning/30"
                : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
            )}
          >
            Weak Fit Example
          </button>
        </div>

        {/* Main interface */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* Input section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">
                Job description to analyze
              </span>
            </div>
            <div className="bg-secondary rounded-xl p-4 border border-border">
              <p className="text-sm font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {jobDescriptions[activeTab]}
              </p>
            </div>
          </div>

          {/* Analysis section */}
          <div className="p-6">
            {analyzing && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing against my experience...</span>
                </div>
              </div>
            )}

            {result && !analyzing && (
              <div className="animate-slide-up">
                {/* Verdict header */}
                <div
                  className={cn(
                    "flex items-center gap-4 mb-6 p-4 rounded-xl border",
                    result.verdict === "strong"
                      ? "bg-success-muted border-success/20"
                      : "bg-warning-muted border-warning/20"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      result.verdict === "strong" ? "bg-success/20" : "bg-warning/20"
                    )}
                  >
                    {result.verdict === "strong" ? (
                      <Check className="w-6 h-6 text-success" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-warning" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "text-xl font-serif",
                        result.verdict === "strong" ? "text-success" : "text-warning"
                      )}
                    >
                      {result.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">{result.summary}</p>
                  </div>
                </div>

                {/* Strong fit content */}
                {result.verdict === "strong" && "matches" in result && (
                  <>
                    <div className="space-y-4 mb-6">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Where I Match
                      </h4>
                      {result.matches.map((match, i) => (
                        <div
                          key={i}
                          className="p-4 bg-secondary rounded-xl border border-border"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-success mt-0.5">✓</span>
                            <div>
                              <p className="text-success font-medium mb-2">
                                {match.requirement}
                              </p>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {match.evidence}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4 mb-6">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Gaps to Note
                      </h4>
                      {result.gaps.map((gap, i) => (
                        <div
                          key={i}
                          className="p-4 bg-secondary rounded-xl border border-border"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-muted-foreground mt-0.5">○</span>
                            <div>
                              <p className="text-foreground font-medium mb-1">{gap.area}</p>
                              <p className="text-muted-foreground text-sm">{gap.note}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Weak fit content */}
                {result.verdict === "weak" && "mismatches" in result && (
                  <>
                    <div className="space-y-4 mb-6">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        Where I Don't Fit
                      </h4>
                      {result.mismatches.map((mismatch, i) => (
                        <div
                          key={i}
                          className="p-4 bg-secondary rounded-xl border border-border"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-warning mt-0.5">✗</span>
                            <div>
                              <p className="text-warning font-medium mb-2">
                                {mismatch.requirement}
                              </p>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {mismatch.reality}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-secondary rounded-xl border border-border mb-6">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                        What Does Transfer
                      </h4>
                      <p className="text-muted-foreground text-sm">{result.whatTransfers}</p>
                    </div>
                  </>
                )}

                {/* Recommendation */}
                <div
                  className={cn(
                    "p-4 rounded-xl border",
                    result.verdict === "strong"
                      ? "bg-success-muted border-success/20"
                      : "bg-warning-muted border-warning/20"
                  )}
                >
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    My Recommendation
                  </h4>
                  <p
                    className={cn(
                      "leading-relaxed",
                      result.verdict === "strong" ? "text-success" : "text-warning"
                    )}
                  >
                    {result.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom insight */}
        <div className="mt-8 text-center">
          <div className="inline-block p-6 bg-card rounded-2xl border border-border max-w-2xl">
            <p className="text-muted-foreground leading-relaxed">
              This signals something completely different than "please consider my resume."
              <br />
              <br />
              <span className="text-foreground font-medium">
                You're qualifying them. Your time is valuable too.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FitAssessment;
