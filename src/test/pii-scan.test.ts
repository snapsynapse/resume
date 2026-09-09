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
// Reveal-resistance note: this repository is open source. The literal values being protected
// (specific phone numbers, ZIPs, residential city / state strings) are not present in this
// file. The blocklist is encoded as SHA-256 digests of normalized lowercase forms, so a reader
// of the source learns the categories the scan covers but not the underlying values. Generic
// shape-only patterns (any US-format phone number, any dollar-amount, any SSN shape) are kept
// as literals because the patterns themselves reveal no candidate-specific information. Note
// this is a reveal-resistance property, not a cryptographic one: the digests are unsalted
// SHA-256 over low-entropy inputs (state names, ZIPs, phone numbers), which is attackable
// offline by a motivated party with a dictionary; see SECURITY "Reveal-resistant PII evals" for
// the attacker model and why a keyed hash was not used.

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
  "INTENT.md",
  ".github",
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
  ".yml",
  ".yaml",
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
//   - pursued employer label (from the private role-context presets)
//   - applied-for role title (from the private role-context presets)
//
// To extend the blocklist: compute `sha256(normalize(literal))` and append, where normalize is
// the same lowercase word-tokenize-and-space-join used by the scan (see `normalizeLiteral`).
// For the original residential/contact entries that is identical to `literal.toLowerCase()`.
// Do not commit the literal alongside the hash.

const BLOCKED_LITERAL_HASHES = new Set<string>([
  "a8bc68fa51fd88030c9a60dcbb9117713a568c9c20be9553cb22c50cac538b9c",
  "ed5b098a043912088a7976451d5584fb1aff1a965b27bf9ca02282d323e050ee",
  "86cef1c317486ef603cc65cee2554d5a7dba9c90462f2ee6759359f2fdb014d9",
  "a0aadfc140df8f339fd255908bfd371e9ec82f9434b707e7cdb04270c5b65b85",
  "40dceebf439dee723639ea6aed8fa07672db1de06e60f60ca9d3921f0fe0971a",
  "8ff313d9066446d481967d713492a5ac5e3de4d587d2efc7a07432e425406691",
  // Pursued employer labels and applied-for role titles; see README target routing.
  // Application presets live in a private JSON outside the repository. These digests are the
  // normalized (lowercased, punctuation-stripped, single-spaced) label and sourceRole of each
  // entry, so CI fails reveal-resistantly if a tracked file names one. A company legitimately
  // named on public surfaces as an AI usage provider is excluded, as is any title too short to
  // be distinctive. Regenerate from the private file when an application is added or closed.
  "22972aaf01800caeb35da2fbf5f395509c084a818cbb65663ea40c6758e18fa4",
  "c9629fc422c960bf417f34c5fddcf81252644b67245d64b04d4fb8c95ad713b1",
  "ea340acba45df9023ecdf1cd1e7500fbc3204073544e916a427bd55be541f9d8",
  "608adad96dd502b1c3e6c47e460e489fabd0c75e6446eed1ec83a7f5d6f5ab6a",
  "22cfdf386b9da44a9a9df04c246bf0d325efba71c88ad9c8a637d411241a6e67",
  "a89821a6490f81fe97a562e94b5c11078169ce602b2419dcb21500a461271749",
  "ab7d0a36ecbe10c286f92a49bffb57ed6bf5bc6c3a3e15967f3ea8d028316969",
  "daddae77e3a98292051d234f126bd236744208480231b8c957ae71285d95f356",
  "b769a6983b42d565e79bb4f3f534623453f301d39784e57804a649a67ea05327",
  "21ad7a8f5c2c423652634ac34b3f43e81aaacd639e957bc85d85c470a74e18e1",
  "478ae12b08623f00c71da4cc4a4d4d2f9f07a9e9b7d71a6e8701cbf4b6cbf939",
  "31a3cfc66f8259ed15963e1830c36a8d22b4022185c29a8f2117ceb8fda9c383",
  "2bc2bb8352a3f3bf984773b38b210606276761b0ecc4b3cce46e97d54ba4614b",
  "6171b6243aaf7ac82744791b84f89eb393dc40a203bf740047a7564eff072471",
  "a1f7f0fab9e505ecb7297977e87d5726a8682d53f54ace4af87e7916d515e92b",
  "68727090903ace2cd81d13f8fd48900f5fcc94d607b5efc366411da90da77bb1",
  "c4adc0f0440a6c653eaa5add9a984c035c0dc369be12adaf2e09801ccfd7950f",
]);

// Allowlist of hashes that match by design (contexts where the literal is legitimate, e.g. a
// public regulatory project reference rather than a residence signal). Stored as
// `sha256(line.toLowerCase())` so the legitimate context never has to appear in this file.
const ALLOWED_LINE_HASHES = new Set<string>([
  // Legitimate non-residential / regulatory-anchor reference. Hash of the lowercased full line.
  "2263976cde56cedf778112fdbc0c6c286e778cdec2d67d235182052312b6e36a",
]);

// Widest n-gram the scan hashes. Must cover the longest normalized blocklisted phrase
// (applied-for role titles run to seven words).
const MAX_NGRAM = 8;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function tokenizeLine(line: string): string[] {
  // Word tokens of letters/digits/apostrophes. Lowercased.
  return (line.toLowerCase().match(/[a-z0-9'']+/g) ?? []) as string[];
}

