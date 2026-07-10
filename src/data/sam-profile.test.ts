import { describe, expect, it } from "vitest";
import { samProfile } from "./sam-profile";

describe("samProfile role positioning", () => {
  it("keeps the default role positioning employer-neutral", () => {
    expect(samProfile.title).toBe("AI-Enabled Content Systems Operator");
    expect(samProfile.rotatingTitles[0]).toBe("AI-Enabled Content Systems Operator");
    expect(samProfile.rotatingTitles).toEqual([
      "AI-Enabled Content Systems Operator",
      "Content & Systems Operations Lead",
      "AI Education Systems Lead",
      "Customer Education Systems Lead",
      "Certification & Assessment Systems Lead",
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

  it("keeps employer-specific context out of the default system prompt", () => {
    expect(samProfile.systemPrompt).toMatch(/turn AI capability into human capability/i);
    expect(samProfile.systemPrompt).not.toMatch(/Head of Content & Curriculum, Education/i);
    expect(samProfile.systemPrompt).not.toMatch(/Customer Education, Content and Systems Operations Lead/i);
  });

  it("keeps visible evidence and capability boundaries aligned to target roles", () => {
    expect(samProfile.heroEvidence).toHaveLength(3);
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
