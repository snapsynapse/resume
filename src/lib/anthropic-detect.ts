// Detects whether the visitor likely arrived via an Anthropic recruiting surface.
// Returns a short role label that the Edge function injects into the system prompt,
// or null when no signal is present. Frontend-only — runs once on AIChat mount.

const ANTHROPIC_REFERRER_PATTERNS = [
  "anthropic.com",
  "boards.greenhouse.io/anthropic",
  "job-boards.greenhouse.io/anthropic",
];

const ROLE_LABELS: Record<string, string> = {
  "anthropic-leadtd": "Anthropic — Lead, Talent Development & Enablement",
  "anthropic-certdev": "Anthropic — Certification Development Lead",
  "anthropic-deveded": "Anthropic — Developer Education Lead",
  "anthropic-applied": "Anthropic — Applied AI / forward-deployed",
  anthropic: "Anthropic (general)",
};

export function detectRoleContext(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role")?.toLowerCase();
  if (roleParam && ROLE_LABELS[roleParam]) return ROLE_LABELS[roleParam];
  if (roleParam?.startsWith("anthropic-")) return `Anthropic — ${roleParam.replace("anthropic-", "")}`;

  const ref = (typeof document !== "undefined" && document.referrer) || "";
  if (ANTHROPIC_REFERRER_PATTERNS.some((p) => ref.includes(p))) {
    return ROLE_LABELS.anthropic;
  }

  return null;
}
