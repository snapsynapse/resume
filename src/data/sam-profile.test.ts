import { describe, expect, it } from "vitest";
import { samProfile } from "./sam-profile";

describe("samProfile role positioning", () => {
  it("keeps the current role target explicit", () => {
    expect(samProfile.title).toBe("Head of Content & Curriculum");
    expect(samProfile.rotatingTitles[0]).toBe("Head of Content & Curriculum");
    expect(samProfile.rotatingTitles).toEqual([
      "Head of Content & Curriculum",
      "AI Education Systems Lead",
      "Curriculum Production Systems Lead",
      "Certification & Learning Measurement Lead",
      "Applied AI Education Lead",
    ]);
  });

  it("does not revive old Anthropic target roles", () => {
    const profileText = JSON.stringify(samProfile);

    expect(profileText).not.toMatch(/Lead, Talent Development & Enablement/i);
    expect(profileText).not.toMatch(/Certification Development Lead/i);
    expect(profileText).not.toMatch(/L&D Systems Architect/i);
    expect(profileText).not.toMatch(/Applied AI Enablement Lead/i);
    expect(profileText).not.toMatch(/Forward-Deployed Enablement Lead/i);
  });

  it("keeps the Anthropic context on the current single active role", () => {
    expect(samProfile.systemPrompt).toMatch(/Head of Content & Curriculum, Education/i);
    expect(samProfile.systemPrompt).toMatch(/AI-assisted content production systems/i);
    expect(samProfile.systemPrompt).toMatch(/measurement of whether content actually teaches/i);
  });
});
