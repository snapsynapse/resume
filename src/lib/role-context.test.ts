import { describe, expect, it } from "vitest";
import { composeRoleContext, parseRoleSelection } from "./role-context";

describe("role-context routing", () => {
  it("keeps the default route neutral", () => {
    expect(parseRoleSelection("")).toEqual({});
    expect(composeRoleContext({})).toBeNull();
  });

  it("lets target own the durable positioning wedge", () => {
    const context = composeRoleContext(parseRoleSelection("?target=content-ops"));

    expect(context?.label).toBe("Content Operations");
    expect(context?.companyLabel).toBeUndefined();
    expect(context?.promptContext).toMatch(/content-portfolio health/i);
    expect(context?.promptContext).not.toMatch(/OpenAI's Customer Education/i);
  });

  it("lets company alone provide only light employer context", () => {
    const context = composeRoleContext(parseRoleSelection("?company=openai"));

    expect(context?.label).toBe("OpenAI");
    expect(context?.targetLabel).toBeUndefined();
    expect(context?.promptContext).toMatch(/Do not assume a specific role/i);
    expect(context?.promptContext).not.toMatch(/content-and-systems operations spine/i);
  });

  it("composes target and company into the application context", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=content-ops&company=openai"),
    );

    expect(context?.label).toBe(
      "OpenAI - Customer Education, Content and Systems Operations Lead",
    );
    expect(context?.targetLabel).toBe("Content Operations");
    expect(context?.companyLabel).toBe("OpenAI");
    expect(context?.promptContext).toMatch(/content-portfolio health/i);
    expect(context?.promptContext).toMatch(/content-and-systems operations spine/i);
  });

  it("maps referrers to company and default target without URL compounding", () => {
    expect(
      parseRoleSelection("", "https://jobs.ashbyhq.com/openai/example"),
    ).toEqual({
      target: "content-ops",
      company: "openai",
    });
    expect(
      parseRoleSelection("", "https://job-boards.greenhouse.io/anthropic/jobs/123"),
    ).toEqual({
      target: "ai-education",
      company: "anthropic",
    });
  });

  it("keeps old role=anthropic links working without making role the new contract", () => {
    expect(parseRoleSelection("?role=anthropic")).toEqual({
      target: "ai-education",
      company: "anthropic",
    });
  });
});
