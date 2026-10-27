import { describe, expect, it } from "vitest";
import { demoResponses, samProfile } from "./sam-profile";
import { aiUsageSnapshot } from "./ai-usage-snapshot";

describe("samProfile role positioning", () => {
  it("keeps the default role positioning employer-neutral", () => {
    expect(samProfile.title).toBe("AI-Enabled Content Systems Operator");
    expect(samProfile.rotatingTitles[0]).toBe("AI-Enabled Content Systems Operator");
    expect(samProfile.rotatingTitles).toEqual([
      "AI-Enabled Content Systems Operator",
      "Director, AI Education & Enablement",
      "Head of Content & Curriculum Operations",
      "Senior Manager, Customer Education",
      "Certification & Assessment Program Manager",
    ]);
    expect(samProfile.status).not.toMatch(/Anthropic|OpenAI/i);
  });

  it("does not revive old Anthropic target roles", () => {
    const profileText = JSON.stringify(samProfile);

    expect(profileText).not.toMatch(/Lead, Talent Development & Enablement/i);
    expect(profileText).not.toMatch(/Certification Development Lead/i);
    expect(profileText).not.toMatch(/L&D Systems Architect/i);
    expect(profileText).not.toMatch(/Applied AI Enablement Lead/i);
    expect(profileText).not.toMatch(/Forward-Deployed Enablement Lead/i);
  });

  it("keeps the AI education demo response employer-neutral", () => {
    expect(demoResponses.aiEducation).not.toMatch(/Anthropic|Claude|constitutional/i);
    expect(demoResponses).not.toHaveProperty("anthropic");
  });

  it("keeps employer-specific context out of the default system prompt", () => {
    expect(samProfile.systemPrompt).toMatch(/turn AI capability into human capability/i);
    expect(samProfile.systemPrompt).not.toMatch(/Head of Content & Curriculum, Education/i);
  });

  it("carries the AI usage dashboard as dated floor values, not a live figure", () => {
    const usage = samProfile.aiUsageDashboard;

    expect(usage.url).toBe("https://sam-rogers.com/ai-usage/");
    expect(usage.asOf).toBe(aiUsageSnapshot.asOf);
    expect(usage.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(usage.totalTokens).toBe(aiUsageSnapshot.totalTokens);
    expect(usage.totalTokensShort).toBe(aiUsageSnapshot.totalTokensShort);
    expect(usage.sourceCount).toBe(aiUsageSnapshot.sourceCount);
    expect(usage.methodologyPostUrl).toBe("https://sam-rogers.com/counting-what-i-delegated-to-ai");
    // Governance framing is the point of the artifact; scale is only the hook.
    expect(usage.methodology).toMatch(/recovered record, not a complete history/i);
    expect(usage.methodology).toMatch(/labeled unknown rather than counted as zero/i);
    expect(usage.governanceFraming).toMatch(/cost-governance|provenance|observability/i);
    expect(usage.interviewProbe).toMatch(/recovery pipeline/i);
  });

  it("keeps visible evidence and capability boundaries aligned to target roles", () => {
    expect(samProfile.heroEvidence).toHaveLength(4);
    expect(samProfile.skills.strong).toContain(
      "Open standards authorship and public protocol design",
    );
    expect(samProfile.skills.strong).toContain(
      "Cross-functional change management and adoption",
    );
    expect(samProfile.skills.moderate).toContain("Formal people management at scale");
    expect(samProfile.skills.gaps).toContain("ML research or applied-science ownership");
    expect(samProfile.skills.gaps).not.toContain("Institutional fundraising track record");
  });
});