// The form a blocklisted literal is hashed in: the same tokenization the scan applies to
// file content, joined by single spaces. Maintainers compute new digests locally as
// sha256(normalizeLiteral(value)); never call it on a protected value inside a committed test.
function normalizeLiteral(literal: string): string {
  return tokenizeLine(literal).join(" ");
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

// One line against the blocklist: allowlisted lines pass, otherwise every token, n-gram up to
// MAX_NGRAM, and phone-shaped digit run is hashed and compared. Shared by the scan and its
// positive control so the two cannot drift apart.
function lineHitsBlocklist(line: string): boolean {
  if (ALLOWED_LINE_HASHES.has(sha256(line.toLowerCase()))) return false;
  const tokens = tokenizeLine(line);
  const candidates = new Set<string>();
  for (let n = 1; n <= MAX_NGRAM; n++) {
    for (const ng of ngrams(tokens, n)) candidates.add(ng);
  }
  for (const tok of tokens) candidates.add(tok);
  for (const phoneCandidate of digitRuns(line)) candidates.add(phoneCandidate);
  for (const phoneCandidate of digitRunsFromContiguous(line)) candidates.add(phoneCandidate);
  for (const candidate of candidates) {
    if (BLOCKED_LITERAL_HASHES.has(sha256(candidate))) return true;
  }
  return false;
}

// Positive-control sentinels. Built by reversing a nonsense string at runtime so the phrase
// itself never appears as adjacent tokens in this file (which the scan also reads). One is a
// single token, one is seven tokens: proving MAX_NGRAM still covers a full role title.
const reverse = (value: string) => value.split("").reverse().join("");
const SENTINEL_SINGLE = reverse("lenitnesnacsiip");
const SENTINEL_TITLE = reverse("neves xis evif ruof eerht owt lenitnes");
BLOCKED_LITERAL_HASHES.add(sha256(SENTINEL_SINGLE));
BLOCKED_LITERAL_HASHES.add(sha256(normalizeLiteral(SENTINEL_TITLE)));

describe("PII / compensation exposure scan", () => {
  it("collects a non-empty file set so the scan cannot silently pass", () => {
    expect(shippedFiles.length).toBeGreaterThan(10);
  });

  for (const shape of SHAPE_PATTERNS) {
    it(`does not expose ${shape.id} (${shape.category}) in shipped content`, () => {
      const violations: { file: string; line: number }[] = [];
      for (const file of shippedFiles) {
        const content = readFileSync(file, "utf8");
        content.split("\n").forEach((line, idx) => {
          if (shape.pattern.test(line)) {
            violations.push({
              file: relative(root, file),
              line: idx + 1,
            });
          }
        });
      }
      if (violations.length > 0) {
        // Intentionally do NOT echo the matched substring in the error message — a shape match
        // (phone-shaped, dollar-amount, etc.) can still be the exact sensitive value. Reporting
        // only the pattern category, file, and line keeps CI logs / issue pastes from leaking it;
        // the author opens the file locally at that line to inspect the actual hit.
        const detail = violations.map((v) => `  ${v.file}:${v.line}`).join("\n");
        throw new Error(
          `Shape pattern "${shape.id}" (${shape.category}) matched ${violations.length} location(s):\n${detail}`,
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
        if (lineHitsBlocklist(line)) violations.push({ file: relative(root, file), line: idx + 1 });
      });
    }
    if (violations.length > 0) {
      // Intentionally do NOT echo the matched substring in the error message — it would defeat
      // the reveal-resistant design. The file:line location is enough for the editor to locate
      // the line and inspect locally.
      const detail = violations.map((v) => `  ${v.file}:${v.line}`).join("\n");
      throw new Error(
        `Hash-based literal scan matched ${violations.length} location(s):\n${detail}\n\n` +
          `If a match is legitimate (e.g. a non-residential reference), allowlist the line by ` +
          `computing sha256 of the lowercased full line and adding it to ALLOWED_LINE_HASHES ` +
          `in src/test/pii-scan.test.ts.`,
      );
    }
  });

  // Positive control for the hash scan itself: a line carrying a blocklisted single token or a
  // blocklisted seven-word phrase must be flagged, and an ordinary line must not. Guards
  // against the scanner going inert (tokenizer, n-gram ceiling, or digest normalization drift).
  it("flags blocklisted tokens and multi-word phrases and passes ordinary lines", () => {
    expect(lineHitsBlocklist(`  sourceRole: "${SENTINEL_SINGLE}",`)).toBe(true);
    expect(lineHitsBlocklist(`  sourceRole: "${SENTINEL_TITLE.replace(/ /g, ", ")}",`)).toBe(true);
    expect(lineHitsBlocklist("  sourceRole: \"Learning Systems Program Lead\",")).toBe(false);
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

  // Negative control on the normalizer: the candidate's own public name and region must not
  // hash into the blocklist, so a blocklist regeneration that accidentally included a public
  // value would fail here rather than silently rejecting every public surface.
  it("does not blocklist public identity literals", () => {
    for (const literal of ["Sam Rogers", "SF Bay Area", "OpenAI"]) {
      expect(BLOCKED_LITERAL_HASHES.has(sha256(normalizeLiteral(literal)))).toBe(false);
    }
  });
});
