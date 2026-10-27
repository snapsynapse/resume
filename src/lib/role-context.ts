export type TargetKey = "ai-education" | "content-ops" | "ai-transformation" | "ai-enablement" | "ai-ecosystems";

// Company keys are a validated shape, not an enum. The set of live keys is private
// server-side data (see api/role-context-store.ts) and never ships to the client.
export type CompanyKey = string;

export const COMPANY_KEY_PATTERN = /^[a-z0-9-]{1,40}$/;

export function isCompanyKeyShape(value: unknown): value is string {
  return typeof value === "string" && COMPANY_KEY_PATTERN.test(value);
}

export interface RoleSelection {
  target?: TargetKey;
  company?: CompanyKey;
}

interface TargetPreset {
  key: TargetKey;
  label: string;
  heroTitles: string[];
  status: string;
  recruiterBrief: { summary: string; shortlistRationale: string };
  promptContext: string;
  suggestedQuestions: string[];
  demoResponseKey: "aiEducation" | "contentOps" | "aiTransformation" | "aiEnablement" | "aiEcosystems";
}

export interface CompanyApplicationPreset {
  sourceRole: string;
  // Optional shorter hero line when the posting title is too long to lead a rotation.
  heroTitle?: string;
  reqId?: string;
  sourceUrl?: string;
  locationContext?: string;
  promptDelta: string;
  suggestedQuestions: string[];
}

export interface CompanyPreset {
  key: string;
  label: string;
  applications: Partial<Record<TargetKey, CompanyApplicationPreset>>;
}

export type CompanyPresetMap = Record<string, CompanyPreset>;

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
  demoResponseKey?: "aiEducation" | "contentOps" | "aiTransformation" | "aiEnablement" | "aiEcosystems";
}

// The client-facing view of a role context. promptContext never leaves the server.
export type PublicRoleContext = Omit<ActiveRoleContext, "promptContext">;

export function toPublicRoleContext(ctx: ActiveRoleContext): PublicRoleContext {
  const { promptContext: _promptContext, ...publicContext } = ctx;
  return publicContext;
}

