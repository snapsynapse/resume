export const sensitiveMaterialApprovalChecks = [
  {
    label: "still discourages full sensitive paste",
    include: /redact|placeholder|summarize|email|avoid|do not|don't/i,
  },
  {
    label: "names sensitive material",
    include: /confidential|proprietary|sensitive|unreleased|regulated|internal/i,
  },
  {
    label: "routes to safer channel or redaction",
    include:
      /email|sam@sam-rogers\.com|redact|placeholder|saniti[sz](?:e|ed|ing|ation)?|direct human(?: conversation| review| discussion| call)?|human-to-human/i,
  },
];
