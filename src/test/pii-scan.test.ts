import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// PII / compensation exposure scan for committed text content.
//
// Scope (per README "Private FAQ disclosure model"): this scan covers ONLY content that ships
// in this repo — source, public artifacts, top-level docs, API handlers, scripts. It is not a
// runtime input filter. User-submitted text in form fields and chat messages is governed by
// the API handlers' prompt-boundary tests and the JD review scanner, not by this file.
//
// Reveal-safety note: this repository is open source. The literal values being protected
// (specific phone numbers, ZIPs, residential city / state strings) are not present in this
// file. The blocklist is encoded as SHA-256 digests of normalized lowercase forms, so a reader
// of the source learns the categories the scan covers but not the underlying values. Generic
// shape-only patterns (any US-format phone number, any dollar-amount, any SSN shape) are kept
// as literals because the patterns themselves reveal no candidate-specific information.

const root = process.cwd();

const SCAN_ROOTS = [
  "api",
  "public",
  "scripts",
  "src",
  "index.html",
  "vercel.json",
  "README.md",
  "SECURITY.md",
  "EVIDENCE.md",
  "ROADMAP.md",
];

const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
]);

const EXCLUDED_PATH_FRAGMENTS = [
  "node_modules",
  "dist",
  ".vercel",
  ".next",
  ".turbo",
  "package-lock.json",
  // The scan file itself contains generic shape patterns it matches against — exclude.
  "src/test/pii-scan.test.ts",
];

// Test fixtures (e.g. synthetic JD strings with salary ranges) are excluded from shape-based
// scans because they are not shipped content. Hash-based literal scans still run against
// fixtures, so candidate-specific literals cannot hide in a test file.
const TEST_FILE_REGEX = /\.test\.(ts|tsx|js|mjs|cjs)$/;

// --- Shape-based scanners (categories named openly; reveals nothing candidate-specific) ---

interface ShapePattern {
  id: string;
  category: string;
  pattern: RegExp;
}

const SHAPE_PATTERNS: ShapePattern[] = [
  {
    id: "us-phone-shape",
    category: "US-format phone number",
    pattern: /(?<![\w\d])(?:\+?1[-.\s]?)?\(?[2-9][0-9]{2}\)?[-.\s]?[2-9][0-9]{2}[-.\s]?[0-9]{4}(?![\w\d])/,
  },
  {
    id: "ssn-shape",
    category: "US SSN-shaped string",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
  },
  {
    id: "dob-shape",
    category: "Date-of-birth-shaped string",
    pattern: /\b(?:0?[1-9]|1[0-2])\/(?:0?[1-9]|[12][0-9]|3[01])\/(?:19|20)\d{2}\b/,
  },
  {
    id: "dollar-amount",
    category: "Specific dollar-amount figure",
    pattern: /\$\s?\d{1,3}(?:[,.]\d{3})*(?:[KkMm]\b|\b)/,
  },
  {
    id: "comp-range-k",
    category: "Compensation range in K notation",
    pattern: /\b\d{2,4}\s?[Kk]\s?[-–—]\s?\d{2,4}\s?[Kk]\b/,
  },
  {
    id: "comp-range-mixed",
    category: "Compensation range in mixed notation",
    pattern: /\$?\d{2,4}[Kk],?\s?(?:to|through|[-–—])\s?\$?\d{2,4}[Kk]/,
  },
];

// --- Hash-based literal blocklist ---
//
// Each entry is the SHA-256 hex digest of a normalized lowercase form of a sensitive literal
// (residential city, state-as-residence, ZIP, specific phone). The literal itself never
// appears here. The scan tokenizes file content into 1-to-N-word lowercase n-grams, hashes
// each, and reports any match. Phone-shape strings are normalized to digits-only before
// hashing so format variation does not bypass the check.
//
// Categories represented (no order, no labels — order rotates when entries are added):
//   - residential city / town (single-word and multi-word)
//   - state-as-residence
//   - specific ZIP
//   - specific personal phone (digits-only)
//
// To extend the blocklist: compute `sha256(literal.toLowerCase())` and append. Do not commit
// the literal alongside the hash.

const BLOCKED_LITERAL_HASHES = new Set<string>([
  "75371f5a57ca5232c85c1858415de4b06f5c9e4bc879404e348748c273540986",
  "a8bc68fa51fd88030c9a60dcbb9117713a568c9c20be9553cb22c50cac538b9c",
  "ed5b098a043912088a7976451d5584fb1aff1a965b27bf9ca02282d323e050ee",
  "86cef1c317486ef603cc65cee2554d5a7dba9c90462f2ee6759359f2fdb014d9",
  "a0aadfc140df8f339fd255908bfd371e9ec82f9434b707e7cdb04270c5b65b85",
  "40dceebf439dee723639ea6aed8fa07672db1de06e60f60ca9d3921f0fe0971a",
  "8ff313d9066446d481967d713492a5ac5e3de4d587d2efc7a07432e425406691",
]);

// Allowlist of hashes that match by design (contexts where the literal is legitimate, e.g. a
// public regulatory project reference rather than a residence signal). Stored as
// `sha256(line.toLowerCase())` so the legitimate context never has to appear in this file.
const ALLOWED_LINE_HASHES = new Set<string>([
  // Legitimate non-residential / regulatory-anchor reference. Hash of the lowercased full line.
  "2263976cde56cedf778112fdbc0c6c286e778cdec2d67d235182052312b6e36a",
]);

const MAX_NGRAM = 4;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function tokenizeLine(line: string): string[] {
  // Word tokens of letters/digits/apostrophes. Lowercased.
  return (line.toLowerCase().match(/[a-z0-9'']+/g) ?? []) as string[];
}

function ngrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i++) {
    out.push(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

function digitRuns(line: string): string[] {
  // Strip non-digits per maximal numeric run, then return runs of length >= 10 (phone-length)
  // including any longer runs sliced to 10-digit windows.
  const runs = line.match(/\d+/g) ?? [];
  const out: string[] = [];
  for (const run of runs) {
    if (run.length >= 10) {
      for (let i = 0; i + 10 <= run.length; i++) {
        out.push(run.slice(i, i + 10));
      }
    }
  }
  return out;
}

function digitRunsFromContiguous(line: string): string[] {
  // Build phone candidates by gluing digits across light separators (-, ., space, parens).
  // Returns 10-digit windows from each glued run.
  const glued = line.replace(/[^\d]/g, "");
  const out: string[] = [];
  if (glued.length >= 10) {
    for (let i = 0; i + 10 <= glued.length; i++) {
      out.push(glued.slice(i, i + 10));
    }
  }
  return out;
}

// --- File collection ---

function collectFiles(targetPath: string): string[] {
  const abs = join(root, targetPath);
  const stats = (() => {
    try {
      return statSync(abs);
    } catch {
      return null;
    }
  })();
  if (!stats) return [];
  if (stats.isFile()) return [abs];
  if (!stats.isDirectory()) return [];
  const out: string[] = [];
  for (const entry of readdirSync(abs)) {
    const child = join(abs, entry);
    if (EXCLUDED_PATH_FRAGMENTS.some((frag) => child.includes(frag))) continue;
    const childStat = statSync(child);
    if (childStat.isDirectory()) {
      out.push(...collectFiles(relative(root, child)));
    } else if (SCAN_EXTENSIONS.has(extname(child).toLowerCase())) {
      out.push(child);
    }
  }
  return out;
}

const allCollectedFiles = SCAN_ROOTS.flatMap((p) => collectFiles(p)).filter(
  (file) => !EXCLUDED_PATH_FRAGMENTS.some((frag) => file.includes(frag)),
);
const shippedFiles = allCollectedFiles.filter((file) => !TEST_FILE_REGEX.test(file));
// Hash-based scans run against shipped files AND test fixtures, since the specific literals
// must not leak into a fixture either.
const filesForLiteralScan = allCollectedFiles;

// --- Tests ---

describe("PII / compensation exposure scan", () => {
  it("collects a non-empty file set so the scan cannot silently pass", () => {
    expect(shippedFiles.length).toBeGreaterThan(10);
  });

  for (const shape of SHAPE_PATTERNS) {
    it(`does not expose ${shape.id} (${shape.category}) in shipped content`, () => {
      const violations: { file: string; line: number; snippet: string }[] = [];
      for (const file of shippedFiles) {
        const content = readFileSync(file, "utf8");
        content.split("\n").forEach((line, idx) => {
          if (shape.pattern.test(line)) {
            violations.push({
              file: relative(root, file),
              line: idx + 1,
              snippet: line.trim().slice(0, 200),
            });
          }
        });
      }
      if (violations.length > 0) {
        const detail = violations
          .map((v) => `  ${v.file}:${v.line}  ${v.snippet}`)
          .join("\n");
        throw new Error(
          `Shape pattern "${shape.id}" matched ${violations.length} location(s):\n${detail}`,
        );
      }
    });
  }

  it("does not expose any blocklisted literal (hash-based scan)", () => {
    if (BLOCKED_LITERAL_HASHES.size === 0) return;
    const violations: { file: string; line: number }[] = [];
    for (const file of filesForLiteralScan) {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (ALLOWED_LINE_HASHES.has(sha256(line.toLowerCase()))) return;
        const tokens = tokenizeLine(line);
        const candidates = new Set<string>();
        for (let n = 1; n <= MAX_NGRAM; n++) {
          for (const ng of ngrams(tokens, n)) candidates.add(ng);
        }
        for (const tok of tokens) candidates.add(tok);
        for (const phoneCandidate of digitRuns(line)) candidates.add(phoneCandidate);
        for (const phoneCandidate of digitRunsFromContiguous(line)) candidates.add(phoneCandidate);
        for (const candidate of candidates) {
          if (BLOCKED_LITERAL_HASHES.has(sha256(candidate))) {
            violations.push({ file: relative(root, file), line: idx + 1 });
            break;
          }
        }
      });
    }
    if (violations.length > 0) {
      // Intentionally do NOT echo the matched substring in the error message — it would defeat
      // the reveal-safe design. The file:line location is enough for the editor to locate the
      // line and inspect locally.
      const detail = violations.map((v) => `  ${v.file}:${v.line}`).join("\n");
      throw new Error(
        `Hash-based literal scan matched ${violations.length} location(s):\n${detail}\n\n` +
          `If a match is legitimate (e.g. a non-residential reference), allowlist the line by ` +
          `computing sha256 of the lowercased full line and adding it to ALLOWED_LINE_HASHES ` +
          `in src/test/pii-scan.test.ts.`,
      );
    }
  });

  // Positive controls — allowlisted identifiers must appear so the scan is wired to real
  // content. Failing this test means the file set is wrong, not that allowlisted strings are
  // missing from any specific file.
  it("confirms allowlisted name, email, and region appear in shipped content", () => {
    const haystack = shippedFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(haystack).toMatch(/Sam Rogers/);
    expect(haystack).toMatch(/sam@sam-rogers\.com/);
    expect(haystack).toMatch(/SF Bay Area/);
  });
});
