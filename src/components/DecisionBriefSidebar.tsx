import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import type { FitResult } from "./FitAssessment";
import { OPEN_INTERVIEW_BRIEF_EVENT } from "./Header";
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
  "Built YouTube Certified Online Training Program across certification, video, assessment, and LMS delivery; scaled from about 1,000 partners/year to about 10,000 in year one.",
  "Managed National 4-H Council learning and content-production work across dozens of university partners, SMEs, designers, developers, media vendors, and delivery stakeholders.",
  "Owned Convatec content portfolio health: streamlined content offerings by 90% while increasing utilization and improving delivery speed by 40%.",
  "Launched AI-based training platform across 4 countries with 80%+ adoption in 30 days from a 200-person Portugal cohort.",
  "Built PAICE as a 12-plus project content-and-systems operating system across adaptive assessment, governance, regulation, and agent-readiness surfaces.",
  "Shipped Harnessie as repeatable AI workflow quality control with verification gates and a tamper-evident audit trail.",
  "Publishes Signals & Subtractions and related field notes with a consistent editorial cadence on AI adoption and L&D transformation.",
];

const recruiterBlocks: CopyBlock[] = [
  {
    id: "summary",
    title: "Recruiter Summary",
    copyLabel: "Copy recruiter summary",
    content:
      "Sam Rogers is strongest for content operations, AI education systems, customer education, certification, assessment, and learning-measurement roles where the company needs to turn AI capability into human capability. Best evidence: YouTube Certified scaled 10x across video, assessment, and LMS delivery; National 4-H content work coordinated dozens of university partners and vendors; Convatec content offerings were streamlined 90% while delivery speed improved 40%; PAICE runs as a 12-plus project content-and-systems operating system; and Harnessie brings verification gates and quality control to repeatable AI workflows.",
    display: [
      "Strongest for content operations, AI education systems, customer education, certification, assessment, and learning measurement.",
      "Best evidence: YouTube certification 10x, National 4-H partner/vendor orchestration, Convatec content simplification, PAICE operating system, Harnessie workflow quality gates.",
    ],
  },
  {
    id: "shortlist-rationale",
    title: "Shortlist Rationale",
    copyLabel: "Copy shortlist rationale",
    content:
      "Shortlist Sam for roles centered on content operations, customer education systems, AI-assisted education, certification, learning measurement, developer education, workflow quality, or adaptive learning products. His strongest proof is quantified operating evidence across Google/YouTube, National 4-H Council, Convatec, PAICE, and Harnessie. Caveat: he is not positioning as a deep production infrastructure owner or ML research contributor.",
    display: [
      "Best fit: content operations, customer education systems, AI education, certification, workflow quality, learning measurement.",
      "Caveat: not a deep production infrastructure owner or ML research contributor.",
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
      "- Not positioning as a deep production infrastructure owner.\n- Not a pure ML engineering candidate.\n- Limited formal direct-report history; stronger signal is partner, vendor, and delivery-team orchestration.\n- Strongest in senior lead or builder/operator roles where content operations, AI education, workflow quality, certification, assessment, and learning measurement meet.",
    display: [
      "Not a deep production infrastructure owner.",
      "Not a pure ML engineering candidate.",
      "Limited formal direct-report history; stronger signal is delivery-team orchestration.",
      "Strongest across content operations, AI education, workflow quality, certification, assessment, and learning measurement.",
    ],
  },
  {
    id: "interview-probes",
    title: "Interview Probes",
    copyLabel: "Copy interview probes",
    content:
      "- Walk us through the YouTube certification build from assessment design through video, curriculum, and LMS launch.\n- How did you coordinate the National 4-H university-partner and vendor production system?\n- How did you streamline Convatec content offerings by 90% while improving delivery speed?\n- Where should AI accelerate content operations, and where does human judgment remain non-negotiable?\n- How do you measure whether content actually changes capability?",
    display: [
      "Walk through the YouTube certification build.",
      "How did National 4-H partner/vendor orchestration work?",
      "How did Convatec content simplification work?",
      "Where should AI accelerate content operations, and where should human judgment hold?",
      "How do you measure whether content changes capability?",
    ],
  },
];

const hiringManagerBlocks: CopyBlock[] = [
  {
    id: "best-use-case",
    title: "Best Use Case",
    copyLabel: "Copy best use case",
    content:
      "Sam is strongest when the problem is turning complex technical or AI-related change into durable operating systems: content operations, customer education, certification, adaptive learning, AI-assisted workflows, workflow quality, and learning-quality standards.",
    display: [
      "Turning complex technical or AI-related change into durable operating systems.",
      "Best lanes: content operations, customer education, certification, adaptive learning, AI-assisted workflows, workflow quality, and quality standards.",
    ],
  },
  {
    id: "evidence-map",
    title: "Evidence Map",
    copyLabel: "Copy evidence map",
    content:
      "- Scale: YouTube certification 10x reach across video, assessment, curriculum, and LMS.\n- Orchestration: National 4-H university partners, SMEs, designers, developers, vendors, and delivery stakeholders.\n- Operations: Convatec content portfolio streamlined 90% while delivery speed improved 40%.\n- Quality systems: PAICE adaptive assessment workflows and Harnessie verification gates.\n- Editorial cadence: Signals & Subtractions and public field notes.",
    display: [
      "Scale: YouTube certification 10x reach across video, assessment, curriculum, and LMS.",
      "Orchestration: National 4-H university partners, SMEs, vendors, and delivery stakeholders.",
      "Operations: Convatec content portfolio streamlined 90% with faster delivery.",
      "Quality systems: PAICE adaptive assessment workflows and Harnessie verification gates.",
      "Editorial cadence: Signals & Subtractions and public field notes.",
    ],
  },
  {
    id: "ownership",
    title: "Likely Ownership",
    copyLabel: "Copy likely ownership",
    content:
      "- Content portfolio governance and lifecycle\n- Program operating rhythm\n- Knowledge management and discoverability\n- Editorial and learning-quality standards\n- AI-assisted workflow boundaries and quality control\n- Certification architecture\n- Adaptive learning and assessment design\n- Learning measurement\n- Cross-functional rollout",
    display: [
      "Content portfolio governance, lifecycle, and operating rhythm.",
      "Knowledge management, discoverability, and reuse.",
      "AI-assisted workflow boundaries and quality control.",
      "Certification, adaptive learning, assessment design, and measurement.",
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
      "- What should this audience be able to do after the content works?\n- What evidence would prove the content changes capability?\n- Which content workflows should AI accelerate, and which require human judgment?\n- What should be certified versus merely explained?\n- Which parts of this role require deep engineering ownership?",
    display: [
      "What should the audience be able to do?",
      "What evidence would prove the content changes capability?",
      "Where should AI accelerate, and where should human judgment hold?",
      "What should be certified vs explained?",
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

interface BriefBodyProps {
  blocks: CopyBlock[];
  mode: BriefMode;
  onModeChange: (mode: BriefMode) => void;
  hasJobDescription: boolean;
  fitResult: FitResult | null;
  copiedBlock: BriefBlock | null;
  onCopyAll: () => void;
  onCopyBlock: (block: CopyBlock) => void;
  expandedBlock: BriefBlock | null;
  onToggleBlock: (id: BriefBlock) => void;
  headerControl: ReactNode;
}

const BriefBody = ({
  blocks,
  mode,
  onModeChange,
  hasJobDescription,
  fitResult,
  copiedBlock,
  onCopyAll,
  onCopyBlock,
  expandedBlock,
  onToggleBlock,
  headerControl,
}: BriefBodyProps) => (
  <div className="flex h-full flex-col">
    <div className="border-b border-border px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Interview Decision Brief
          </p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">
            Copy-ready evidence
          </h2>
        </div>
        {headerControl}
      </div>

      <div className="grid grid-cols-2 rounded-lg border border-border bg-secondary p-1">
        {(["recruiter", "hiring-manager"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onModeChange(item)}
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
        onClick={onCopyAll}
        aria-label="Copy all Interview Decision Brief blocks"
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
      {blocks.map((block) => {
        const expanded = expandedBlock === block.id;
        const contentId = `decision-brief-content-${block.id}`;
        return (
          <div
            key={block.id}
            className="group rounded-lg border border-border bg-background p-3 text-left transition-colors duration-200 hover:border-accent focus-within:border-accent"
          >
            <div className="flex items-start justify-between gap-2">
              {/* Tap/click (and keyboard) toggle — replaces hover-only reveal so touch works. */}
              <button
                type="button"
                onClick={() => onToggleBlock(block.id)}
                aria-expanded={expanded}
                aria-controls={contentId}
                className="min-w-0 flex-1 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <span className="flex items-center gap-1.5">
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                  <span
                    id={`decision-brief-${block.id}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {block.title}
                  </span>
                </span>
                {block.badge && (
                  <span className="ml-5 mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {block.badge}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onCopyBlock(block)}
                aria-label={block.copyLabel}
                className="inline-flex shrink-0 cursor-copy items-center gap-1.5 rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                {copiedBlock === block.id ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedBlock === block.id ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div
              id={contentId}
              className={cn(
                "relative mt-2 overflow-hidden transition-[max-height] duration-300 ease-out",
                expanded ? "max-h-80" : "max-h-10",
              )}
            >
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
              {!expanded && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-background/0 to-background"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const DecisionBriefSidebar = ({
  fitResult,
  hasJobDescription,
}: DecisionBriefSidebarProps) => {
  const [collapsed, setCollapsed] = useState(readInitialCollapsed);
  const [mode, setMode] = useState<BriefMode>(readInitialMode);
  const [copiedBlock, setCopiedBlock] = useState<BriefBlock | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<BriefBlock | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Header (mobile menu) broadcasts a request to open the brief as an overlay.
  useEffect(() => {
    const open = () => setMobileOpen(true);
    window.addEventListener(OPEN_INTERVIEW_BRIEF_EVENT, open);
    return () => window.removeEventListener(OPEN_INTERVIEW_BRIEF_EVENT, open);
  }, []);

  const blocks = useMemo(() => {
    if (fitResult) return buildFitBlocks(fitResult, mode);
    return mode === "recruiter" ? recruiterBlocks : hiringManagerBlocks;
  }, [fitResult, mode]);

  const toggleBlock = (id: BriefBlock) =>
    setExpandedBlock((current) => (current === id ? null : id));

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

  const bodyProps: Omit<BriefBodyProps, "headerControl"> = {
    blocks,
    mode,
    onModeChange: setMode,
    hasJobDescription,
    fitResult,
    copiedBlock,
    onCopyAll: copyAll,
    onCopyBlock: copyBlock,
    expandedBlock,
    onToggleBlock: toggleBlock,
  };

  return (
    <>
      <aside
        aria-label="Interview Decision Brief"
        className={cn(
          "sticky hidden shrink-0 border-r border-border bg-card/95 shadow-sm backdrop-blur lg:block",
          collapsed
            ? "top-16 mt-16 h-[calc(100vh-4rem)] w-14"
            : "top-0 z-[60] h-screen w-[23rem] xl:w-[25rem]",
        )}
      >
        {collapsed ? (
          <div className="flex h-full flex-col items-center gap-3 px-2 py-4">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Open Interview Decision Brief"
              className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:border-accent"
            >
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="writing-mode-vertical rotate-180 text-xs font-mono uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
              Interview Brief
            </div>
            {(fitResult || hasJobDescription) && (
              <span className="rounded-full bg-accent px-1.5 py-1 text-[10px] font-medium text-accent-foreground">
                {fitResult ? "Fit" : "JD"}
              </span>
            )}
          </div>
        ) : (
          <BriefBody
            {...bodyProps}
            headerControl={
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse Interview Decision Brief"
                className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:border-accent"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              </button>
            }
          />
        )}
      </aside>

      {/* Mobile path: full-width bottom-sheet overlay opened from the Header menu. */}
      <DialogPrimitive.Root
        open={mobileOpen}
        onOpenChange={(open) => setMobileOpen(open)}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm animate-fade-in lg:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-[70] flex h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-2xl animate-slide-up focus:outline-none lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">
              Interview Decision Brief
            </DialogPrimitive.Title>
            <BriefBody
              {...bodyProps}
              headerControl={
                <DialogPrimitive.Close
                  aria-label="Close Interview Decision Brief"
                  className="rounded-lg border border-border bg-secondary p-2 text-foreground transition-colors hover:border-accent"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </DialogPrimitive.Close>
              }
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
};

export default DecisionBriefSidebar;
