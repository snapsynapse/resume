import { describe, expect, it } from "vitest";
import fixture from "../test/fixtures/role-context-presets.json";
import {
  composeRoleContext,
  isCompanyKeyShape,
  parseCompanyPresetMap,
  parseRoleSelection,
  targetPresets,
  toPublicRoleContext,
  type CompanyPresetMap,
} from "./role-context";

// Two fake employers. No real employer name appears in this suite.
const companies: CompanyPresetMap = parseCompanyPresetMap(fixture);

describe("role-context routing", () => {
  it("keeps the default route neutral", () => {
    expect(parseRoleSelection("")).toEqual({});
    expect(composeRoleContext({})).toBeNull();
    expect(composeRoleContext({}, companies)).toBeNull();
  });

  it("lets target own the durable positioning wedge", () => {
    const context = composeRoleContext(parseRoleSelection("?target=content-ops"), companies);

    expect(context?.label).toBe("Content Operations");
    expect(context?.companyLabel).toBeUndefined();
    expect(context?.promptContext).toMatch(/content-portfolio health/i);
    expect(context?.promptContext).not.toMatch(/ExampleCorp/);
  });

  it("lets company alone provide only light employer context", () => {
    const context = composeRoleContext(parseRoleSelection("?for=examplecorp"), companies);

    expect(context?.label).toBe("ExampleCorp");
    expect(context?.targetLabel).toBeUndefined();
    expect(context?.sourceRole).toBeUndefined();
    expect(context?.promptContext).toMatch(/evaluating Sam in a ExampleCorp context/);
    expect(context?.promptContext).toMatch(/Do not assume a specific role/i);
    expect(context?.promptContext).not.toMatch(/content-and-systems operations spine/i);
  });

  it("composes target and company into the application context", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=content-ops&for=examplecorp"),
      companies,
    );

    expect(context?.label).toBe("ExampleCorp - Learning Systems Program Lead");
    expect(context?.targetLabel).toBe("Content Operations");
    expect(context?.companyLabel).toBe("ExampleCorp");
    expect(context?.sourceRole).toBe("Learning Systems Program Lead");
    expect(context?.locationContext).toBe("Remote, US");
    expect(context?.promptContext).toMatch(/content-portfolio health/i);
    expect(context?.promptContext).toMatch(/content-and-systems operations spine/i);
    expect(context?.promptContext).toMatch(/Do not disclose a street address/);
    expect(context?.suggestedQuestions[0]).toMatch(/ExampleCorp/);
  });

  it("falls back to the company-only prompt when the company has no application for the target", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=ai-transformation&for=examplecorp"),
      companies,
    );

    expect(context?.label).toBe("ExampleCorp - AI Transformation");
    expect(context?.sourceRole).toBeUndefined();
    expect(context?.promptContext).toMatch(/Do not assume a specific role/i);
    expect(context?.heroTitles).toEqual(targetPresets["ai-transformation"].heroTitles);
  });

  it("treats `company` as canonical and `for` as an alias", () => {
    expect(parseRoleSelection("?for=examplecorp")).toEqual({ company: "examplecorp" });
    expect(parseRoleSelection("?company=examplecorp")).toEqual({ company: "examplecorp" });
    expect(parseRoleSelection("?for=northwind&company=examplecorp")).toEqual({
      company: "examplecorp",
    });
  });

  it("treats `target` as canonical and `role` as an alias", () => {
    expect(parseRoleSelection("?role=content-ops")).toEqual({ target: "content-ops" });
    expect(parseRoleSelection("?target=ai-education&role=content-ops")).toEqual({
      target: "ai-education",
    });
  });

  it("keeps old role=anthropic links working without making role the new contract", () => {
    expect(parseRoleSelection("?role=anthropic")).toEqual({ target: "ai-education" });
    expect(composeRoleContext(parseRoleSelection("?role=anthropic"))?.label).toBe(
      "AI Education Systems",
    );
  });

  it("makes an unknown company key indistinguishable from a typo", () => {
    const typo = composeRoleContext(
      parseRoleSelection("?target=content-ops&for=exanplecorp"),
      companies,
    );
    const noCompany = composeRoleContext(parseRoleSelection("?target=content-ops"), companies);
    const noMap = composeRoleContext(parseRoleSelection("?target=content-ops&for=examplecorp"));

    expect(typo).toEqual({ ...noCompany, selection: typo?.selection });
    expect(typo?.companyLabel).toBeUndefined();
    expect(noMap?.companyLabel).toBeUndefined();
    expect(noMap?.label).toBe("Content Operations");
    // Company-only with an unknown key resolves to nothing at all.
    expect(composeRoleContext(parseRoleSelection("?for=exanplecorp"), companies)).toBeNull();
  });

  it("keeps a shape-valid company in the selection even when it is not in the map", () => {
    // Validity against the map is the server's job; the client only checks shape.
    expect(parseRoleSelection("?for=notareal&target=content-ops")).toEqual({
      target: "content-ops",
      company: "notareal",
    });
  });

  it("rejects company keys that do not match the key shape", () => {
    expect(isCompanyKeyShape("examplecorp")).toBe(true);
    expect(isCompanyKeyShape("north-wind-2")).toBe(true);
    expect(isCompanyKeyShape("__proto__")).toBe(false);
    expect(isCompanyKeyShape("constructor")).toBe(true); // shape-valid, map lookup must still miss
    expect(isCompanyKeyShape("ExampleCorp")).toBe(false);
    expect(isCompanyKeyShape("a".repeat(41))).toBe(false);
    expect(isCompanyKeyShape("")).toBe(false);
    expect(isCompanyKeyShape("example corp")).toBe(false);
    expect(isCompanyKeyShape(42)).toBe(false);

    expect(parseRoleSelection("?for=__proto__")).toEqual({});
    expect(parseRoleSelection("?for=ExampleCorp")).toEqual({});
    expect(parseRoleSelection(`?for=${"a".repeat(41)}`)).toEqual({});
  });

  it("never resolves prototype keys against the map", () => {
    const polluted = composeRoleContext(
      { target: "content-ops", company: "constructor" },
      companies,
    );
    expect(polluted?.companyLabel).toBeUndefined();
    expect(polluted?.label).toBe("Content Operations");

    const proto = composeRoleContext({ company: "__proto__" }, companies);
    expect(proto).toBeNull();

    // Same holds for a plain-object map that still carries Object.prototype.
    const plainMap: CompanyPresetMap = { ...companies };
    expect(composeRoleContext({ company: "constructor" }, plainMap)).toBeNull();
    expect(composeRoleContext({ company: "hasOwnProperty" }, plainMap)).toBeNull();
  });

  it("ignores an unknown target and keeps company context", () => {
    expect(parseRoleSelection("?for=examplecorp&target=notareal")).toEqual({
      company: "examplecorp",
    });
  });

  it("keeps the durable AI transformation target employer and location neutral", () => {
    const context = composeRoleContext(parseRoleSelection("?target=ai-transformation"), companies);

    expect(context?.label).toBe("AI Transformation");
    expect(context?.companyLabel).toBeUndefined();
    expect(context?.locationContext).toBeUndefined();
    expect(context?.promptContext).not.toMatch(/ExampleCorp|Northwind|Remote, US/i);
  });

  it("leads the hero rotation with the applied-for title when an application is active", () => {
    const applied = composeRoleContext(
      parseRoleSelection("?target=content-ops&for=examplecorp"),
      companies,
    );
    expect(applied?.heroTitles?.[0]).toBe("Learning Systems Program Lead");
    expect(applied?.heroTitles).toEqual(
      expect.arrayContaining(targetPresets["content-ops"].heroTitles),
    );
    // The applied-for title is not duplicated when it already sits in the rotation.
    expect(applied?.heroTitles?.filter((t) => t === "Learning Systems Program Lead")).toHaveLength(1);
  });

  it("keeps the durable hero rotation employer-neutral without an application", () => {
    const durable = composeRoleContext(parseRoleSelection("?target=content-ops"), companies);
    expect(durable?.heroTitles).toEqual(targetPresets["content-ops"].heroTitles);
  });

  it("uses the short heroTitle when a posting title is too long to lead the rotation", () => {
    const context = composeRoleContext(
      parseRoleSelection("?for=northwind&target=ai-education"),
      companies,
    );
    expect(context?.sourceRole).toBe("Director of Enablement Platforms");
    expect(context?.heroTitles?.[0]).toBe("Enablement Platforms Director");
    expect(context?.locationContext).toBeUndefined();
  });
});

