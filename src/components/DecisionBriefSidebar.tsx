import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  Copy,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { FitResult } from "./FitAssessment";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type BriefMode = "recruiter" | "hiring-manager";

type BriefBlock =
  | "summary"
  | "shortlist-rationale"
  | "evidence"
  | "gaps"
  | "interview-probes"
  | "best-use-case"
  | "evidence-map"
  | "ownership"
  | "non-ownership"
  | "fit-recommendation"
  | "fit-matches"
  | "fit-gaps"
  | "copy-all";

interface DecisionBriefSidebarProps {
  fitResult: FitResult | null;
  hasJobDescription: boolean;
}

interface CopyBlock {
  id: BriefBlock;
  title: string;
  copyLabel: string;
  content: string;
  display: string[];
  badge?: string;
}

const COLLAPSED_KEY = "decisionBriefCollapsed";
const MODE_KEY = "decisionBriefMode";

function getLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

const evidenceBullets = [
  "Built YouTube Certified Online Training Program; scaled from about 1,000 partners/year to about 10,000 in year one.",
  "Raised Convatec Innovation and Learning OHI from 48 to 74 in 18 months.",
  "Launched AI-based training platform across 4 countries with 80%+ adoption in 30 days from a 200-person Portugal cohort.",
  "Architected DMS-to-LMS integration that produced the cleanest compliance audit in company history.",
  "Built PAICE.work and AI Posture as public AI governance and human-AI collaboration measurement infrastructure.",
];

const recruiterBlocks: CopyBlock[] = [
  {
    id: "summary",
    title: "Recruiter Summary",
    copyLabel: "Copy recruiter summary",
    content:
      "Sam Rogers is strongest for senior talent development, certification, enablement, and AI governance adoption roles where the company needs to turn complex technical change into measurable human capability. Best evidence: Google/YouTube certification scaled 10x, Convatec OHI moved from 48 to 74, an AI training platform reached 80%+ adoption in 30 days, and compliance-system work produced the cleanest audit in company history.",
    display: [
      "Strongest for senior talent development, certification, enablement, and AI governance adoption roles.",
      "Best evidence: YouTube certification 10x, Convatec OHI 48 -> 74, 80%+ AI platform adoption, cleanest compliance audit.",
    ],
  },
  {
    id: "shortlist-rationale",
    title: "Shortlist Rationale",
    copyLabel: "Copy shortlist rationale",
    content:
      "Shortlist Sam for roles centered on certification, enablement, AI governance adoption, L&D systems, or developer education. His strongest proof is quantified operating evidence across Google/YouTube, Convatec, and PAICE. Caveat: he is not positioning as a deep production infrastructure owner.",
    display: [
      "Best fit: certification, enablement, AI governance adoption, L&D systems, developer education.",
      "Caveat: not a deep production infrastructure owner.",
    ],
  },
  {
    id: "evidence",
    title: "Best Evidence",
    copyLabel: "Copy evidence bullets",
    content: evidenceBullets.map((item) => `- ${item}`).join("\n"),
    display: evidenceBullets,
  },
  {
    id: "gaps",
    title: "Gaps / Watch-Outs",
    copyLabel: "Copy gaps",
    content:
      "- Not positioning as a deep production infrastructure owner.\n- Not a pure ML engineering candidate.\n- Limited formal direct-report history.\n- Strongest as senior IC/staff/operator where learning systems, certification, governance, and cross-functional enablement meet.",
    display: [
      "Not a deep production infrastructure owner.",
      "Not a pure ML engineering candidate.",
      "Limited formal direct-report history.",
      "Strongest as senior IC/staff/operator across learning systems, certification, governance, and enablement.",
    ],
  },
  {
    id: "interview-probes",
    title: "Interview Probes",
    copyLabel: "Copy interview probes",
    content:
      "- Walk us through the YouTube certification build from assessment design through LMS launch.\n- How did you move Convatec's OHI score from 48 to 74?\n- Where would you need engineering support versus owning the work yourself?\n- How do you measure whether AI adoption is behaviorally real?\n- What role scope would be a poor fit?",
    display: [
      "Walk through the YouTube certification build.",
      "How did Convatec OHI move from 48 to 74?",
      "Where would engineering support be needed?",
      "How do you measure real AI adoption?",
      "What role scope would be a poor fit?",
    ],
  },
];

