import { afterEach, describe, expect, it } from "vitest";
import { detectRoleContext } from "./anthropic-detect";
import { composeRoleContext, detectRoleSelection, parseRoleSelection } from "./role-context";

function setSearch(search: string) {
  window.history.pushState({}, "", `/${search}`);
}

describe("detectRoleContext", () => {
  afterEach(() => {
    setSearch("");
  });

  it("keeps role=anthropic as a compatibility alias that lands on the durable target only", () => {
    setSearch("?role=anthropic");

    expect(detectRoleContext()).toBe("AI Education Systems");
  });

  it("reads target and company from the URL, and resolves target only without a company map", () => {
    setSearch("?target=content-ops&for=examplecorp");

    expect(detectRoleSelection()).toEqual({
      target: "content-ops",
      company: "examplecorp",
    });
    // The client holds no employer presets, so the label is the durable target's.
    expect(detectRoleContext()).toBe("Content Operations");
  });

  it("allows target-only positioning", () => {
    expect(composeRoleContext(parseRoleSelection("?target=content-ops"))?.label).toBe(
      "Content Operations",
    );
  });

  it("resolves to nothing for a company-only link without a company map", () => {
    setSearch("?for=examplecorp");

    expect(detectRoleContext()).toBeNull();
  });

  it("ignores the referrer entirely", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://jobs.example.com/examplecorp/123",
    });

    expect(detectRoleSelection()).toEqual({});
    expect(detectRoleContext()).toBeNull();

    Object.defineProperty(document, "referrer", { configurable: true, value: "" });
  });

  it("returns null on the neutral default route", () => {
    expect(detectRoleContext()).toBeNull();
  });
});
