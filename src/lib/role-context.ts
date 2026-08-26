export type TargetKey = "ai-education" | "content-ops" | "ai-transformation";
export type CompanyKey = "anthropic" | "openai" | "instructure";

export interface RoleSelection {
  target?: TargetKey;
  company?: CompanyKey;
}

interface TargetPreset {
  key: TargetKey;
  label: string;
  heroTitles: string[];
  status: string;
  promptContext: string;
  suggestedQuestions: string[];
  demoResponseKey: "anthropic" | "openaiContentOps" | "aiTransformation";
}

interface CompanyApplicationPreset {
  sourceRole: string;
  reqId?: string;
  sourceUrl?: string;
  locationContext?: string;
  promptDelta: string;
  suggestedQuestions: string[];
}

interface CompanyPreset {
  key: CompanyKey;
  label: string;
  referrerPatterns: string[];
  referrerDefaultTarget?: TargetKey;
  companyOnlyPrompt: string;
  applications: Partial<Record<TargetKey, CompanyApplicationPreset>>;
}

export interface ActiveRoleContext {
  selection: RoleSelection;
  label: string;
  targetLabel?: string;
  companyLabel?: string;
  sourceRole?: string;
  locationContext?: string;
  heroTitles?: string[];
  status?: string;
  promptContext: string;
  suggestedQuestions: string[];
  demoResponseKey?: "anthropic" | "openaiContentOps" | "aiTransformation";
}

export const targetPresets: Record<TargetKey, TargetPreset> = {
  "ai-education": {
    key: "ai-education",
    label: "AI Education Systems",
    heroTitles: [
      "AI Education Systems Lead",
      "Head of Content & Curriculum",
      "Curriculum Production Systems Lead",
      "Certification & Learning Measurement Lead",
      "Applied AI Education Lead",
    ],
    status:
      "Focused on roles where AI education, content quality, curriculum systems, and learning measurement become core infrastructure.",
    promptContext:
      "Use the AI education systems lens when the visitor asks fit questions. Emphasize content and curriculum systems, AI-assisted content production, quality standards, adaptive and personalized learning, certification, and measurement of whether content actually teaches. Strongest evidence: YouTube Certified for certification, video, assessment, and LMS scale; National 4-H Council for university-partner and vendor production orchestration; Convatec for content simplification, measurement, OHI, and AI adoption; PAICE for adaptive behavioral simulation, AI Posture, and AI-assisted workflows; and published work for visible editorial cadence and taste.",
    suggestedQuestions: [
      "Is Sam a fit for an AI education systems role?",
      "How would Sam use AI without lowering the content quality bar?",
      "How does Sam measure whether content actually teaches?",
      "When could Sam start, and is he open to relocating?",
    ],
    demoResponseKey: "anthropic",
  },
  "content-ops": {
    key: "content-ops",
    label: "Content Operations",
    heroTitles: [
      "Content & Systems Operations Lead",
      "AI-Enabled Content Operations Lead",
      "Customer Education Systems Lead",
      "Content Portfolio Governance Lead",
      "Learning Operations Systems Lead",
    ],
    status:
      "Focused on roles that turn AI capability into human capability through content operations, education systems, workflow quality, and measurement.",
    promptContext:
      "Use the content operations lens when the visitor asks fit questions. Emphasize content-portfolio health, lifecycle, governance, discoverability, reuse, operating rhythm, scalable handoffs, risk and dependency management, and AI-enabled quality control. Strongest evidence: PAICE as a 12-plus project single-operator content-and-systems operating system; YouTube Certified scaling a content-and-credential portfolio 10x; National 4-H Council as a shared production system across dozens of university partners; Convatec content portfolio simplification and governance; and Harnessie as repeatable AI workflow quality control.",
    suggestedQuestions: [
      "Is Sam a fit for a content and systems operations role?",
      "How has Sam owned content-portfolio health and governance?",
      "Where has Sam translated cross-functional needs into operating systems?",
      "How does Sam use AI for workflow automation and quality control?",
    ],
    demoResponseKey: "openaiContentOps",
  },
  "ai-transformation": {
    key: "ai-transformation",
    label: "AI Transformation",
    heroTitles: [
      "AI Transformation & Center of Excellence Leader",
      "AI Center of Excellence Builder",
      "AI Governance & Adoption Leader",
      "Zero-to-One AI Transformation Operator",
    ],
    status:
      "Focused on zero-to-one AI transformation roles that combine operating-model design, governance, adoption, measurement, and hands-on implementation.",
    promptContext:
      "Use the AI transformation lens when the visitor asks fit questions. Treat the work as zero-to-one operating-system construction: AI roadmaps and operating models, governance and approval controls, shared model-management functions, adoption and capability building, and measurement of cost, throughput, quality, and impact. Lead with Convatec's measured adoption and organizational outcomes, the PAICE portfolio's governance systems, and current inspectable work in PAICE2, Harnessie, and paice-near-integration. Distinguish director-level architecture, integration, administration, control design, and fast technical acquisition from dedicated production-infrastructure engineering ownership. Distinguish formal line management from project, vendor, partner, and advisory leadership. Do not claim prior enterprise AI Center of Excellence ownership, enterprise DLP ownership, a technical degree, or significant PAICE customer or revenue traction.",
    suggestedQuestions: [
      "Is Sam a fit to stand up an AI Center of Excellence?",
      "What evidence supports Sam's production AI and model-registry experience?",
      "Has Sam hired, coached, and formally evaluated a team?",
      "Where is the fit transferable rather than identical?",
      "What should the first interview probe?",
    ],
    demoResponseKey: "aiTransformation",
  },
};

