import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsProperties, stripUrlParams } from "./analytics";

describe("analytics URL sanitizer", () => {
  it("strips query string and hash from a URL, keeping origin and path", () => {
    expect(stripUrlParams("https://resume.example.com/?for=examplecorp&target=content-ops#about")).toBe(
      "https://resume.example.com/",
    );
    expect(stripUrlParams("https://resume.example.com/page#section")).toBe("https://resume.example.com/page");
    expect(stripUrlParams("https://resume.example.com/page")).toBe("https://resume.example.com/page");
  });

  it("leaves non-string and sentinel values untouched", () => {
    expect(stripUrlParams(undefined)).toBeUndefined();
    expect(stripUrlParams(null)).toBeNull();
    expect(stripUrlParams("$direct")).toBe("$direct");
    expect(stripUrlParams(42)).toBe(42);
  });

  it("removes ?for= from every URL-shaped PostHog property, including person properties", () => {
    const tailored = "https://resume.example.com/?for=examplecorp&target=content-ops";
    const result = sanitizeAnalyticsProperties({
      $current_url: tailored,
      $referrer: "https://jobs.example.com/listing?ref=examplecorp",
      $pathname: "/",
      source: "hero",
      $set: { $initial_current_url: tailored, $initial_referrer: "$direct" },
      $set_once: { $initial_current_url: tailored, $initial_referrer: "https://jobs.example.com/?x=1" },
    });

    expect(result.$current_url).toBe("https://resume.example.com/");
    expect(result.$referrer).toBe("https://jobs.example.com/listing");
    expect(result.$pathname).toBe("/");
    expect(result.source).toBe("hero");
    expect(result.$set).toEqual({
      $initial_current_url: "https://resume.example.com/",
      $initial_referrer: "$direct",
    });
    expect(result.$set_once).toEqual({
      $initial_current_url: "https://resume.example.com/",
      $initial_referrer: "https://jobs.example.com/",
    });
    expect(JSON.stringify(result)).not.toContain("examplecorp");
    expect(JSON.stringify(result)).not.toContain("for=");
  });

  it("does not mutate the input object", () => {
    const input = { $current_url: "https://resume.example.com/?for=examplecorp" };
    sanitizeAnalyticsProperties(input);
    expect(input.$current_url).toBe("https://resume.example.com/?for=examplecorp");
  });
});
