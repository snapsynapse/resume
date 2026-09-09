import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRoleContext, neutralHref } from "./role-context-client";

const exampleContext = {
  selection: { target: "content-ops" },
  label: "ExampleCorp - Content Operations",
  targetLabel: "Content Operations",
  companyLabel: "ExampleCorp",
  suggestedQuestions: ["Is Sam a fit?"],
};

describe("fetchRoleContext", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/");
  });

  it("skips the network entirely for an empty selection", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchRoleContext({})).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests /api/role-context with `company` and `target` and returns the JSON body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(exampleContext), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRoleContext({
      target: "content-ops",
      company: "examplecorp" as never,
    });

    expect(result).toEqual(exampleContext);
    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string, "http://localhost");
    expect(parsed.pathname).toBe("/api/role-context");
    expect(parsed.searchParams.get("company")).toBe("examplecorp");
    expect(parsed.searchParams.get("target")).toBe("content-ops");
    expect(parsed.searchParams.has("for")).toBe(false);
  });

  it("resolves null on a non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    await expect(fetchRoleContext({ target: "content-ops" })).resolves.toBeNull();
  });

  it("resolves null on a fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchRoleContext({ target: "content-ops" })).resolves.toBeNull();
  });

  it("resolves null on a malformed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{\"nope\":true}", { status: 200 })),
    );
    await expect(fetchRoleContext({ target: "content-ops" })).resolves.toBeNull();
  });
});

describe("neutralHref", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("returns the pathname without search or hash", () => {
    window.history.pushState({}, "", "/some/page?for=examplecorp&target=content-ops#about");
    expect(neutralHref()).toBe("/some/page");
  });
});
