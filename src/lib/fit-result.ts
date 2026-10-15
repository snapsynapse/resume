export interface FitResult {
  verdict: "strong" | "moderate" | "weak";
  title: string;
  summary: string;
  matches: { requirement: string; evidence: string }[];
  gaps: { area: string; note: string }[];
  whatTransfers: string;
  recommendation: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function hasStringFields(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === "string");
}

// Shared client/API boundary. A provider tool declaration and a TypeScript cast
// do not validate JSON at runtime. Match the declared schema before using data.
export function isFitResult(value: unknown): value is FitResult {
  if (!isObject(value) || !hasExactKeys(value, [
    "verdict", "title", "summary", "matches", "gaps", "whatTransfers", "recommendation",
  ])) return false;
  if (!["strong", "moderate", "weak"].includes(value.verdict as string)) return false;
  if (!hasStringFields(value, ["title", "summary", "whatTransfers", "recommendation"])) return false;
  return Array.isArray(value.matches) && value.matches.every((item) =>
    isObject(item) && hasExactKeys(item, ["requirement", "evidence"]) &&
    hasStringFields(item, ["requirement", "evidence"]),
  ) && Array.isArray(value.gaps) && value.gaps.every((item) =>
    isObject(item) && hasExactKeys(item, ["area", "note"]) && hasStringFields(item, ["area", "note"]),
  );
}
