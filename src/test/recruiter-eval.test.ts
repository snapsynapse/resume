import { describe, expect, it } from "vitest";

import {
  evaluateRecruiterCase,
  findUnsupportedCommitments,
  recruiterEvalCases,
} from "../../scripts/recruiter-eval-cases.mjs";

const caseNamed = (name: string) => {
  const found = recruiterEvalCases.find((testCase) => testCase.name === name);
  if (!found) throw new Error(`Missing recruiter eval case: ${name}`);
  return found;
};

describe("recruiter eval cases", () => {
  it("uses only fictional, generic role fixtures", () => {
    const fixtures = JSON.stringify(recruiterEvalCases);
    expect(fixtures).toMatch(/fictional/i);
    expect(fixtures).not.toMatch(/ExampleCorp|Northwind Traders/i);
  });

  it("accepts an in-band enablement result despite its engineering title", () => {
    const testCase = caseNamed("Role scope outranks an engineering title");
    expect(
      evaluateRecruiterCase(testCase, {
        verdict: "moderate",
        title: "Worth a Conversation",
        summary: "The individual-contributor AI enablement scope matches.",
        matches: [{ requirement: "Adoption", evidence: "Built measured enablement workflows." }],
        gaps: [],
        whatTransfers: "Enablement systems.",
        recommendation: "Discuss the work.",
      }),
    ).toEqual([]);
  });

  it("rejects a strong production-infrastructure assessment", () => {
    const testCase = caseNamed("Production infrastructure ownership stays weak");
    expect(
      evaluateRecruiterCase(testCase, {
        verdict: "strong",
        title: "Strong fit",
        summary: "Strong match for production infrastructure.",
        matches: [],
        gaps: [],
        whatTransfers: "Workflow design.",
        recommendation: "Proceed.",
      }),
    ).toEqual([
      "verdict remains weak for actual production infrastructure ownership",
      "assessment includes an honest gap",
    ]);
  });
});

describe("unsupported commitment matcher", () => {
  it("flags direct inventions", () => {
    expect(findUnsupportedCommitments("Sam will close his companies and take the role."))
      .toContain("claims Sam will close or leave a business");
    expect(findUnsupportedCommitments("He can start on October 1."))
      .toContain("claims a specific start commitment");
    expect(findUnsupportedCommitments("Sam would accept the offer."))
      .toContain("claims Sam will accept an offer");
    expect(findUnsupportedCommitments("The businesses themselves go dormant."))
      .toContain("claims Sam will close or leave a business");
    expect(findUnsupportedCommitments("Sam will close PAICE.work and Snap Synapse."))
      .toContain("claims Sam will close or leave a business");
  });

  it("does not confuse explicit negation with an asserted commitment", () => {
    const answer =
      "There is no evidence Sam would close his companies. He can't confirm an October 1 start. Sam has not stated that he would accept an offer.";
    expect(findUnsupportedCommitments(answer)).toEqual([]);
    expect(
      findUnsupportedCommitments(
        "Ask Sam whether he will close his businesses. He must confirm whether he can start October 1 and would accept an offer.",
      ),
    ).toEqual([]);
    expect(
      findUnsupportedCommitments(
        "Both businesses remain operational today. No public record says Sam will close either one.",
      ),
    ).toEqual([]);
  });

  it("does not let an unrelated negation excuse a later assertion", () => {
    expect(
      findUnsupportedCommitments(
        "Sam has no documented infrastructure gap, but will close his businesses for the role.",
      ),
    ).toContain("claims Sam will close or leave a business");
  });

  it("makes the live willingness case fail on an invented promise and pass on a denial", () => {
    const testCase = caseNamed("Willingness and availability are not invented");
    expect(
      evaluateRecruiterCase(
        testCase,
        "Sam will close his businesses, can start on October 1, and would accept the offer.",
      ),
    ).toContain("does not invent business, start-date, or offer commitments");

    expect(
      evaluateRecruiterCase(
        testCase,
        "Those commitments are not documented. Ask Sam to confirm his business plans, availability, and any offer decision.",
      ),
    ).toEqual([]);
  });

  it("fails malformed output before content checks", () => {
    const chatCase = caseNamed("Willingness and availability are not invented");
    expect(evaluateRecruiterCase(chatCase, "")).toEqual(["chat response is empty or malformed"]);

    const fitCase = caseNamed("Role scope outranks an engineering title");
    expect(evaluateRecruiterCase(fitCase, { verdict: "moderate" })).toEqual([
      "fit response is missing matches or gaps arrays",
    ]);
  });
});