describe("toPublicRoleContext", () => {
  it("strips promptContext and keeps every other field", () => {
    const context = composeRoleContext(
      parseRoleSelection("?target=content-ops&for=examplecorp"),
      companies,
    );
    expect(context).not.toBeNull();
    const publicContext = toPublicRoleContext(context!);

    expect(publicContext).not.toHaveProperty("promptContext");
    expect(JSON.stringify(publicContext)).not.toMatch(/operations spine|Do not disclose/);
    expect(publicContext).toMatchObject({
      label: "ExampleCorp - Learning Systems Program Lead",
      companyLabel: "ExampleCorp",
      sourceRole: "Learning Systems Program Lead",
      locationContext: "Remote, US",
      heroTitles: context!.heroTitles,
      suggestedQuestions: context!.suggestedQuestions,
      selection: { target: "content-ops", company: "examplecorp" },
    });
  });
});

describe("parseCompanyPresetMap", () => {
  const validCompany = {
    label: "ExampleCorp",
    applications: {
      "content-ops": {
        sourceRole: "Lead",
        promptDelta: "delta",
        suggestedQuestions: ["q"],
      },
    },
  };

  it("parses the fixture and fills in keys", () => {
    expect(Object.keys(companies).sort()).toEqual(["examplecorp", "northwind"]);
    expect(companies.examplecorp.key).toBe("examplecorp");
    expect(companies.northwind.label).toBe("Northwind Traders");
    expect(companies.northwind.applications["ai-education"]?.heroTitle).toBe(
      "Enablement Platforms Director",
    );
    expect(companies.examplecorp.applications["ai-education"]).toBeUndefined();
  });

  it("returns a map with no prototype", () => {
    expect(Object.getPrototypeOf(companies)).toBeNull();
    expect("constructor" in companies).toBe(false);
  });

  it("accepts an empty company set", () => {
    expect(Object.keys(parseCompanyPresetMap({ version: 1, companies: {} }))).toEqual([]);
  });

  it.each<[string, unknown, RegExp]>([
    ["a non-object", "nope", /at \$:/],
    ["an array", [], /at \$:/],
    ["a missing version", { companies: {} }, /\$\.version/],
    ["the wrong version", { version: 2, companies: {} }, /\$\.version/],
    ["an unknown top-level field", { version: 1, companies: {}, extra: 1 }, /\$\.extra/],
    ["missing companies", { version: 1 }, /\$\.companies/],
    [
      "an uppercase company key",
      { version: 1, companies: { ExampleCorp: validCompany } },
      /\$\.companies: company key/,
    ],
    [
      "a prototype company key",
      // JSON.parse creates a real own property named __proto__; an object literal would not.
      JSON.parse(`{"version":1,"companies":{"__proto__":${JSON.stringify(validCompany)}}}`),
      /\$\.companies: company key/,
    ],
    [
      "a too-long company key",
      { version: 1, companies: { ["a".repeat(41)]: validCompany } },
      /\$\.companies: company key/,
    ],
    [
      "a company without a label",
      { version: 1, companies: { x: { applications: {} } } },
      /\$\.companies\.x\.label/,
    ],
    [
      "a company with an unknown field",
      { version: 1, companies: { x: { ...validCompany, referrerPatterns: [] } } },
      /\$\.companies\.x\.referrerPatterns/,
    ],
    [
      "a company without applications",
      { version: 1, companies: { x: { label: "X" } } },
      /\$\.companies\.x\.applications/,
    ],
    [
      "an application under an unknown target",
      { version: 1, companies: { x: { label: "X", applications: { "not-a-target": {} } } } },
      /\$\.companies\.x\.applications: application key/,
    ],
    [
      "an application missing sourceRole",
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: { "content-ops": { promptDelta: "d", suggestedQuestions: [] } },
          },
        },
      },
      /\$\.companies\.x\.applications\.content-ops\.sourceRole/,
    ],
    [
      "an application missing promptDelta",
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: { "content-ops": { sourceRole: "r", suggestedQuestions: [] } },
          },
        },
      },
      /\$\.companies\.x\.applications\.content-ops\.promptDelta/,
    ],
    [
      "non-string suggestedQuestions",
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: {
              "content-ops": { sourceRole: "r", promptDelta: "d", suggestedQuestions: [1] },
            },
          },
        },
      },
      /\$\.companies\.x\.applications\.content-ops\.suggestedQuestions/,
    ],
    [
      "a non-string optional field",
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: {
              "content-ops": {
                sourceRole: "r",
                promptDelta: "d",
                suggestedQuestions: [],
                heroTitle: 5,
              },
            },
          },
        },
      },
      /\$\.companies\.x\.applications\.content-ops\.heroTitle/,
    ],
    [
      "an application with an unknown field",
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: {
              "content-ops": {
                sourceRole: "r",
                promptDelta: "d",
                suggestedQuestions: [],
                companyOnlyPrompt: "x",
              },
            },
          },
        },
      },
      /\$\.companies\.x\.applications\.content-ops\.companyOnlyPrompt/,
    ],
  ])("rejects %s and names the path", (_name, raw, pathPattern) => {
    expect(() => parseCompanyPresetMap(raw)).toThrow(pathPattern);
  });

  it("never echoes offending values in the error message", () => {
    const secret = "SECRET-VALUE-9000";
    const attempts: unknown[] = [
      { version: secret, companies: {} },
      { version: 1, companies: { [secret]: validCompany } },
      { version: 1, companies: { x: { label: secret, applications: { [secret]: {} } } } },
      {
        version: 1,
        companies: {
          x: {
            label: "X",
            applications: {
              "content-ops": { sourceRole: secret, promptDelta: 7, suggestedQuestions: [] },
            },
          },
        },
      },
    ];
    for (const raw of attempts) {
      let message = "";
      try {
        parseCompanyPresetMap(raw);
      } catch (err) {
        message = (err as Error).message;
      }
      expect(message).not.toBe("");
      expect(message.toLowerCase()).not.toContain(secret.toLowerCase());
    }
  });
});