const hiringManagerBlocks: CopyBlock[] = [
  {
    id: "best-use-case",
    title: "Best Use Case",
    copyLabel: "Copy best use case",
    content:
      "Sam is strongest when the problem is turning complex technical or AI-related change into measurable human capability: certification, enablement, governance adoption, and learning infrastructure.",
    display: [
      "Turning complex technical or AI-related change into measurable human capability.",
      "Best lanes: certification, enablement, governance adoption, and learning infrastructure.",
    ],
  },
  {
    id: "evidence-map",
    title: "Evidence Map",
    copyLabel: "Copy evidence map",
    content:
      "- Scale: YouTube certification 10x reach.\n- Adoption: Convatec AI training platform adoption.\n- Governance: PAICE / AI Posture.\n- Regulated systems: cleanest compliance audit.\n- Cross-functional: engineering, operations, legal, sales, support, community translation.",
    display: [
      "Scale: YouTube certification 10x reach.",
      "Adoption: Convatec AI platform.",
      "Governance: PAICE / AI Posture.",
      "Regulated systems: cleanest compliance audit.",
      "Cross-functional: engineering, legal, sales, support.",
    ],
  },
  {
    id: "ownership",
    title: "Likely Ownership",
    copyLabel: "Copy likely ownership",
    content:
      "- Capability model\n- Certification architecture\n- AI adoption measurement\n- Governance enablement\n- Cross-functional rollout\n- Assessment design\n- Learning systems architecture",
    display: [
      "Capability model and certification architecture.",
      "AI adoption measurement and governance enablement.",
      "Cross-functional rollout and assessment design.",
      "Learning systems architecture.",
    ],
  },
  {
    id: "non-ownership",
    title: "Should Not Own Alone",
    copyLabel: "Copy non-ownership list",
    content:
      "- Production platform engineering\n- ML infrastructure\n- Security architecture\n- Enterprise sales quota\n- Traditional HRBP/generalist people operations",
    display: [
      "Production platform engineering.",
      "ML infrastructure.",
      "Security architecture.",
      "Enterprise sales quota.",
      "Traditional HRBP/generalist people operations.",
    ],
  },
  {
    id: "interview-probes",
    title: "First-Call Questions",
    copyLabel: "Copy first-call questions",
    content:
      "- What behavior change matters most in this role?\n- What evidence would prove adoption?\n- Where is the governance bottleneck?\n- What should be certified versus merely trained?\n- Which parts of this role require deep engineering ownership?",
    display: [
      "What behavior change matters most?",
      "What evidence would prove adoption?",
      "Where is the governance bottleneck?",
      "What should be certified vs trained?",
      "Which parts require deep engineering ownership?",
    ],
  },
];

function readInitialCollapsed() {
  return getLocalStorage()?.getItem(COLLAPSED_KEY) === "true";
}

function readInitialMode(): BriefMode {
  const stored = getLocalStorage()?.getItem(MODE_KEY);
  return stored === "hiring-manager" ? "hiring-manager" : "recruiter";
}

function blockText(block: CopyBlock) {
  return `${block.title}\n${block.content}`;
}

