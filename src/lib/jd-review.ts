// Deterministic, local job-description business-context scanner.
//
// This is NOT PII anonymization and NOT a legal guarantee. It flags likely
// non-public business details so a user can review them before a JD is sent
// for fit analysis. It runs entirely in the browser, calls no network service,
// and never emits scanned text to analytics.
//
// High-confidence rules are explicit phrases and code patterns from the spec.
// Medium-confidence rules are adjacency heuristics that are intentionally
// uncertain — the UI presents them as "might be" and the user decides.

export type Confidence = "high" | "medium";

export type Category =
  | "confidential-search"
  | "internal-job-code"
  | "client-name"
  | "unreleased-initiative"
  | "internal-project"
  | "strategic-plan"
  | "employee-name"
  | "internal-comp"
  | "security-sensitive";

export interface Flag {
  /** Stable within a single scan result; used as a React key. */
  id: string;
  /** Inclusive start offset of the redaction span in the source text. */
  start: number;
  /** Exclusive end offset of the redaction span in the source text. */
  end: number;
  /** The exact substring [start, end) that the placeholder would replace. */
  match: string;
  category: Category;
  confidence: Confidence;
  /** Bracketed placeholder, e.g. "[INTERNAL PROJECT]". */
  placeholder: string;
  /** Plain-language reason shown to the user. */
  explanation: string;
}

const PLACEHOLDER: Record<Category, string> = {
  "confidential-search": "[CONFIDENTIAL SEARCH CONTEXT]",
  "internal-job-code": "[INTERNAL JOB CODE]",
  "client-name": "[CLIENT NAME]",
  "unreleased-initiative": "[UNRELEASED INITIATIVE]",
  "internal-project": "[INTERNAL PROJECT]",
  "strategic-plan": "[STRATEGIC PLAN]",
  "employee-name": "[EMPLOYEE NAME]",
  "internal-comp": "[INTERNAL COMP DETAIL]",
  "security-sensitive": "[SECURITY-SENSITIVE DETAIL]",
};

export const placeholderFor = (category: Category): string => PLACEHOLDER[category];

// --- Allowlist: details that usually help the assessment (spec "Usually preserve").
// If a flag's redaction span contains one of these tokens, the flag is dropped.
// Keeps normal role context (public tools, public compliance domains) unflagged.
const ALLOWLIST = [
  "Workday",
  "Salesforce",
  "ServiceNow",
  "AWS",
  "Azure",
  "GCP",
  "Cornerstone",
  "Degreed",
  "Docebo",
  "SAP",
  "Oracle",
  "SuccessFactors",
  "Kubernetes",
  "SOC 2",
  "HIPAA",
  "GDPR",
  "FedRAMP",
  "ISO 27001",
];
const ALLOWLIST_RE = new RegExp(
  `\\b(?:${ALLOWLIST.map(escapeRegex).join("|")})\\b`,
  "i",
);

// --- Stopwords: only applied to the proper-noun portion of MEDIUM adjacency
// rules, to suppress sentence-initial words and generic role/function nouns
// ("Project Manager", "reports to Engineering Operations") that are not names.
const STOPWORDS = new Set(
  [
    // sentence / header starts
    "The", "A", "An", "We", "Our", "You", "Your", "This", "These", "Those",
    "It", "Its", "In", "On", "At", "For", "And", "Or", "But", "As", "To", "Of",
    "With", "By", "If", "When", "While", "Their", "His", "Her", "My", "All",
    "Any", "Each", "Every", "Some", "Most", "More", "Less", "New", "Key",
    "Other", "Both", "Either", "Who", "What", "How", "Why",
    // generic role / function nouns
    "Manager", "Managers", "Management", "Lead", "Leads", "Leader",
    "Leadership", "Owner", "Owners", "Coordinator", "Director", "Directors",
    "Engineer", "Engineers", "Engineering", "Analyst", "Analysts",
    "Specialist", "Team", "Teams", "Office", "Operations", "Product",
    "Products", "Sales", "Marketing", "Finance", "People", "Talent", "Plan",
    "Plans", "Planning", "Delivery", "Strategy", "Stakeholder", "Stakeholders",
    "Vendor", "Vendors", "Roadmap", "Initiative", "Program", "Project",
    "Launch", "Migration", "Rollout", "Senior", "Junior", "Principal", "Staff",
  ].map((w) => w.toLowerCase()),
);

interface Rule {
  category: Category;
  confidence: Confidence;
  /** Must include the `g` (global) flag for matchAll. */
  regex: RegExp;
  /** Capture group whose span is replaced. 0 = whole match. */
  redactGroup: number;
  /**
   * Capture group whose first token is checked against STOPWORDS.
   * Only enforced for medium-confidence rules. 0 disables the check.
   */
  nameGroup: number;
  explanation: string;
}

// Proper-noun-ish phrase: a capitalized token plus up to 3 more capitalized tokens.
const CAP = "[A-Z][A-Za-z0-9]*";
const CAP_PHRASE = `${CAP}(?:\\s+${CAP}){0,3}`;
const CAP_PHRASE_MULTI = `${CAP}(?:\\s+${CAP}){1,3}`;

