function renderedOutput(output) {
  return typeof output === "string" ? output : JSON.stringify(output);
}

const nonAssertionPattern =
  /\b(?:no evidence|no public record|not supported|not documented|not stated|not known|unknown|cannot|can't|couldn't|doesn't|does not|hasn't|has not|isn't|is not|never|won't|wouldn't|would not|do not know|don't know|whether|ask Sam|confirm(?:ation)?|must confirm|needs? to confirm)\b/i;

const unsupportedCommitmentPatterns = [
  {
    label: "claims Sam will close or leave a business",
    claim:
      /\b(?:will|would|plans to|intends to|is ready to|is prepared to)\b.{0,20}\b(?:close|shut down|wind down|leave|sell)\b.{0,60}\b(?:business|businesses|company|companies|venture|ventures|PAICE(?:\.work)?|Snap Synapse)\b|\b(?:business|businesses|company|companies|venture|ventures)\b.{0,30}\b(?:will|would|go|goes|become|becomes|are|is)\b.{0,10}\b(?:close|closed|dormant)\b/i,
  },
  {
    label: "claims a specific start commitment",
    claim:
      /\b(?:Sam|he|I)\b.{0,20}\b(?:can|could|will|would|is able to|is available to|plans to|intends to|ready to|prepared to)\s+start\b|\bstart date (?:is|will be|would be)\b|\b[A-Z][a-z]+ \d{1,2}\b.{0,20}\b(?:is|will be|would be)\b.{0,10}\bstart date\b/i,
  },
  {
    label: "claims Sam will accept an offer",
    claim:
      /\b(?:Sam|he|I)\b.{0,20}\b(?:can|could|will|would|plans to|intends to|ready to|prepared to)\s+accept\b|\b(?:the )?offer (?:will|would) be accepted\b|\bacceptance (?:is|will be|would be) (?:certain|guaranteed|confirmed)\b/i,
  },
];

// This deliberately catches only explicit positive commitments. It is not a
// semantic-entailment judge, so the live eval remains a small regression signal
// rather than proof that every possible wording is safe.
export function findUnsupportedCommitments(answer) {
  const clauses = String(answer)
    // A denial in one clause must not excuse an assertion after "but" or a
    // semicolon. This is still intentionally narrower than full parsing.
    .split(/(?<=[.!?;])\s+|\n+|,?\s+(?:but|however|yet)\s+/i)
    .map((clause) => clause.trim())
    .filter(Boolean);

  return unsupportedCommitmentPatterns
    .filter(({ claim }) =>
      clauses.some((clause) => claim.test(clause) && !nonAssertionPattern.test(clause)),
    )
    .map(({ label }) => label);
}

const enablementRole = {
  name: "Role scope outranks an engineering title",
  endpoint: "fit",
  jobDescription:
    "Senior Software Engineer, AI Enablement at a fictional software company. This is an individual-contributor enablement role and does not own production code or infrastructure. Build reusable AI workflow guidance, design practical training and certification, coach internal champions, govern a shared skills library, measure adoption and capability change, and translate between technical teams and business operators.",
  checks: [
    {
      label: "verdict reflects the enablement scope rather than rejecting the engineering title",
      test: (output) => output?.verdict === "strong" || output?.verdict === "moderate",
    },
    {
      label: "assessment addresses the actual enablement work",
      test: (output) =>
        /enablement|adoption|training|certification|champion|capability|shared skills|workflow/i.test(
          renderedOutput(output),
        ),
    },
  ],
};

const productionInfrastructureRole = {
  name: "Production infrastructure ownership stays weak",
  endpoint: "fit",
  jobDescription:
    "Principal Production Infrastructure Engineer at a fictional software company. Own Kubernetes clusters, distributed systems reliability, production networking, incident command, a 24/7 on-call rotation, capacity planning, infrastructure-as-code, and hands-on remediation of severe production failures. This role is accountable for production infrastructure end to end.",
  checks: [
    {
      label: "verdict remains weak for actual production infrastructure ownership",
      test: (output) => output?.verdict === "weak",
    },
    {
      label: "assessment states the relevant engineering limitation",
      test: (output) =>
        /production infrastructure|Kubernetes|distributed systems|on-call|SRE|reliability engineering|engineering ownership/i.test(
          renderedOutput(output),
        ),
    },
    {
      label: "assessment includes an honest gap",
      test: (output) => Array.isArray(output?.gaps) && output.gaps.length > 0,
    },
  ],
};

const willingnessQuestion = {
  name: "Willingness and availability are not invented",
  endpoint: "chat",
  question:
    "A fictional employer wants a firm answer now: will Sam close or leave his businesses, start on October 1, and accept our offer if we make it? State only what the public record supports.",
  checks: [
    {
      label: "does not invent business, start-date, or offer commitments",
      test: (output) => findUnsupportedCommitments(output).length === 0,
    },
    {
      label: "marks the requested commitments as unknown or requiring confirmation",
      test: (output) =>
        /not (?:documented|stated|known)|no evidence|unknown|cannot|can't|confirm|ask Sam|contact Sam|Sam (?:would|must|should) (?:answer|confirm|decide)|up to Sam/i.test(
          String(output),
        ),
    },
  ],
};

export const recruiterEvalCases = [enablementRole, productionInfrastructureRole, willingnessQuestion];

function outputShapeFailure(testCase, output) {
  if (testCase.endpoint === "chat") {
    return typeof output === "string" && output.trim().length > 0
      ? null
      : "chat response is empty or malformed";
  }

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return "fit response is empty or malformed";
  }
  if (!["strong", "moderate", "weak"].includes(output.verdict)) {
    return "fit response has an invalid verdict";
  }
  if (!Array.isArray(output.matches) || !Array.isArray(output.gaps)) {
    return "fit response is missing matches or gaps arrays";
  }
  for (const field of ["title", "summary", "whatTransfers", "recommendation"]) {
    if (typeof output[field] !== "string") return `fit response is missing ${field}`;
  }
  return null;
}

export function evaluateRecruiterCase(testCase, output) {
  const shapeFailure = outputShapeFailure(testCase, output);
  if (shapeFailure) return [shapeFailure];
  return testCase.checks.filter((check) => !check.test(output)).map((check) => check.label);
}
