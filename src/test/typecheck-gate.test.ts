// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const script = resolve("scripts/typecheck.mjs");

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "resume-typecheck-gate-"));
  const projects = ["app", "api", "node"];
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify({
    files: [], references: projects.map((name) => ({ path: `./${name}/tsconfig.json` })),
  }));
  for (const name of projects) {
    mkdirSync(join(root, name));
    writeFileSync(join(root, name, "tsconfig.json"), JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, types: [], skipLibCheck: true },
      include: ["*.ts"],
    }));
    writeFileSync(join(root, name, "index.ts"), "export const value: number = 1;\n");
  }
  return root;
}

function run(root: string) {
  return spawnSync(process.execPath, [script], { cwd: root, encoding: "utf8", timeout: 20000 });
}

describe("the advertised typecheck gate checks source projects", () => {
  it("accepts a valid solution with an empty root files list", () => {
    const root = fixture();
    try { expect(run(root).status).toBe(0); } finally { rmSync(root, { recursive: true, force: true }); }
  }, 25000);

  it.each(["app", "api", "node"])("rejects a deliberate type error in the %s project", (name) => {
    const root = fixture();
    try {
      writeFileSync(join(root, name, "index.ts"), 'export const value: number = "wrong";\n');
      const result = run(root);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("TS2322");
      for (const project of ["app", "api", "node"]) expect(result.stdout).toContain(`Typechecking ./${project}/tsconfig.json`);
    } finally { rmSync(root, { recursive: true, force: true }); }
  }, 25000);
});
