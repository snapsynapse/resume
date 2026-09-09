// @vitest-environment node

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseCompanyPresetMap } from "@/lib/role-context";

// The private presets JSON is validated twice on its way to production: by the standalone CLI
// before `vercel env add`, and by the server parser at load time. These tests pin the CLI's
// exit behaviour and keep the two validators in agreement, using only the fake fixture.

const root = process.cwd();
const cli = join(root, "scripts/role-context-presets.mjs");
const fixture = join(root, "src/test/fixtures/role-context-presets.json");

function runCli(...args: string[]) {
  return spawnSync("node", [cli, ...args], { encoding: "utf8" });
}

let scratch: string | null = null;
afterEach(() => {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
  scratch = null;
});

describe("role-context presets CLI", () => {
  it("validates the fixture and reports counts only", () => {
    const result = runCli("validate", fixture);
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toMatch(/2 companies, 2 applications/);
    expect(result.stdout + result.stderr).not.toMatch(/Northwind|ExampleCorp/);
  });

  it("emits minified JSON that the server parser accepts unchanged", () => {
    const result = runCli("env", fixture);
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/\n[^\n]/);
    const map = parseCompanyPresetMap(JSON.parse(result.stdout));
    expect(Object.keys(map).sort()).toEqual(["examplecorp", "northwind"]);
    expect(JSON.parse(result.stdout)).toEqual(JSON.parse(readFileSync(fixture, "utf8")));
  });

  it("rejects a malformed file without echoing any value", () => {
    scratch = mkdtempSync(join(tmpdir(), "presets-"));
    const broken = JSON.parse(readFileSync(fixture, "utf8"));
    delete broken.companies.northwind.applications["ai-education"].sourceRole;
    broken.companies["Bad Key"] = broken.companies.examplecorp;
    const file = join(scratch, "broken.json");
    writeFileSync(file, JSON.stringify(broken));

    const result = runCli("validate", file);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/sourceRole|key/);
    expect(result.stdout + result.stderr).not.toMatch(/Northwind|ExampleCorp|Enablement/);
    expect(() => parseCompanyPresetMap(broken)).toThrow();
  });

  it("agrees with the server parser on what is invalid", () => {
    scratch = mkdtempSync(join(tmpdir(), "presets-"));
    const cases: Record<string, unknown>[] = [
      { version: 2, companies: {} },
      { version: 1, companies: { ok: { label: "Ok", applications: { "not-a-target": { sourceRole: "x", promptDelta: "y", suggestedQuestions: [] } } } } },
      { version: 1, companies: { ok: { label: "Ok", applications: { "content-ops": { sourceRole: "x", promptDelta: "y", suggestedQuestions: "no" } } } } },
    ];
    cases.forEach((candidate, index) => {
      const file = join(scratch as string, `case-${index}.json`);
      writeFileSync(file, JSON.stringify(candidate));
      expect(runCli("validate", file).status, `case ${index} via CLI`).toBe(1);
      expect(() => parseCompanyPresetMap(candidate), `case ${index} via parser`).toThrow();
    });
  });
});