export const companyPresets: Record<CompanyKey, CompanyPreset> = {
  anthropic: {
    key: "anthropic",
    label: "Anthropic",
    referrerPatterns: [
      "anthropic.com",
      "boards.greenhouse.io/anthropic",
      "job-boards.greenhouse.io/anthropic",
    ],
    referrerDefaultTarget: "ai-education",
    companyOnlyPrompt:
      "The visitor appears to be evaluating Sam in an Anthropic context. Do not assume a specific role unless target context is also present or the visitor names it.",
    applications: {
      "ai-education": {
        sourceRole: "Head of Content & Curriculum, Education",
        promptDelta:
          "For the Anthropic Head of Content & Curriculum, Education role, treat the opportunity as head-of-function shaped rather than assuming mature Director-level department maintenance. The role spans education content for developers, consumers, enterprise admins, and the general public; AI-assisted content production systems; quality bar and human craft boundaries; adaptive and personalized learning; and measurement of whether content actually teaches.",
        suggestedQuestions: [
          "If hired at Anthropic, what would happen to PAICE?",
          "Is Sam a fit for Head of Content & Curriculum, Education?",
          "How would Sam use AI without lowering the content quality bar?",
          "When could Sam start, and is he open to relocating?",
        ],
      },
    },
  },
  openai: {
    key: "openai",
    label: "OpenAI",
    referrerPatterns: [
      "openai.com",
      "jobs.ashbyhq.com/openai",
    ],
    referrerDefaultTarget: "content-ops",
    companyOnlyPrompt:
      "The visitor appears to be evaluating Sam in an OpenAI context. Do not assume a specific role unless target context is also present or the visitor names it.",
    applications: {
      "content-ops": {
        sourceRole: "Customer Education, Content and Systems Operations Lead",
        reqId: "2250b09d-f6fb-4ebc-9d27-dfd34d2ccbec",
        sourceUrl: "https://jobs.ashbyhq.com/openai/2250b09d-f6fb-4ebc-9d27-dfd34d2ccbec",
        promptDelta:
          "For OpenAI's Customer Education, Content and Systems Operations Lead role, map Sam through the content-and-systems operations spine: own content-portfolio health across lifecycle, governance, discoverability, reuse, and gaps; run the operating rhythm; design scalable processes and handoffs; translate cross-functional education needs into system requirements; use AI deeply for automation, quality control, and operating leverage; and identify risks, duplicated effort, and unclear ownership before they escalate.",
        suggestedQuestions: [
          "Is Sam a fit for OpenAI's Customer Education, Content and Systems Operations Lead role?",
          "How has Sam owned content-portfolio health and operating rhythm?",
          "Where has Sam translated cross-functional needs into systems requirements?",
          "How does Sam use AI for automation and quality control without losing judgment?",
        ],
      },
    },
  },
  instructure: {
    key: "instructure",
    label: "Instructure",
    referrerPatterns: ["instructure.com", "jobs.ashbyhq.com/instructure"],
    companyOnlyPrompt:
      "The visitor appears to be evaluating Sam in an Instructure context. Instructure has materially different openings, so do not assume a specific role unless target context is also present or the visitor names it.",
    applications: {
      "ai-transformation": {
        sourceRole: "Director, AI Center of Excellence",
        reqId: "4001e25a-4523-4d4c-9c53-11597d03cfd5",
        sourceUrl:
          "https://jobs.ashbyhq.com/instructure/4001e25a-4523-4d4c-9c53-11597d03cfd5/",
        locationContext: "Remote from Utah",
        promptDelta:
          "For Instructure's Director, AI Center of Excellence role, treat the mandate as a founding AI Center of Excellence build rather than mature-department maintenance. Lead with Convatec's four-country rollout, 80 percent adoption in 30 days, 48-to-74 OHI gain, 90 percent portfolio reduction, and 40 percent faster delivery; then connect PAICE governance artifacts and current model-catalog, routing, fallback, privacy, budget, approval, and verification controls. Sam personally selected and hired two Convatec direct reports, set goals, provided ongoing coaching and development planning, and conducted formal performance reviews; formal line-management scale is two, while broader project, vendor, partner, and advisory leadership must remain separately labeled. The candidacy is credible but not conventionally obvious from title history. Preserve these boundaries explicitly: no prior enterprise AI CoE ownership, no enterprise DLP ownership, no dedicated end-to-end production-infrastructure engineering claim, and no computer-science-equivalent degree claim.",
        suggestedQuestions: [
          "Is Sam a fit to stand up Instructure's AI Center of Excellence?",
          "What evidence supports Sam's production AI and model-registry experience?",
          "Has Sam hired, coached, and formally evaluated a team?",
          "Where is the fit transferable rather than identical?",
          "What should the first interview probe?",
        ],
      },
    },
  },
};