const phraseRule = (
  category: Category,
  confidence: Confidence,
  phrases: string[],
  explanation: string,
): Rule => ({
  category,
  confidence,
  regex: new RegExp(`\\b(?:${phrases.map(escapeRegex).join("|")})\\b`, "gi"),
  redactGroup: 0,
  nameGroup: 0,
  explanation,
});

const RULES: Rule[] = [
  // --- High-confidence: requisition / job codes (spec line 92).
  {
    category: "internal-job-code",
    confidence: "high",
    regex:
      /\b(?:REQ-\d+|JR-\d+|JOB-\d+|HC-\d{4}-\d+|FY\d{2}-HC-\d+)\b/gi,
    redactGroup: 0,
    nameGroup: 0,
    explanation:
      "Looks like an internal requisition or job code. These expose internal workflow and are not candidate-facing.",
  },
  // Generic medium code: short uppercase prefix + a numeric run.
  {
    category: "internal-job-code",
    confidence: "medium",
    regex: /\b[A-Z]{2,4}-\d{3,}(?:-\d+)?\b/g,
    redactGroup: 0,
    nameGroup: 0,
    explanation:
      "This might be an internal code. Keep it if it is a public identifier; replace it if it is an internal requisition or headcount reference.",
  },

  // --- High-confidence: confidential search phrases (spec line 93).
  phraseRule(
    "confidential-search",
    "high",
    [
      "confidential search",
      "replacement search",
      "backfill for",
      "replacing current",
      "incumbent",
      "do not post",
      "not public yet",
    ],
    "Signals a confidential or replacement search. May reveal an incumbent transition or a sensitive leadership change.",
  ),

  // --- High-confidence: compensation planning phrases (spec line 94).
  phraseRule(
    "internal-comp",
    "high",
    [
      "internal grade",
      "comp ratio",
      "exception approval",
      "equity refresh",
      "unpublished range",
      "offer ceiling",
    ],
    "Looks like internal compensation planning. Published salary ranges can stay; internal grades and approvals should be reviewed.",
  ),

  // --- High-confidence: strategy phrases (spec line 95).
  phraseRule(
    "strategic-plan",
    "high",
    [
      "stealth",
      "unannounced",
      "pre-launch",
      "market entry",
      "acquisition",
      "reorg",
      "restructure",
      "RIF",
      "reduction in force",
    ],
    "May reference a strategic move (M&A, reorg, market entry, stealth work) before it is public.",
  ),

  // --- High-confidence: security phrases (spec line 96).
  phraseRule(
    "security-sensitive",
    "high",
    [
      "active incident",
      "vulnerability",
      "exploit",
      "breach",
      "facility access",
      "classified",
      "clearance-sensitive",
    ],
    "May expose security-sensitive operational detail such as incidents, vulnerabilities, or clearance-sensitive work.",
  ),

  // --- Medium-confidence: capitalized project-like phrases near trigger words
  // (spec line 98). Case-sensitive on purpose — the signal is real
  // capitalization. Trigger words allow a capitalized first letter (sentence
  // start) but the proper-noun phrase must be genuinely capitalized.
  // Leading trigger: "Project Atlas", "Program Phoenix".
  {
    category: "internal-project",
    confidence: "medium",
    regex: new RegExp(`\\b(?:[Pp]roject|[Pp]rogram)\\s+(${CAP_PHRASE})`, "g"),
    redactGroup: 0,
    nameGroup: 1,
    explanation:
      "This might be an internal project or program name. Keep it if it is public or useful role context; replace it if it is non-public.",
  },
  // Trailing trigger for initiatives / launches: "Atlas initiative", "Helios launch".
  {
    category: "unreleased-initiative",
    confidence: "medium",
    regex: new RegExp(
      `\\b(${CAP_PHRASE_MULTI})\\s+(?:[Ii]nitiative|[Rr]oadmap|[Ll]aunch)\\b`,
      "g",
    ),
    redactGroup: 1,
    nameGroup: 1,
    explanation:
      "This might name an unreleased initiative or launch. Keep it if it is already public; replace it if it reveals strategy before announcement.",
  },
  // Trailing trigger for migrations / rollouts: "Acme Bank rollout", "Atlas Platform migration".
  // A capitalized name in front of a rollout/migration most often names the
  // client or customer the work is delivered for, so it is treated as a client name.
  {
    category: "client-name",
    confidence: "medium",
    regex: new RegExp(
      `\\b(${CAP_PHRASE_MULTI})\\s+(?:[Mm]igration|[Rr]ollout)\\b`,
      "g",
    ),
    redactGroup: 1,
    nameGroup: 1,
    explanation:
      "This might name a non-public client or customer the work is delivered for. Keep it if the relationship is public; replace it if it is confidential.",
  },
  // Client-like triggers: "Globex account", "Acme client".
  {
    category: "client-name",
    confidence: "medium",
    regex: new RegExp(
      `\\b(${CAP_PHRASE})\\s+(?:[Cc]lient|[Cc]ustomer|[Aa]ccount|[Pp]artner)\\b`,
      "g",
    ),
    redactGroup: 1,
    nameGroup: 1,
    explanation:
      "This might name a non-public client or customer. Keep it if the relationship is public; replace it if it is confidential.",
  },

  // --- Medium-confidence: names near hiring-process words (spec line 99).
  {
    category: "employee-name",
    confidence: "medium",
    regex: new RegExp(
      `\\b(?:[Rr]eports?\\s+to|[Hh]iring\\s+manager|[Ii]nterview\\s+panel|[Bb]ackfill\\s+for|[Mm]anaged\\s+by|[Ll]ed\\s+by|[Rr]eplacing)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})\\b`,
      "g",
    ),
    redactGroup: 1,
    nameGroup: 1,
    explanation:
      "This might name a specific person. Naming individuals can make a confidential search identifiable.",
  },
];

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstTokenIsStopword(text: string): boolean {
  const first = text.trim().split(/\s+/)[0] ?? "";
  return STOPWORDS.has(first.toLowerCase());
}

