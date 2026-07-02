import { afterEach, describe, expect, it } from "vitest";
import { detectRoleContext } from "./anthropic-detect";

const currentRole = "Anthropic — Head of Content & Curriculum, Education";

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

  it("uses role=anthropic for the single active Anthropic role", () => {
    setSearch("?role=anthropic");

    expect(detectRoleContext()).toBe(currentRole);
  });

  it("does not keep old Anthropic role-specific aliases active", () => {
    setSearch("?role=anthropic-content");
    expect(detectRoleContext()).toBeNull();

    setSearch("?role=anthropic-curriculum");
    expect(detectRoleContext()).toBeNull();

    setSearch("?role=anthropic-certdev");
    expect(detectRoleContext()).toBeNull();
  });

  it("uses Anthropic referrers as the current active role context", () => {
    setReferrer("https://job-boards.greenhouse.io/anthropic/jobs/123");

    expect(detectRoleContext()).toBe(currentRole);
  });
});