function isTargetKey(value: string | null): value is TargetKey {
  return value === "ai-education"
    || value === "content-ops"
    || value === "ai-transformation";
}

function isCompanyKey(value: string | null): value is CompanyKey {
  return value === "anthropic" || value === "openai" || value === "instructure";
}

export function parseRoleSelection(
  search: string,
  referrer = "",
): RoleSelection {
  const params = new URLSearchParams(search);
  const targetParam = params.get("target") ?? params.get("role");
  const companyParam = params.get("company");

  const selection: RoleSelection = {};
  if (isTargetKey(targetParam)) selection.target = targetParam;
  if (isCompanyKey(companyParam)) selection.company = companyParam;

  // Backward compatibility for old shared Anthropic links.
  if (targetParam === "anthropic") {
    selection.target = "ai-education";
    selection.company = "anthropic";
  }

  if (!selection.company && referrer) {
    const matchedCompany = Object.values(companyPresets).find((company) =>
      company.referrerPatterns.some((pattern) => referrer.includes(pattern)),
    );
    if (matchedCompany) {
      selection.company = matchedCompany.key;
      if (!selection.target) selection.target = matchedCompany.referrerDefaultTarget;
    }
  }

  return selection;
}

export function detectRoleSelection(): RoleSelection {
  if (typeof window === "undefined") return {};
  const referrer = (typeof document !== "undefined" && document.referrer) || "";
  return parseRoleSelection(window.location.search, referrer);
}

export function composeRoleContext(
  selection: RoleSelection,
): ActiveRoleContext | null {
  const target = selection.target ? targetPresets[selection.target] : undefined;
  const company = selection.company ? companyPresets[selection.company] : undefined;
  const application = target && company ? company.applications[target.key] : undefined;

  if (!target && !company) return null;

  const promptParts = [
    target?.promptContext,
    company && !application ? company.companyOnlyPrompt : undefined,
    application?.locationContext
      ? `For public location questions in this application context, answer: ${application.locationContext}. Do not disclose a street address, ZIP code, precise residential city, or phone number.`
      : undefined,
    application?.promptDelta,
  ].filter(Boolean);

  const label =
    company && application
      ? `${company.label} - ${application.sourceRole}`
      : company && target
        ? `${company.label} - ${target.label}`
        : target?.label ?? company?.label ?? "";

  return {
    selection,
    label,
    targetLabel: target?.label,
    companyLabel: company?.label,
    sourceRole: application?.sourceRole,
    locationContext: application?.locationContext,
    heroTitles: target?.heroTitles,
    status: target?.status,
    promptContext: promptParts.join("\n\n"),
    suggestedQuestions:
      application?.suggestedQuestions ?? target?.suggestedQuestions ?? [
        `What should I know about Sam's fit for ${company?.label}?`,
        "Where is Sam strongest?",
        "What gaps should I probe?",
        "How should I evaluate Sam's evidence?",
      ],
    demoResponseKey: target?.demoResponseKey,
  };
}
