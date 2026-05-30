import { describe, expect, it } from "vitest";
import {
  applyFlag,
  applyFlags,
  lengthBucket,
  scanJD,
  type Category,
  type Flag,
} from "./jd-review";

const categories = (flags: Flag[]): Category[] => flags.map((f) => f.category);
const hasCategory = (flags: Flag[], category: Category) =>
  flags.some((f) => f.category === category);
const find = (flags: Flag[], category: Category) =>
  flags.find((f) => f.category === category);

describe("scanJD — high-confidence requisition codes", () => {
  it.each([
    "REQ-12345",
    "JR-1234",
    "JOB-1234",
    "HC-2026-018",
    "FY26-HC-014",
  ])("flags %s as an internal job code", (code) => {
    const flags = scanJD(`Apply to ${code} for this role and more.`);
    const flag = find(flags, "internal-job-code");
    expect(flag).toBeDefined();
    expect(flag?.confidence).toBe("high");
    expect(flag?.match).toBe(code);
    expect(flag?.placeholder).toBe("[INTERNAL JOB CODE]");
  });
});

describe("scanJD — high-confidence phrase categories", () => {
  it("flags confidential search context", () => {
    const flags = scanJD("This is a confidential search for a backfill for the role.");
    expect(hasCategory(flags, "confidential-search")).toBe(true);
    expect(find(flags, "confidential-search")?.confidence).toBe("high");
  });

  it("flags compensation planning detail", () => {
    const flags = scanJD("Internal grade 17 with an equity refresh on offer.");
    expect(hasCategory(flags, "internal-comp")).toBe(true);
    expect(find(flags, "internal-comp")?.placeholder).toBe("[INTERNAL COMP DETAIL]");
  });

  it("flags strategy phrases including acronyms", () => {
    expect(hasCategory(scanJD("Part of a stealth market entry effort."), "strategic-plan")).toBe(true);
    expect(hasCategory(scanJD("Hiring ahead of a planned RIF next quarter."), "strategic-plan")).toBe(true);
    expect(hasCategory(scanJD("Supporting an upcoming reduction in force."), "strategic-plan")).toBe(true);
  });

  it("flags security-sensitive operational detail", () => {
    const flags = scanJD("Responding to an active incident and a recent breach.");
    expect(hasCategory(flags, "security-sensitive")).toBe(true);
    expect(find(flags, "security-sensitive")?.placeholder).toBe("[SECURITY-SENSITIVE DETAIL]");
  });
});

describe("scanJD — medium-confidence heuristics", () => {
  it("flags a leading-trigger project name", () => {
    const flags = scanJD("You will lead Project Atlas across the org.");
    const flag = find(flags, "internal-project");
    expect(flag).toBeDefined();
    expect(flag?.confidence).toBe("medium");
    expect(flag?.match).toBe("Project Atlas");
  });

  it("flags a trailing-trigger client engagement", () => {
    const flags = scanJD("Own the Acme Bank rollout end to end.");
    const flag = find(flags, "client-name");
    expect(flag).toBeDefined();
    expect(flag?.match).toBe("Acme Bank");
  });

  it("flags a client-trigger phrase", () => {
    const flags = scanJD("Primary contact for the Globex account going forward.");
    const flag = find(flags, "client-name");
    expect(flag).toBeDefined();
    expect(flag?.match).toBe("Globex");
  });

  it("flags a person named near a hiring-process word", () => {
    const flags = scanJD("This role reports to Jane Smith on the leadership team.");
    const flag = find(flags, "employee-name");
    expect(flag).toBeDefined();
    expect(flag?.match).toBe("Jane Smith");
    expect(flag?.placeholder).toBe("[EMPLOYEE NAME]");
  });
});

describe("scanJD — does not over-sanitize ordinary role context", () => {
  it.each([
    "Experience with Workday integration is required.",
    "Drive Salesforce enablement across teams.",
    "Remote, US-based, 20% travel expected.",
    "Compensation is $145,000-$175,000 base salary, published.",
    "Must understand SOC 2 and ISO 27001 compliance domains.",
    "We value collaboration. You will own delivery for the platform team.",
  ])("leaves %s unflagged", (text) => {
    expect(scanJD(text)).toHaveLength(0);
  });

  it("suppresses an allowlisted tool even next to a trigger word", () => {
    // "AWS migration" would otherwise match the trailing-trigger project rule.
    expect(scanJD("Lead the AWS migration for the platform.")).toHaveLength(0);
  });

  it("does not treat a generic role title as a project name", () => {
    expect(hasCategory(scanJD("Hiring a Project Manager for the team."), "internal-project")).toBe(false);
    expect(hasCategory(scanJD("Hiring a Program Director for delivery."), "internal-project")).toBe(false);
  });

  it("does not treat a generic function as a person name", () => {
    expect(hasCategory(scanJD("This role reports to Engineering Operations."), "employee-name")).toBe(false);
  });
});

describe("scanJD — overlap resolution", () => {
  it("returns a single high-confidence flag for 'replacing current'", () => {
    const flags = scanJD("We are replacing current leadership in this org.");
    const overlapping = flags.filter((f) => f.match.toLowerCase().includes("replacing"));
    expect(overlapping).toHaveLength(1);
    expect(overlapping[0].category).toBe("confidential-search");
  });

  it("returns flags sorted with non-overlapping spans", () => {
    const flags = scanJD(
      "Confidential search for REQ-90021 to lead Project Atlas, reports to Jane Smith.",
    );
    expect(flags.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < flags.length; i += 1) {
      expect(flags[i].start).toBeGreaterThanOrEqual(flags[i - 1].end);
    }
  });
});

describe("applyFlag / applyFlags", () => {
  it("replaces a single flag span with its placeholder", () => {
    const text = "Own the REQ-12345 requisition.";
    const flags = scanJD(text);
    const flag = find(flags, "internal-job-code")!;
    expect(applyFlag(text, flag)).toBe("Own the [INTERNAL JOB CODE] requisition.");
  });

  it("applies multiple flags without shifting offsets", () => {
    const text = "Lead Project Atlas, reports to Jane Smith, code REQ-12345.";
    const flags = scanJD(text);
    const result = applyFlags(text, flags);
    expect(result).toContain("[INTERNAL PROJECT]");
    expect(result).toContain("[EMPLOYEE NAME]");
    expect(result).toContain("[INTERNAL JOB CODE]");
    expect(result).not.toContain("Atlas");
    expect(result).not.toContain("Jane Smith");
    expect(result).not.toContain("REQ-12345");
  });

  it("keeps surrounding text when replacing a partial-span flag", () => {
    const text = "Own the Acme Bank rollout end to end.";
    const flags = scanJD(text);
    const flag = find(flags, "client-name")!;
    expect(applyFlag(text, flag)).toBe("Own the [CLIENT NAME] rollout end to end.");
  });
});

describe("lengthBucket", () => {
  it.each([
    [10, "0-499"],
    [499, "0-499"],
    [500, "500-1999"],
    [1999, "500-1999"],
    [2000, "2000-4999"],
    [4999, "2000-4999"],
    [5000, "5000+"],
    [12000, "5000+"],
  ])("buckets length %i as %s", (length, bucket) => {
    expect(lengthBucket(length)).toBe(bucket);
  });
});

describe("scanJD — empty input", () => {
  it("returns no flags for empty text", () => {
    expect(scanJD("")).toEqual([]);
  });
});
