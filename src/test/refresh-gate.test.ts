// @vitest-environment node
import { readFileSync } from "node:fs";
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