export const targetPresets: Record<TargetKey, TargetPreset> = {
  "ai-education": {
    key: "ai-education",
    label: "AI Education Systems",
    recruiterBrief: {
      summary: "Sam Rogers builds AI education systems spanning curriculum, certification, assessment, and measurement. YouTube Certified grew from about 1,000 partners per year to about 10,000 in year one; National 4-H work coordinated university partners and vendors; Convatec combined content simplification with measured adoption.",
      shortlistRationale: "Shortlist Sam for AI education systems that need scalable delivery and evidence of learning. Probe the YouTube certification build, National 4-H production orchestration, and Convatec measurement. His evidence is program and system leadership, not ML research or deep production-infrastructure ownership.",
    },
    heroTitles: [
      "Director of AI Education",
      "Head of Content & Curriculum",
      "Senior Manager, Curriculum Production",
      "Certification & Learning Measurement Manager",
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
    demoResponseKey: "aiEducation",
  },
  "content-ops": {
    key: "content-ops",
    label: "Content Operations",
    recruiterBrief: {
      summary: "Sam Rogers builds content operations across portfolio health, production, quality, and measurement. National 4-H work coordinated university partners and vendors; Convatec content offerings were streamlined 90% while delivery speed improved 40%; YouTube certification scaled 10x.",
      shortlistRationale: "Shortlist Sam for content operations that need a repeatable operating rhythm across functions. Probe National 4-H partner and vendor orchestration, Convatec simplification, and Harnessie workflow verification. Formal line-management scale is two direct reports; broader delivery leadership is separate evidence.",
    },
    heroTitles: [
      "Director, Content Operations",
      "Senior Manager, Content & Systems Operations",
      "Customer Education Operations Manager",
      "Learning Operations Program Manager",
      "Content Portfolio Governance Lead",
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
    demoResponseKey: "contentOps",
  },
  "ai-transformation": {
    key: "ai-transformation",
    label: "AI Transformation",
    recruiterBrief: {
      summary: "Sam Rogers approaches AI transformation through operating models, adoption, governance design, and measurement. Convatec paired a measured platform pilot with a four-country rollout; PAICE supplies inspectable governance frameworks; Harnessie demonstrates workflow verification controls.",
      shortlistRationale: "Consider Sam for a bounded AI transformation function combining hands-on building and organizational adoption. Probe Convatec outcomes, PAICE control design, and Harnessie verification. Prior enterprise AI Center of Excellence ownership and implementations against SOC 2, ISO 42001, or NIST AI RMF are not claimed.",
    },
    heroTitles: [
      "Director, AI Transformation",
      "Head of AI Governance & Adoption",
      "AI Center of Excellence Lead",
      "Zero-to-One AI Transformation Operator",
    ],
    status:
      "Focused on zero-to-one AI transformation roles that combine operating-model design, governance, adoption, measurement, and hands-on implementation.",
    promptContext:
      "Use the AI transformation lens when the visitor asks fit questions. Treat the work as zero-to-one operating-system construction: AI roadmaps and operating models, governance and approval controls, shared model-management functions, adoption and capability building, and measurement of cost, throughput, quality, and impact. Lead with Convatec's measured adoption and organizational outcomes, the PAICE portfolio's governance systems, and current inspectable work in PAICE2, Harnessie, and paice-near-integration. Where the role covers agent operations, AI governance, or human-AI workflow design, lead with the OPERATING METHOD: model routing by work shape, cross-vendor author/verifier separation, server-boundary agent permissions, and the enforced error-pattern register. Distinguish director-level architecture, integration, administration, control design, and fast technical acquisition from dedicated production-infrastructure engineering ownership. Distinguish formal line management from project, vendor, partner, and advisory leadership. Do not claim prior enterprise AI Center of Excellence ownership, enterprise DLP ownership, a technical degree, or significant PAICE customer or revenue traction.",
    suggestedQuestions: [
      "Is Sam a fit to stand up an AI Center of Excellence?",
      "What evidence supports Sam's production AI and model-registry experience?",
      "Has Sam hired, coached, and formally evaluated a team?",
      "Where is the fit transferable rather than identical?",
      "What should the first interview probe?",
    ],
    demoResponseKey: "aiTransformation",
  },
  "ai-enablement": {
    key: "ai-enablement",
    label: "AI Enablement",
    recruiterBrief: {
      summary: "Sam Rogers builds AI enablement through champions, layered training, reusable skills, and measured adoption. At Convatec, a 200-person Portugal pilot reached more than 80% adoption in 30 days, followed by rollout to four countries through regional champions. Current work includes a shared skills library and workflow verification.",
      shortlistRationale: "Shortlist Sam for AI enablement that turns pilots into repeatable team capability. Probe the Convatec champions network, adoption measurement, and shared-library controls. The network was not a standing AI Center of Excellence, and formal line management is two direct reports.",
    },
    heroTitles: [
      "Head of AI Enablement",
      "Senior Manager, Enablement Systems",
      "AI Adoption & Champions Program Manager",
      "AI Capability Building Lead",
    ],
    status:
      "Focused on company-wide AI enablement roles: a center of excellence built through influence, a champions network, layered training, a shared skills library, and adoption reported in the numbers executives already use.",
    promptContext:
      "Use the AI enablement lens when the visitor asks fit questions. The unit of work is an internal enablement function that lands AI capability in every team: pilot selection, a champions bench recruited and coached in each market, training that lifts each layer, a shared library of reusable skills with provenance and distribution, a defensible tooling portfolio, and adoption measured by use in real workflows rather than course completion. Lead with Convatec: an AI-enabled platform taken to 80 percent or better sustained adoption in 30 days from a 200-person pilot, scaled to four countries through regional champions, with the McKinsey OHI Innovation and Learning score moved from 48 to 74, a 90 percent catalog reduction, and 40 percent faster delivery, reported against KPIs the executive team already tracked. Then the skills-library evidence: a 70-bundle shared skill library behind a validation gate with verified content hashes, contract tests, and CI, exposed identically to multiple AI harnesses and evaluated across models; Skill Provenance for version identity, staleness detection, and integrity verification; Agentlink for one configuration synced across every AI tool a team uses; AI Tool Watch as the vendor-evaluation reference. Training and facilitation evidence: a decade of workshops for the major US training associations and a weekly public livestream, episode, and newsletter on working with AI, plus a Prosci change-practitioner certification. Preserve these boundaries: the Convatec network was a champions network rather than a standing AI Center of Excellence, formal line management is two direct reports, Sam has not implemented against ISO 42001, NIST AI RMF, or SOC 2 and has studied only public material, building with LLMs dates from 2023, and the skill library's live native loading on every harness is not claimed as verified in production.",
    suggestedQuestions: [
      "Is Sam a fit to run a company-wide AI enablement function?",
      "How did Sam get to 80 percent adoption, and how was it measured?",
      "How would Sam build and govern a shared skills library?",
      "How does Sam report enablement impact to an executive team?",
      "Where is the fit transferable rather than identical?",
    ],
    demoResponseKey: "aiEnablement",
  },
  "ai-ecosystems": {
    key: "ai-ecosystems",
    label: "AI Ecosystems",
    recruiterBrief: {
      summary: "Sam Rogers brings shipped tooling and partner-program experience to AI ecosystems work. Inspect Harnessie for multi-agent workflow verification, Skill Provenance for skill identity and integrity, and the YouTube partner certification program for program-building evidence.",
      shortlistRationale: "Consider Sam for AI ecosystems roles that connect technical artifacts with partner capability. Probe Harnessie, Skill Provenance, and the YouTube partner program. He has not held a partnerships or developer-relations title, and external Harnessie adoption is not established.",
    },
    heroTitles: [
      "Director, AI Ecosystems & Partnerships",
      "Developer Ecosystem Program Manager",
      "Partner Certification & Enablement Manager",
      "MCP, Skills & Agent Surfaces Practitioner",
    ],
    status:
      "Focused on roles that partner with the agent ecosystem: MCP servers, agent skills and plugins, harness integrations, developer relations, and partner certification programs.",
    promptContext:
      "Use the AI ecosystems lens when the visitor asks fit questions. This reader is checking whether Sam has actually shipped on the surfaces the role partners with, so surface the artifacts as products, in this order: Harnessie, an open multi-agent orchestration harness with independent verification gates, sandboxing, budgets, and audit controls, published to PyPI with its own documentation site; a 70-bundle shared skill library behind a validation gate with verified content hashes, contract tests, and CI, exposed identically to multiple AI harnesses and evaluated across models; Skill Provenance, a GitHub Action giving agent skills version identity, staleness detection, and integrity verification; Agentlink, which syncs one configuration across every AI coding tool a team uses and is carried upstream as an open pull request to the origin project; Graceful Boundaries, a specification for how agents degrade when a capability is unavailable, adopted by Harnessie; MCP servers run in production against a private knowledge base and maintained across Claude, Codex, and local models; and AI Tool Watch plus a weekly public read on what is changing in the agent ecosystem. Seniority anchor: built and led the first YouTube Certified online training program at Google, a partner certification program for a global audience, then twenty years of partner-facing program work. Suppress learning-platform and LMS vocabulary entirely for this target; it is the wrong adjacency. Preserve these boundaries: Sam has never held a partnerships or developer-relations title, so the case rests on the shipped work and the partner-program history; Harnessie is shipped and documented but has no external user base to point at, so claim the engineering and never adoption or traction; Graceful Boundaries adoption by Harnessie is cross-portfolio and is not an outside company adopting it; Agentlink's upstream contribution is an open pull request, not a merged one unless the visitor can see otherwise; public AI tooling dates from 2025 and building with LLMs from 2023.",
    suggestedQuestions: [
      "Has Sam actually shipped an MCP server, skill, or plugin, and where can it be inspected?",
      "How does Sam keep a skill working identically across different AI harnesses?",
      "What partner or certification programs has Sam built?",
      "How does Sam track what is changing in the agent ecosystem?",
      "Sam has no partnerships title. Why is he credible here?",
    ],
    demoResponseKey: "aiEcosystems",
  },
};

const TARGET_KEYS: readonly TargetKey[] = ["ai-education", "content-ops", "ai-transformation", "ai-enablement", "ai-ecosystems"];

function isTargetKey(value: unknown): value is TargetKey {
  return typeof value === "string" && (TARGET_KEYS as readonly string[]).includes(value);
}

// Reads a selection from a query string. `company` is the canonical company parameter and
// `for` is an accepted alias (`?for=<key>` reads naturally in a shared link); `target` is
// canonical and `role` is its alias. Existing links keep working.
export function parseRoleSelection(search: string): RoleSelection {
  const params = new URLSearchParams(search);
  const targetParam = params.get("target") ?? params.get("role");
  const companyParam = params.get("company") ?? params.get("for");

  const selection: RoleSelection = {};
  if (isTargetKey(targetParam)) selection.target = targetParam;
  if (isCompanyKeyShape(companyParam)) selection.company = companyParam;

  // Backward compatibility for old shared links. The employer application behind this alias
  // is closed; the link now lands on the durable target only.
  if (targetParam === "anthropic") {
    selection.target = "ai-education";
  }

  return selection;
}

export function detectRoleSelection(): RoleSelection {
  if (typeof window === "undefined") return {};
  return parseRoleSelection(window.location.search);
}

function companyOnlyPrompt(label: string): string {
  return `The visitor appears to be evaluating Sam in a ${label} context. Do not assume a specific role unless target context is also present or the visitor names it.`;
}

function lookupCompany(
  key: string | undefined,
  companies: CompanyPresetMap | undefined,
): CompanyPreset | undefined {
  if (!key || !companies) return undefined;
  // Own-property check only: a prototype key such as "__proto__" or "constructor"
  // must resolve to "no such company", never to a degenerate object.
  if (!isCompanyKeyShape(key) || !Object.hasOwn(companies, key)) return undefined;
  return companies[key];
}

// Without a map (the client) or with an unknown key, the result is target-only and
// indistinguishable from a mistyped key. No error, no flag.
export function composeRoleContext(
  selection: RoleSelection,
  companies?: CompanyPresetMap,
): ActiveRoleContext | null {
  const target = selection.target && isTargetKey(selection.target)
    ? targetPresets[selection.target]
    : undefined;
  const company = lookupCompany(selection.company, companies);
  const application = target && company ? company.applications[target.key] : undefined;

  if (!target && !company) return null;

  const promptParts = [
    target?.promptContext,
    company && !application ? companyOnlyPrompt(company.label) : undefined,
    application?.locationContext
      ? `For public location questions in this application context, answer: ${application.locationContext}. Do not disclose a street address, ZIP code, precise residential city, or phone number.`
      : undefined,
    application?.promptDelta,
  ].filter(Boolean);

  // With an application active, the hero shows only the applied-for title, held still, so a
  // reviewer arriving from that posting sees the role they are hiring for and nothing else.
  // A target-only link rotates that target's durable titles. Default and static public
  // surfaces keep using the employer-neutral profile titles.
  const appliedTitle = application ? application.heroTitle ?? application.sourceRole : undefined;
  const heroTitles = target ? (appliedTitle ? [appliedTitle] : target.heroTitles) : undefined;

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
    heroTitles,
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

// --- Private preset JSON (schema version 1) ---------------------------------------
//
// {
//   "version": 1,
//   "companies": {
//     "<key>": {
//       "label": string,
//       "applications": {
//         "<targetKey>": {
//           "sourceRole": string,
//           "heroTitle"?: string,
//           "reqId"?: string,
//           "sourceUrl"?: string,
//           "locationContext"?: string,
//           "promptDelta": string,
//           "suggestedQuestions": string[]
//         }
//       }
//     }
//   }
// }
//
// Validation errors name the offending path but never echo a value, so a malformed
// private file cannot leak its contents into logs.

const PRESET_SCHEMA_VERSION = 1;

class PresetSchemaError extends Error {
  constructor(path: string, problem: string) {
    super(`Invalid role-context presets at ${path}: ${problem}`);
    this.name = "PresetSchemaError";
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(obj: Record<string, unknown>, field: string, path: string): string {
  const value = obj[field];
  if (typeof value !== "string" || value.length === 0) {
    throw new PresetSchemaError(`${path}.${field}`, "expected a non-empty string");
  }
  return value;
}

function optionalString(
  obj: Record<string, unknown>,
  field: string,
  path: string,
): string | undefined {
  if (!Object.hasOwn(obj, field) || obj[field] === undefined) return undefined;
  const value = obj[field];
  if (typeof value !== "string") {
    throw new PresetSchemaError(`${path}.${field}`, "expected a string when present");
  }
  return value;
}

function requireStringArray(obj: Record<string, unknown>, field: string, path: string): string[] {
  const value = obj[field];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new PresetSchemaError(`${path}.${field}`, "expected an array of strings");
  }
  return [...value];
}

const APPLICATION_FIELDS = new Set([
  "sourceRole",
  "heroTitle",
  "reqId",
  "sourceUrl",
  "locationContext",
  "promptDelta",
  "suggestedQuestions",
]);

function parseApplication(raw: unknown, path: string): CompanyApplicationPreset {
  if (!isPlainObject(raw)) throw new PresetSchemaError(path, "expected an object");
  for (const field of Object.keys(raw)) {
    if (!APPLICATION_FIELDS.has(field)) {
      throw new PresetSchemaError(`${path}.${field}`, "unknown field");
    }
  }
  const application: CompanyApplicationPreset = {
    sourceRole: requireString(raw, "sourceRole", path),
    promptDelta: requireString(raw, "promptDelta", path),
    suggestedQuestions: requireStringArray(raw, "suggestedQuestions", path),
  };
  const heroTitle = optionalString(raw, "heroTitle", path);
  const reqId = optionalString(raw, "reqId", path);
  const sourceUrl = optionalString(raw, "sourceUrl", path);
  const locationContext = optionalString(raw, "locationContext", path);
  if (heroTitle !== undefined) application.heroTitle = heroTitle;
  if (reqId !== undefined) application.reqId = reqId;
  if (sourceUrl !== undefined) application.sourceUrl = sourceUrl;
  if (locationContext !== undefined) application.locationContext = locationContext;
  return application;
}

function parseCompany(key: string, raw: unknown, path: string): CompanyPreset {
  if (!isPlainObject(raw)) throw new PresetSchemaError(path, "expected an object");
  for (const field of Object.keys(raw)) {
    if (field !== "label" && field !== "applications") {
      throw new PresetSchemaError(`${path}.${field}`, "unknown field");
    }
  }
  const label = requireString(raw, "label", path);
  const rawApplications = raw.applications;
  if (!isPlainObject(rawApplications)) {
    throw new PresetSchemaError(`${path}.applications`, "expected an object");
  }
  const applications: Partial<Record<TargetKey, CompanyApplicationPreset>> = {};
  for (const targetKey of Object.keys(rawApplications)) {
    if (!isTargetKey(targetKey)) {
      throw new PresetSchemaError(
        `${path}.applications`,
        `application key is not a known target (expected one of ${TARGET_KEYS.join(", ")})`,
      );
    }
    applications[targetKey] = parseApplication(
      rawApplications[targetKey],
      `${path}.applications.${targetKey}`,
    );
  }
  return { key, label, applications };
}

export function parseCompanyPresetMap(raw: unknown): CompanyPresetMap {
  if (!isPlainObject(raw)) throw new PresetSchemaError("$", "expected an object");
  for (const field of Object.keys(raw)) {
    if (field !== "version" && field !== "companies") {
      throw new PresetSchemaError(`$.${field}`, "unknown field");
    }
  }
  if (raw.version !== PRESET_SCHEMA_VERSION) {
    throw new PresetSchemaError("$.version", `expected ${PRESET_SCHEMA_VERSION}`);
  }
  const companies = raw.companies;
  if (!isPlainObject(companies)) {
    throw new PresetSchemaError("$.companies", "expected an object");
  }

  // Null prototype so the map itself can never resolve inherited keys.
  const map: CompanyPresetMap = Object.create(null);
  for (const key of Object.keys(companies)) {
    if (!isCompanyKeyShape(key)) {
      throw new PresetSchemaError(
        "$.companies",
        `company key does not match ${COMPANY_KEY_PATTERN.source}`,
      );
    }
    map[key] = parseCompany(key, companies[key], `$.companies.${key}`);
  }
  return map;
}
