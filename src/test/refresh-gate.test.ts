// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("enforces the dependency audit before the scheduled refresh can publish", () => {
  const workflow = readFileSync(".github/workflows/refresh-ai-usage.yml", "utf8");
  const audit = workflow.indexOf("npm audit --audit-level=high");
  const publish = workflow.indexOf("git push");
  expect(audit).toBeGreaterThan(0);
  expect(audit).toBeLessThan(publish);
  // A pipeline or shell exemption must not turn a finding into a successful gate.
  const auditLine = workflow.split("\n").find((line) => line.includes("npm audit --audit-level=high"));
  expect(auditLine?.trim()).toBe("npm audit --audit-level=high");
  expect(workflow).not.toContain("continue-on-error: true");
});

it("keeps the write token away from npm code in the scheduled refresh", () => {
  const workflow = readFileSync(".github/workflows/refresh-ai-usage.yml", "utf8");
  const [, jobs] = workflow.split(/\njobs:\n/);
  const [refreshJob, publishJob] = jobs.split(/\n {2}publish:\n/);
  expect(publishJob).toBeDefined();
  expect(workflow).toMatch(/^permissions: \{\}$/m);
  expect(refreshJob).toMatch(/permissions:\n\s+contents: read/);
  expect(refreshJob).toContain("persist-credentials: false");
  expect(refreshJob).not.toContain("contents: write");
  expect(refreshJob).not.toContain("git push");
  expect(publishJob).toMatch(/permissions:\n\s+contents: write/);
  expect(publishJob).not.toMatch(/\bnpm\b|\bnpx\b|setup-node/);
});

it("pins every action in every workflow to a full commit SHA", () => {
  for (const name of readdirSync(".github/workflows")) {
    const workflow = readFileSync(`.github/workflows/${name}`, "utf8");
    for (const line of workflow.split("\n").filter((l) => /^\s*-?\s*uses:/.test(l))) {
      expect(line, `${name}: ${line.trim()}`).toMatch(/uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d/);
    }
  }
});
