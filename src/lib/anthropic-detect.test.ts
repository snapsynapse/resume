import { afterEach, describe, expect, it } from "vitest";
import { detectRoleContext } from "./anthropic-detect";
import { composeRoleContext, detectRoleSelection, parseRoleSelection } from "./role-context";

const anthropicRole = "Anthropic - Head of Content & Curriculum, Education";
const openAiRole = "OpenAI - Customer Education, Content and Systems Operations Lead";

function setSearch(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

function setReferrer(referrer: string) {
  Object.defineProperty(document, "referrer", {
    configurable: true,
    value: referrer,
  });
}

describe("detectRoleContext", () => {
  afterEach(() => {
    setSearch("");
    setReferrer("");
  });

  it("keeps role=anthropic as a compatibility alias", () => {
    setSearch("?role=anthropic");

    expect(detectRoleContext()).toBe(anthropicRole);
  });

  it("uses target and company together for OpenAI content operations", () => {
    setSearch("?target=content-ops&company=openai");

    expect(detectRoleSelection()).toEqual({
      target: "content-ops",
      company: "openai",
    });
    expect(detectRoleContext()).toBe(openAiRole);
  });

  it("allows target-only positioning", () => {
    expect(composeRoleContext(parseRoleSelection("?target=content-ops"))?.label).toBe(
      "Content Operations",
    );
  });

  it("allows company-only light context", () => {
    expect(composeRoleContext(parseRoleSelection("?company=openai"))?.label).toBe("OpenAI");
  });

  it("uses Anthropic referrers as AI education context", () => {
    setReferrer("https://job-boards.greenhouse.io/anthropic/jobs/123");

    expect(detectRoleContext()).toBe(anthropicRole);
  });

  it("uses OpenAI referrers as content operations context", () => {
    setReferrer("https://jobs.ashbyhq.com/openai/2250b09d-f6fb-4ebc-9d27-dfd34d2ccbec");

    expect(detectRoleContext()).toBe(openAiRole);
  });
});
