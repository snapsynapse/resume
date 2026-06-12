import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const publicSurfaceFiles = [
  "index.html",
  "public/agents.json",
  "public/changelog.txt",
  "public/llms-full.txt",
  "public/llms.txt",
  "public/resume.txt",
  "src/data/sam-profile.ts",
];

const analyticsSourceFiles = [
  "src/components/AIChat.tsx",
  "src/components/FitAssessment.tsx",
];

const outdatedSolicitationPatterns = [
  /fractional/i,
  /Chief AI Officer/i,
  /available for one/i,
  /regulated mid-market/i,
  /retainer/i,
  /snapsynapse\/25min/i,
];

describe("public resume surfaces", () => {
  it.each(publicSurfaceFiles)("does not expose outdated AI-officer solicitation in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");
    for (const pattern of outdatedSolicitationPatterns) {
      expect(content).not.toMatch(pattern);
    }
  });

  it("keeps agent-facing fit assessment guidance aligned with sensitive-context boundaries", () => {
    const agents = JSON.parse(readFileSync(join(root, "public/agents.json"), "utf8"));
    const fitPath = agents.interaction_paths.find(
      (path: { label?: string }) => path.label === "Analyze role fit",
    );

    expect(fitPath?.description).toMatch(/review/i);
    expect(fitPath?.description).toMatch(/browser-only/i);
    expect(fitPath?.description).toMatch(/sensitive|confidential|proprietary|regulated|unreleased/i);
    expect(fitPath?.description).toMatch(/redact|placeholder|email/i);
  });

  it("does not send exact text-derived length telemetry keys", () => {
    for (const file of analyticsSourceFiles) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).not.toMatch(/\b(?:questionLength|responseLength|descriptionLength)\b/);
    }
  });
});
