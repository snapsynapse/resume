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

  it("routes the durable AI transformation target into the Instructure application", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=ai-transformation&company=instructure"),
    );

    expect(context?.label).toBe(
      "Instructure - Director, AI Center of Excellence",
    );
    expect(context?.targetLabel).toBe("AI Transformation");
    expect(context?.sourceRole).toBe("Director, AI Center of Excellence");
    expect(context?.locationContext).toBe("Remote from Utah");
    expect(context?.promptContext).toMatch(/founding AI Center of Excellence/i);
    expect(context?.promptContext).toMatch(/formal line-management scale is two/i);
    expect(context?.promptContext).toMatch(/no prior enterprise AI CoE ownership/i);
    expect(context?.promptContext).toMatch(/no enterprise DLP ownership/i);
  });

  it("keeps the durable AI transformation target employer and location neutral", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=ai-transformation"),
    );

    expect(context?.label).toBe("AI Transformation");
    expect(context?.companyLabel).toBeUndefined();
    expect(context?.locationContext).toBeUndefined();
    expect(context?.promptContext).not.toMatch(/Instructure|Utah/i);
  });

  it("does not infer the Director context from Instructure alone", () => {
    const direct = composeRoleContext(parseRoleSelection("?company=instructure"));
    const referred = composeRoleContext(
      parseRoleSelection("", "https://jobs.ashbyhq.com/instructure/example"),
    );

    expect(direct?.label).toBe("Instructure");
    expect(direct?.targetLabel).toBeUndefined();
    expect(direct?.sourceRole).toBeUndefined();
    expect(direct?.locationContext).toBeUndefined();
    expect(direct?.promptContext).toMatch(/Do not assume a specific role/i);
    expect(direct?.promptContext).not.toMatch(/founding AI Center of Excellence/i);
    expect(referred?.selection).toEqual({ company: "instructure" });
  });
});
