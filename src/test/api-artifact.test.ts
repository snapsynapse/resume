// @vitest-environment node

import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { expect, it } from "vitest";

it("loads emitted API handlers and rejects GET without provider calls", () => {
  const root = process.cwd();
  const output = mkdtempSync(path.join(tmpdir(), "resume-api-artifact-"));
  try {
    const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
    expect(config.error).toBeUndefined();
    const parsed = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, root);
    expect(parsed.errors).toEqual([]);

    // Vercel reads the root config, not the referenced no-emit API project.
    // Emit the real transitive handler dependencies, then use Node's resolver
    // rather than Vitest/Vite's source resolver to load the JavaScript output.
    const program = ts.createProgram(
      ["api/chat.ts", "api/analyze-fit.ts"].map((file) => path.join(root, file)),
      {
        ...parsed.options,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        noEmit: false,
        noEmitOnError: false,
        rootDir: root,
        outDir: output,
      },
    );
    const emitted = program.emit();
    expect(emitted.emitSkipped).toBe(false);
    writeFileSync(path.join(output, "package.json"), '{"type":"module"}\n');
    symlinkSync(path.join(root, "node_modules"), path.join(output, "node_modules"), "junction");
    writeFileSync(path.join(output, "probe.mjs"), `
      import assert from "node:assert/strict";
      for (const route of ["chat", "analyze-fit"]) {
        const { default: handler } = await import("./api/" + route + ".js");
        const response = await handler(new Request("https://resume.sam-rogers.com/api/" + route));
        assert.equal(response.status, 405, route + " GET rejection");
      }
    `);
    const probe = spawnSync(process.execPath, [path.join(output, "probe.mjs")], {
      encoding: "utf8",
      timeout: 10_000,
      // Do not inherit provider credentials or production Redis configuration.
      env: { PATH: process.env.PATH, NODE_ENV: "production", VERCEL_ENV: "production" },
    });
    expect(probe.error).toBeUndefined();
    expect(probe.status, probe.stderr).toBe(0);
    expect(ts.getPreEmitDiagnostics(program).concat(emitted.diagnostics)).toEqual([]);
    expect(readFileSync(path.join(output, "src/data/sam-profile.js"), "utf8"))
      .toContain('"./ai-usage-snapshot.js"');
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}, 30_000);
