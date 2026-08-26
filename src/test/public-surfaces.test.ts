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

const activePositioningFiles = [
  "index.html",
  "public/agents.json",
  "public/llms-full.txt",
  "public/llms.txt",
  "public/resume.txt",
  "src/data/sam-profile.ts",
  "src/components/AIChat.tsx",
  "src/components/DecisionBriefSidebar.tsx",
  "api/analyze-fit.ts",
  "scripts/eval-prompts.mjs",
  "scripts/smoke-api.mjs",
];

const defaultPublicPositioningFiles = [
  "index.html",
  "public/agents.json",
  "public/llms-full.txt",
  "public/llms.txt",
  "public/resume.txt",
];

const analyticsSourceFiles = [
  "src/components/AIChat.tsx",
  "src/components/FitAssessment.tsx",
];

const repoVettingDocs = [
  "SECURITY.md",
  "EVIDENCE.md",
  "ROADMAP.md",
  "public/api-manifest.json",
  "public/.well-known/assistant-guide.txt",
];

const providerProductLanguageFiles = [
  "README.md",
  "SECURITY.md",
  "public/api-manifest.json",
  "public/.well-known/assistant-guide.txt",
  "src/components/FitAssessment.tsx",
  "scripts/generate-static-html.mjs",
];

const downstreamArtifactFiles = [
  "public/agents.json",
  "public/llms.txt",
  "public/llms-full.txt",
  "public/.well-known/assistant-guide.txt",
  "public/api-manifest.json",
];

// Sam's published AI token-usage dashboard. Floor values with an explicit as-of date; the site
// must never fetch it at runtime, so the pointer and the date are asserted as literal content.
const AI_USAGE_DASHBOARD_URL = "https://sam-rogers.com/ai-usage/";
const AI_USAGE_AS_OF = "2026-07-29";

const aiUsageDashboardSurfaces = [
  "index.html",
  "public/agents.json",
  "public/llms.txt",
  "public/llms-full.txt",
  "public/.well-known/assistant-guide.txt",
  "src/data/sam-profile.ts",
  "EVIDENCE.md",
];

const outdatedSolicitationPatterns = [
  /fractional/i,
  /Chief AI Officer/i,
  /available for one/i,
  /regulated mid-market/i,
  /retainer/i,
  /snapsynapse\/25min/i,
];

