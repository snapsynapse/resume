const requiredMetadataFields = [
  "identifier",
  "profile",
  "profile-version",
  "guide-version",
  "applies-to",
  "canonical-url",
  "repository-url",
  "last-reviewed",
  "conformance-target",
];

function exactLineCount(content, line) {
  return content.split("\n").filter((candidate) => candidate === line).length;
}

function fieldOccurrences(block, field) {
  const prefix = new RegExp(`^${field}(?::|=|\\s|$)`);
  return block.split("\n").filter((line) => prefix.test(line));
}

function exactFieldValue(block, field) {
  const matches = block.match(new RegExp(`^${field}: (\\S(?:.*\\S)?)$`, "gm")) ?? [];
  return matches.length === 1 ? matches[0].slice(field.length + 2) : undefined;
}

export function validateAssistantGuideContract(content) {
  const errors = [];
  if (
    exactLineCount(content, "[assistant-guide-metadata]") !== 1 ||
    exactLineCount(content, "[/assistant-guide-metadata]") !== 1
  ) {
    errors.push("metadata envelope must contain one exact opener and closer");
  }
  const metadata = content.match(
    /^\[assistant-guide-metadata\]\n([\s\S]*?)^\[\/assistant-guide-metadata\]$/m,
  )?.[1] ?? "";
  for (const field of requiredMetadataFields) {
    if (fieldOccurrences(metadata, field).length !== 1) {
      errors.push(`metadata field ${field} must occur exactly once`);
    }
    if (exactFieldValue(metadata, field) === undefined) {
      errors.push(`metadata field ${field} must use key: non-empty-value syntax`);
    }
  }
  for (const [field, expected] of [
    ["profile", "human-verifiable-assistant-guide"],
    ["profile-version", "0.4.0"],
    ["applies-to", "https://resume.sam-rogers.com/"],
    ["canonical-url", "https://resume.sam-rogers.com/.well-known/assistant-guide.txt"],
    ["repository-url", "https://github.com/snapsynapse/resume"],
    ["conformance-target", "GuideCheck Level 3"],
  ]) {
    if (exactFieldValue(metadata, field) !== expected) {
      errors.push(`metadata field ${field} must equal ${expected}`);
    }
  }
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(exactFieldValue(metadata, "guide-version") ?? "")) {
    errors.push("guide-version must be SemVer");
  }
  const lastReviewed = exactFieldValue(metadata, "last-reviewed") ?? "";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(lastReviewed) ||
    Number.isNaN(Date.parse(`${lastReviewed}T00:00:00Z`)) ||
    new Date(`${lastReviewed}T00:00:00Z`).toISOString().slice(0, 10) !== lastReviewed
  ) {
    errors.push("last-reviewed must be a valid YYYY-MM-DD date");
  }

  const compact = content.split("\n[action]\n", 1)[0].toLowerCase();
  for (const concepts of [
    ["verify", "verifier"],
    ["achieved level", "blocking findings"],
    ["ask the user", "approve proceeding under the reported level"],
    ["do not execute", "before confirmation"],
  ]) {
    if (!concepts.every((concept) => compact.includes(concept))) {
      errors.push(`compact verification instruction missing ${concepts.join(" + ")}`);
    }
  }
  for (const section of [
    "Assistant Guide:",
    "Task scope",
    "Assistant invocation prompt",
    "Authority",
    "Safety rules",
    "Action classification",
    "Actions",
    "Stop and ask",
    "Acceptance checklist",
    "Threat model",
    "Untrusted content handling",
    "Disclaimer and non-goals",
  ]) {
    if (!content.includes(section)) errors.push(`missing section ${section}`);
  }

  if (exactLineCount(content, "[action]") !== 1 || exactLineCount(content, "[/action]") !== 1) {
    errors.push("action envelope must contain one exact opener and closer");
  }
  const actions = [...content.matchAll(/^\[action\]\n([\s\S]*?)^\[\/action\]$/gm)];
  if (actions.length !== 1) errors.push("must contain one parsed action block");
  const action = actions[0]?.[1] ?? "";
  for (const field of ["id", "class", "approval", "command"]) {
    if (fieldOccurrences(action, field).length !== 1) {
      errors.push(`action field ${field} must occur exactly once`);
    }
    if (exactFieldValue(action, field) === undefined) {
      errors.push(`action field ${field} must use key: non-empty-value syntax`);
    }
  }
  for (const [field, expected] of [
    ["id", "retrieve-public-resume"],
    ["class", "networked"],
    ["approval", "not-required"],
    ["egress", "resume.sam-rogers.com"],
    ["command", "curl -fsS --max-time 10 https://resume.sam-rogers.com/resume.txt"],
  ]) {
    if (fieldOccurrences(action, field).length !== 1 || exactFieldValue(action, field) !== expected) {
      errors.push(`retrieval action field ${field} must equal ${expected}`);
    }
  }
  return errors;
}

export function assistantGuideMetadata(content) {
  const block = content.match(
    /^\[assistant-guide-metadata\]\n([\s\S]*?)^\[\/assistant-guide-metadata\]$/m,
  )?.[1] ?? "";
  return {
    guideVersion: exactFieldValue(block, "guide-version"),
    lastReviewed: exactFieldValue(block, "last-reviewed"),
  };
}
