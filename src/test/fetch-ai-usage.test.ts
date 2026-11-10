// @vitest-environment node
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const startMarker = "<!-- ai-usage-snapshot:start (rewritten by scripts/fetch-ai-usage.mjs) -->";
const endMarker = "<!-- ai-usage-snapshot:end -->";
const previousIndex = `<html>${startMarker}previous figures${endMarker}</html>`;
const previousSnapshot = "// previously committed snapshot\n";

// Synthetic recovered rows, never the owner's usage record. Alternating dates deliberately
// leave gaps: only recorded tokens contribute to the floor, with no zero-filled history.
function dailyRecord(source = "typesafe_api") {
  return Array.from({ length: 100 }, (_, i) => ({
    date: new Date(Date.UTC(2026, 0, 1 + i * 2)).toISOString().slice(0, 10),
    sources: {
      [source]: { tokens: 6_000_000, fidelity: "exact" },
      ...(i === 0 ? { claude_chat: { tokens: 1_000_000, fidelity: "estimated" } } : {}),
    },
  }));
}

type InputPath = "summary.json" | "embedded daily record";

describe("AI usage snapshot refresh", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "resume-ai-usage-test-"));
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, "src/data"), { recursive: true });
    copyFileSync(join(process.cwd(), "scripts/fetch-ai-usage.mjs"), join(root, "scripts/fetch-ai-usage.mjs"));
    writeFileSync(join(root, "index.html"), previousIndex);
    writeFileSync(join(root, "src/data/ai-usage-snapshot.ts"), previousSnapshot);
    // Run the actual CLI in isolation. The preload replaces fetch in the child only;
    // no request reaches the network and neither tracked output can be changed by tests.
    writeFileSync(join(root, "mock-fetch.mjs"), `
import { readFileSync } from "node:fs";
const fixture = JSON.parse(readFileSync(new URL("./input.json", import.meta.url), "utf8"));
globalThis.fetch = async (url) => {
  if (url === "https://sam-rogers.com/ai-usage/summary.json") {
    return fixture.summary
      ? new Response(JSON.stringify(fixture.summary), { status: 200 })
      : new Response("Not found", { status: 404 });
  }
  if (url === "https://sam-rogers.com/ai-usage/") return new Response(fixture.html);
  throw new Error("Unexpected refresh request");
};
`);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function refresh(inputPath: InputPath, source = "typesafe_api", rows = dailyRecord(source)) {
    writeFileSync(join(root, "input.json"), JSON.stringify({
      summary: inputPath === "summary.json" ? {
        as_of: rows.at(-1)?.date,
        first_date: rows[0]?.date,
        total_tokens: 601_000_000,
        exact_tokens: 600_000_000,
        estimated_tokens: 1_000_000,
        sources: ["claude_chat", source],
      } : null,
      html: `window.__DAILY_BURN__ = ${JSON.stringify(rows)};\n`,
    }));
    return spawnSync(process.execPath, ["--import", "./mock-fetch.mjs", "scripts/fetch-ai-usage.mjs"], {
      cwd: root,
      encoding: "utf8",
      timeout: 10_000,
    });
  }

  it.each<InputPath>(["summary.json", "embedded daily record"])(
    "labels TypeSafe API and refreshes both artifacts via %s",
    (inputPath) => {
      const result = refresh(inputPath);
      expect(result.error).toBeUndefined();
      expect(result.status, result.stderr).toBe(0);
      const snapshot = readFileSync(join(root, "src/data/ai-usage-snapshot.ts"), "utf8");
      expect(snapshot).toContain(`via ${inputPath}.`);
      expect(snapshot).toContain('asOf: "2026-07-18"');
      expect(snapshot).toContain('firstDate: "2026-01-01"');
      expect(snapshot).toContain("totalTokensRaw: 601000000");
      expect(snapshot).toContain('exactTokens: "600.0M"');
      expect(snapshot).toContain('estimatedTokens: "1.0M"');
      expect(snapshot).toContain("sourceCount: 2");
      expect(snapshot).toContain('sourceLabels: ["Claude chat","TypeSafe API"]');
      expect(readFileSync(join(root, "index.html"), "utf8")).toContain(
        "Floor figures as of 2026-07-18: 601,000,000 tokens recovered across 2 sources",
      );
      expect(snapshot).not.toMatch(/dollars|cost|spend/i);
    },
  );

  it.each<InputPath>(["summary.json", "embedded daily record"])(
    "refuses an unknown source and leaves both artifacts untouched via %s",
    (inputPath) => {
      const result = refresh(inputPath, "unrecognized_api");
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Unlabeled sources: unrecognized_api. Add labels to SOURCE_LABELS.");
      expect(readFileSync(join(root, "index.html"), "utf8")).toBe(previousIndex);
      expect(readFileSync(join(root, "src/data/ai-usage-snapshot.ts"), "utf8")).toBe(previousSnapshot);
    },
  );

  function refreshSummary(overrides: Record<string, unknown>) {
    const rows = dailyRecord();
    writeFileSync(join(root, "input.json"), JSON.stringify({
      summary: {
        as_of: rows.at(-1)?.date,
        first_date: rows[0]?.date,
        total_tokens: 601_000_000,
        exact_tokens: 600_000_000,
        estimated_tokens: 1_000_000,
        sources: ["claude_chat", "typesafe_api"],
        ...overrides,
      },
      html: "",
    }));
    return spawnSync(process.execPath, ["--import", "./mock-fetch.mjs", "scripts/fetch-ai-usage.mjs"], {
      cwd: root,
      encoding: "utf8",
      timeout: 10_000,
    });
  }

  function expectUntouched(result: ReturnType<typeof spawnSync>, message: string) {
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(readFileSync(join(root, "index.html"), "utf8")).toBe(previousIndex);
    expect(readFileSync(join(root, "src/data/ai-usage-snapshot.ts"), "utf8")).toBe(previousSnapshot);
  }

  it("refuses a first date that would inject code into the snapshot", () => {
    expectUntouched(refreshSummary({ first_date: '2026-01-01", evil: "1' }), "Bad first date");
  });

  it("refuses non-integer counts", () => {
    expectUntouched(refreshSummary({ exact_tokens: "600000000" }), "Bad exact count");
  });

  it("refuses counts that do not sum to the total", () => {
    expectUntouched(refreshSummary({ estimated_tokens: 2_000_000 }), "do not sum to the total");
  });

  it("refuses a prototype key posing as a source", () => {
    expectUntouched(refreshSummary({ sources: ["__proto__"] }), "Unlabeled sources: __proto__");
  });

  it("refuses a non-integer token entry in the daily record", () => {
    const rows = dailyRecord();
    (rows[5].sources as Record<string, unknown>).typesafe_api = { tokens: "1e9", fidelity: "exact" };
    expectUntouched(refresh("embedded daily record", "typesafe_api", rows), "Bad 2026-01-11 typesafe_api count");
  });

  it("refuses a total below the committed snapshot", () => {
    const committed = "export const aiUsageSnapshot = {\n  totalTokensRaw: 900000000,\n};\n";
    writeFileSync(join(root, "src/data/ai-usage-snapshot.ts"), committed);
    const result = refreshSummary({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("below the committed snapshot (900000000)");
    expect(readFileSync(join(root, "src/data/ai-usage-snapshot.ts"), "utf8")).toBe(committed);
    expect(readFileSync(join(root, "index.html"), "utf8")).toBe(previousIndex);
  });

  it("still refuses a truncated daily record before writing either artifact", () => {
    const result = refresh("embedded daily record", "typesafe_api", dailyRecord().slice(0, 99));
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Daily record looks truncated; refusing to overwrite the snapshot.");
    expect(readFileSync(join(root, "index.html"), "utf8")).toBe(previousIndex);
    expect(readFileSync(join(root, "src/data/ai-usage-snapshot.ts"), "utf8")).toBe(previousSnapshot);
  });
});