function buildFitBlocks(fitResult: FitResult, mode: BriefMode): CopyBlock[] {
  const recommendationTitle =
    fitResult.verdict === "weak"
      ? "Not Recommended For This Req"
      : fitResult.verdict === "strong"
        ? "Shortlist Recommendation"
        : "Worth A Conversation";
  const noteLabel =
    mode === "recruiter"
      ? "Copy hiring-manager note"
      : "Copy role-fit brief";

  return [
    {
      id: "fit-recommendation",
      title: recommendationTitle,
      copyLabel: noteLabel,
      content: `${fitResult.title}\n${fitResult.summary}\n${fitResult.recommendation}`,
      display: [fitResult.summary, fitResult.recommendation],
      badge: fitResult.verdict,
    },
    {
      id: "fit-matches",
      title: "Why",
      copyLabel: "Copy matched evidence",
      content: fitResult.matches
        .map((match) => `- ${match.requirement}: ${match.evidence}`)
        .join("\n"),
      display: fitResult.matches.map((match) => `${match.requirement}: ${match.evidence}`),
      badge: "Updated from JD",
    },
    {
      id: "fit-gaps",
      title: "Gaps To Flag",
      copyLabel: "Copy fit gaps",
      content:
        fitResult.gaps.length > 0
          ? fitResult.gaps.map((gap) => `- ${gap.area}: ${gap.note}`).join("\n")
          : "No major gaps were returned by the fit assessment.",
      display:
        fitResult.gaps.length > 0
          ? fitResult.gaps.map((gap) => `${gap.area}: ${gap.note}`)
          : ["No major gaps were returned by the fit assessment."],
      badge: "Updated from JD",
    },
    {
      id: "interview-probes",
      title: "Interview Probes",
      copyLabel: "Copy interview probes",
      content:
        "- Ask for the strongest example behind the matched evidence.\n- Probe the named gaps directly.\n- Ask what Sam would own versus where he would need specialist support.\n- Ask what measurable outcome would prove the role is working.",
      display: [
        "Ask for the strongest example behind the matched evidence.",
        "Probe the named gaps directly.",
        "Ask what Sam would own versus where specialist support is needed.",
        "Ask what measurable outcome would prove the role is working.",
      ],
      badge: "Updated from JD",
    },
  ];
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for constrained browser/plugin contexts where the Clipboard API exists but rejects.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

const DecisionBriefSidebar = ({
  fitResult,
  hasJobDescription,
}: DecisionBriefSidebarProps) => {
  const [collapsed, setCollapsed] = useState(readInitialCollapsed);
  const [mode, setMode] = useState<BriefMode>(readInitialMode);
  const [copiedBlock, setCopiedBlock] = useState<BriefBlock | null>(null);

  useEffect(() => {
    getLocalStorage()?.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    getLocalStorage()?.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!copiedBlock) return;
    const timeout = window.setTimeout(() => setCopiedBlock(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedBlock]);

  const blocks = useMemo(() => {
    if (fitResult) return buildFitBlocks(fitResult, mode);
    return mode === "recruiter" ? recruiterBlocks : hiringManagerBlocks;
  }, [fitResult, mode]);

  const copyBlock = async (block: CopyBlock) => {
    await copyToClipboard(blockText(block));
    setCopiedBlock(block.id);
    track("decision_brief_copied", {
      block: block.id,
      mode,
      fitVerdict: fitResult?.verdict,
    });
  };

  const copyAll = async () => {
    await copyToClipboard(blocks.map(blockText).join("\n\n"));
    setCopiedBlock("copy-all");
    track("decision_brief_copied", {
      block: "copy-all",
      mode,
      fitVerdict: fitResult?.verdict,
    });
  };

  return (
    <aside
      aria-label="Decision brief"
      className={cn(
        "sticky top-16 mt-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-border bg-card/95 shadow-sm backdrop-blur lg:block",
        collapsed ? "w-14" : "w-[23rem] xl:w-[25rem]",
      )}
    >
      {collapsed ? (
        <div className="flex h-full flex-col items-center gap-3 px-2 py-4">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Open Decision Brief"
            className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:border-accent"
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="writing-mode-vertical rotate-180 text-xs font-mono uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
            Brief
          </div>
          {(fitResult || hasJobDescription) && (
            <span className="rounded-full bg-accent px-1.5 py-1 text-[10px] font-medium text-accent-foreground">
              {fitResult ? "Fit" : "JD"}
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-border px-4 py-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Decision Brief
                </p>
                <h2 className="mt-1 font-serif text-2xl text-foreground">
                  Copy-ready evidence
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse Decision Brief"
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:border-accent"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 rounded-lg border border-border bg-secondary p-1">
              {(["recruiter", "hiring-manager"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    mode === item
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item === "recruiter" ? "Recruiter" : "Hiring Manager"}
                </button>
              ))}
            </div>

            {hasJobDescription && !fitResult && (
              <p className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Role context detected. Run fit assessment to update this brief from the
                reviewed JD.
              </p>
            )}

            <button
              type="button"
              onClick={copyAll}
              aria-label="Copy all Decision Brief blocks"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              {copiedBlock === "copy-all" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Clipboard className="h-4 w-4" aria-hidden="true" />
              )}
              {copiedBlock === "copy-all" ? "Copied" : "Copy all visible blocks"}
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                role="button"
                tabIndex={0}
                aria-label={block.copyLabel}
                onClick={() => copyBlock(block)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  copyBlock(block);
                }}
                className="group cursor-copy rounded-lg border border-border bg-background p-3 text-left transition-all duration-200 hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      id={`decision-brief-${block.id}`}
                      className="text-sm font-medium text-foreground"
                    >
                      {block.title}
                    </h3>
                    {block.badge && (
                      <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {block.badge}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs font-medium text-foreground transition-colors group-hover:border-accent group-focus:border-accent">
                    {copiedBlock === block.id ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedBlock === block.id ? "Copied" : "Copy"}</span>
                  </span>
                </div>
                <div className="relative mt-2 max-h-10 overflow-hidden transition-[max-height] duration-300 ease-out group-hover:max-h-80 group-focus-visible:max-h-80">
                  <ul className="space-y-1.5 pb-1">
                    {block.display.map((item) => (
                      <li
                        key={item}
                        className="text-xs leading-relaxed text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-background/0 to-background transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default DecisionBriefSidebar;
