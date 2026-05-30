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

const retiredSolicitationPatterns = [
  /fractional/i,
  /Chief AI Officer/i,
  /available for one/i,
  /regulated mid-market/i,
  /retainer/i,
  /snapsynapse\/25min/i,
];

describe("public resume surfaces", () => {
  it.each(publicSurfaceFiles)("does not expose retired AI-officer solicitation in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");
    for (const pattern of retiredSolicitationPatterns) {
      expect(content).not.toMatch(pattern);
    }
  });
});
