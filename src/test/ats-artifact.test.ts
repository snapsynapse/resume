import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateAtsArtifact } from "../../scripts/eval-ats-artifact.mjs";

describe("ATS text artifact outcome eval", () => {
  it("passes the published plain-text resume", () => {
    const artifact = readFileSync(join(process.cwd(), "public/resume.txt"), "utf8");
    const evaluation = evaluateAtsArtifact(artifact);

    expect(evaluation.status, JSON.stringify(evaluation.checks, null, 2)).toBe("pass");
  });

  it("fails a visually plausible artifact with broken reading order", () => {
    const artifact = readFileSync(join(process.cwd(), "public/resume.txt"), "utf8");
    const broken = artifact
      .replace("## Target lanes", "## TEMP")
      .replace("## Strengths", "## Target lanes\n\n## Strengths");
    const evaluation = evaluateAtsArtifact(broken);

    expect(evaluation.status).toBe("fail");
    expect(evaluation.checks.find((check) => check.name === "section_contract")?.status).toBe("fail");
  });

  it("fails placeholder contamination and thin experience evidence", () => {
    const artifact = readFileSync(join(process.cwd(), "public/resume.txt"), "utf8");
    const thin = artifact.replace(
      /## Experience[\s\S]*?## Strengths/,
      "## Experience\n\n### TODO\n\n- PLACEHOLDER\n\n## Strengths",
    );
    const evaluation = evaluateAtsArtifact(thin);

    expect(evaluation.status).toBe("fail");
    expect(evaluation.checks.find((check) => check.name === "experience_parseability")?.status).toBe("fail");
    expect(evaluation.checks.find((check) => check.name === "artifact_completeness")?.status).toBe("fail");
  });
});