const outdatedAnthropicRolePatterns = [
  /Lead, Talent Development & Enablement/i,
  /Certification Development Lead/i,
  /L&D Systems Architect/i,
  /Applied AI Enablement Lead/i,
  /Forward-Deployed Enablement Lead/i,
  /anthropic-leadtd/i,
  /anthropic-certdev/i,
  /anthropic-applied/i,
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

  it.each(activePositioningFiles)("keeps current role-family positioning visible in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");

    expect(content).toMatch(/content operations|AI education|Content Operations|AI-Enabled Content/i);
  });

  it.each(defaultPublicPositioningFiles)("keeps default public artifacts employer-neutral in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");

    expect(content).not.toMatch(/Anthropic.*Head of Content|OpenAI.*Customer Education|Instructure.*Director, AI Center of Excellence/i);
  });

  it.each(downstreamArtifactFiles)("documents the two-page-resume funnel in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");

    expect(content).toMatch(/two-page(?: paper)? resume.*application input/is);
    expect(content).toMatch(/downstream/i);
  });

  it("keeps agent guidance consistent with the UI-only API contract", () => {
    const guide = readFileSync(join(root, "public/.well-known/assistant-guide.txt"), "utf8");
    const manifest = JSON.parse(readFileSync(join(root, "public/api-manifest.json"), "utf8"));

    expect(guide).toMatch(/website UI endpoints, not a general agent-integration API/i);
    expect(manifest.openapi.provided).toBe(false);
    expect(manifest.openapi.reason).toMatch(/website UI rather than a public integration API/i);
  });

  it("links repository reviewer artifacts from the agent registry", () => {
    const agents = JSON.parse(readFileSync(join(root, "public/agents.json"), "utf8"));
    const resourceNames = new Set(agents.resources.map((resource: { name?: string }) => resource.name));

    expect([...resourceNames]).toEqual(
      expect.arrayContaining([
        "Inspectable source repository",
        "Evidence ledger",
        "Security posture",
        "Artifact intent",
        "Artifact roadmap",
      ]),
    );
  });

  it.each(activePositioningFiles)("does not revive old Anthropic role targets in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");
    for (const pattern of outdatedAnthropicRolePatterns) {
      expect(content).not.toMatch(pattern);
    }
  });

  it("does not send exact text-derived length telemetry keys", () => {
    for (const file of analyticsSourceFiles) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).not.toMatch(/\b(?:questionLength|responseLength|descriptionLength)\b/);
    }
  });

  it("documents the three-audience open-repo strategy", () => {
    const intent = readFileSync(join(root, "INTENT.md"), "utf8");
    const readme = readFileSync(join(root, "README.md"), "utf8");

    expect(intent).toMatch(/two-page paper resume is the application input/is);
    expect(intent).toMatch(/Recruiters after initial resume review/is);
    expect(intent).toMatch(/Hiring managers.*middle of the funnel/is);
    expect(intent).toMatch(/Engineering, security, IT, compliance/is);
    expect(intent).toMatch(/open repository|public repository/i);
    expect(readme).toMatch(/\[INTENT\.md\]\(INTENT\.md\)/);
  });

  it("keeps repo-vetting artifacts discoverable from README or INTENT", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const intent = readFileSync(join(root, "INTENT.md"), "utf8");
    const combined = `${readme}\n${intent}`;

    for (const file of repoVettingDocs) {
      const basename = file.split("/").at(-1) ?? file;
      expect(combined).toContain(basename);
    }
  });

  it("keeps roadmap status current for delivered strategy work", () => {
    const roadmap = readFileSync(join(root, "ROADMAP.md"), "utf8");

    expect(roadmap).toMatch(/## Recently Delivered/);
    expect(roadmap).toMatch(/Target\/company routing/);
    expect(roadmap).toMatch(/Employer-neutral default positioning/);
    expect(roadmap).toMatch(/Provider-portable public language/);
    expect(roadmap).toMatch(/Open-repo strategy doc/);
    expect(roadmap).toMatch(/## Low-Hanging Fruit/);
    expect(roadmap).not.toMatch(/CI eval gate.*done/i);
    expect(roadmap).not.toMatch(/Live API smoke test.*done/i);
  });

  it.each(aiUsageDashboardSurfaces)("points at the published AI usage dashboard in %s", (file) => {
    const content = readFileSync(join(root, file), "utf8");

    expect(content).toContain(AI_USAGE_DASHBOARD_URL);
    expect(content).toContain(AI_USAGE_AS_OF);
  });

  it("keeps the AI usage dashboard decoupled from runtime and framed as a floor value", () => {
    // Anti-goal guard: the two sites must stay decoupled. No fetch, no iframe, no live counter.
    for (const file of ["src/components/AIUsageCard.tsx", "src/data/sam-profile.ts"]) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).not.toMatch(/fetch\(|<iframe|axios|XMLHttpRequest/i);
    }

    const profile = readFileSync(join(root, "src/data/sam-profile.ts"), "utf8");
    expect(profile).toMatch(/FLOOR values/i);
    expect(profile).toContain(AI_USAGE_AS_OF);

    // Governance framing lives in the reviewer/AI corpus, not only in the scale hook.
    const evidence = readFileSync(join(root, "EVIDENCE.md"), "utf8");
    expect(evidence).toContain(AI_USAGE_DASHBOARD_URL);
    expect(evidence).toMatch(/recovered record/i);
    expect(evidence).toMatch(/labeled unknown/i);
    expect(evidence).toMatch(/provenance/i);

    // Agent-facing surfaces must tell an agent not to treat the number as live.
    for (const file of ["public/llms-full.txt", "public/.well-known/assistant-guide.txt", "public/agents.json"]) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).toMatch(/(?:not|never|must not).{0,40}live/i);
    }
  });

  it("keeps product-facing provider language model-portable while disclosing current provider", () => {
    for (const file of providerProductLanguageFiles) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).toMatch(/cloud LLM provider|model provider|configured provider/i);
    }

    const readme = readFileSync(join(root, "README.md"), "utf8");
    expect(readme).not.toMatch(/- Anthropic Messages API:/);
    expect(readme).not.toMatch(/both using Anthropic/);
    expect(readme).toMatch(/current (?:implementation|production provider) is Anthropic/i);
  });

  it("uses the current Signals & Subtractions identity and cadence", () => {
    const files = ["EVIDENCE.md", "src/data/sam-profile.ts"];

    for (const file of files) {
      const content = readFileSync(join(root, file), "utf8");
      expect(content).not.toMatch(/signalsandsubtractions\.substack\.com/i);
      expect(content).not.toMatch(/weekly newsletter \(Mondays\)|weekly Monday cadence/i);
      expect(content).toContain("https://sigsub.show/");
      expect(content).toContain("https://sigsub.substack.com/");
      expect(content).toMatch(/livestream Wednesday.*episode Friday.*newsletter Sunday/is);
    }
  });

  it("distinguishes commercial packaging from realized PAICE traction", () => {
    const profile = readFileSync(join(root, "src/data/sam-profile.ts"), "utf8");
    const evidence = readFileSync(join(root, "EVIDENCE.md"), "utf8");

    expect(profile).toMatch(/commercial packaging/i);
    expect(profile).toMatch(/significant paying customers.*not established/i);
    expect(evidence).toMatch(/significant paying customers.*not established/i);
    expect(profile).not.toMatch(/revenue sits on top/i);
  });
});