function spanOverlapsAllowlist(text: string): boolean {
  return ALLOWLIST_RE.test(text);
}

interface GroupSpan {
  start: number;
  end: number;
}

// Resolve a capture group's offset without the ES2022 `d` (indices) flag.
// Group 0 is anchored at match.index. For capture groups, the group text is
// located within the full match — safe here because every redact group is
// either start-anchored or separated from the rest of the match by a distinct
// trigger word, so it never appears ambiguously earlier in the match.
function groupSpan(
  match: RegExpMatchArray,
  group: number,
): GroupSpan | null {
  const matchStart = match.index ?? 0;
  const full = match[0];
  if (group === 0) {
    return { start: matchStart, end: matchStart + full.length };
  }
  const groupText = match[group];
  if (groupText == null) return null;
  const rel = full.indexOf(groupText);
  if (rel < 0) return null;
  return { start: matchStart + rel, end: matchStart + rel + groupText.length };
}

/**
 * Scan job-description text for likely non-public business details.
 * Pure and deterministic: same input always yields the same flags.
 */
export function scanJD(text: string): Flag[] {
  if (!text) return [];

  const raw: Flag[] = [];
  let counter = 0;

  for (const rule of RULES) {
    for (const match of text.matchAll(rule.regex)) {
      const redact = groupSpan(match, rule.redactGroup);
      if (!redact) continue;

      const matchText = text.slice(redact.start, redact.end);

      // Medium rules: drop generic role/header words that are not real names.
      if (rule.confidence === "medium" && rule.nameGroup > 0) {
        const nameSpan = groupSpan(match, rule.nameGroup);
        const nameText = nameSpan
          ? text.slice(nameSpan.start, nameSpan.end)
          : matchText;
        if (firstTokenIsStopword(nameText)) continue;
      }

      // Allowlisted public context (tools, compliance domains) is never flagged.
      if (spanOverlapsAllowlist(matchText)) continue;

      raw.push({
        id: `f${counter++}`,
        start: redact.start,
        end: redact.end,
        match: matchText,
        category: rule.category,
        confidence: rule.confidence,
        placeholder: PLACEHOLDER[rule.category],
        explanation: rule.explanation,
      });
    }
  }

  return dedupe(raw);
}

// Resolve overlapping flags: prefer high confidence, then the longer span.
// Guarantees the returned flags have non-overlapping [start, end) ranges,
// sorted by start, so they can be applied or highlighted without conflict.
function dedupe(flags: Flag[]): Flag[] {
  const ranked = [...flags].sort((a, b) => {
    if (a.confidence !== b.confidence) return a.confidence === "high" ? -1 : 1;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenA !== lenB) return lenB - lenA;
    return a.start - b.start;
  });

  const accepted: Flag[] = [];
  for (const flag of ranked) {
    const overlaps = accepted.some(
      (kept) => flag.start < kept.end && kept.start < flag.end,
    );
    if (!overlaps) accepted.push(flag);
  }

  return accepted.sort((a, b) => a.start - b.start);
}

/**
 * Replace a single flag's span with its placeholder, returning new text.
 * Offsets refer to the text the flag was scanned from.
 */
export function applyFlag(text: string, flag: Flag): string {
  return text.slice(0, flag.start) + flag.placeholder + text.slice(flag.end);
}

/**
 * Apply several flags at once. Flags are applied right-to-left so earlier
 * offsets stay valid. Overlapping flags are not supported (scanJD already
 * returns non-overlapping flags); pass a subset of one scan's output.
 */
export function applyFlags(text: string, flags: Flag[]): string {
  const ordered = [...flags].sort((a, b) => b.start - a.start);
  let result = text;
  for (const flag of ordered) {
    result = result.slice(0, flag.start) + flag.placeholder + result.slice(flag.end);
  }
  return result;
}

/** Coarse length bucket for analytics — never the text itself. */
export function lengthBucket(length: number): string {
  if (length < 500) return "0-499";
  if (length < 2000) return "500-1999";
  if (length < 5000) return "2000-4999";
  return "5000+";
}
