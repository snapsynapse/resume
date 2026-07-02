// Detects whether the visitor likely arrived via an Anthropic recruiting surface.
// Returns a short role label that the Edge function injects into the system prompt,
// or null when no signal is present. Frontend-only — runs once on AIChat mount.

const ANTHROPIC_REFERRER_PATTERNS = [
  "anthropic.com",
  "boards.greenhouse.io/anthropic",
  "job-boards.greenhouse.io/anthropic",
];

const CURRENT_ANTHROPIC_ROLE = "Anthropic — Head of Content & Curriculum, Education";

export function detectRoleContext(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role")?.toLowerCase();
  if (roleParam === "anthropic") return CURRENT_ANTHROPIC_ROLE;

  const ref = (typeof document !== "undefined" && document.referrer) || "";
  if (ANTHROPIC_REFERRER_PATTERNS.some((p) => ref.includes(p))) {
    return CURRENT_ANTHROPIC_ROLE;
  }

  return null;
}
