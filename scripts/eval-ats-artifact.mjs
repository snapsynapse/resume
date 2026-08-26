import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REQUIRED_SECTIONS = [
  "## Positioning",
  "## Target lanes",
  "## Experience",
  "## Strengths",
  "## Education and certifications",
  "## Keywords",
  "## Gaps to name plainly",
];

function result(name, passed, detail) {
  return { name, status: passed ? "pass" : "fail", detail };
}

export function evaluateAtsArtifact(text) {
  const checks = [];
  const sectionPositions = REQUIRED_SECTIONS.map((heading) => text.indexOf(heading));
  const ordered = sectionPositions.every((position) => position >= 0)
    && sectionPositions.every((position, index) => index === 0 || position > sectionPositions[index - 1]);
  const unique = REQUIRED_SECTIONS.every(
    (heading) => text.split(heading).length - 1 === 1,
  );

  checks.push(result(
    "plain_text_integrity",
    !/<\/?[a-z][^>]*>|\[[^\]]+\]\([^)]+\)|\uFFFD|[\u0000-\u0008\u000B\u000C\u000E-\u001F]/i.test(text),
    "no HTML, Markdown links, replacement characters, or unsafe controls",
  ));
  checks.push(result(
    "identity_and_contact",
    /^# Sam Rogers$/m.test(text)
      && /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)
      && /https:\/\/[A-Z0-9.-]+\//i.test(text),
    "name, email, and visible HTTPS URL are present",
  ));
  checks.push(result(
    "section_contract",
    ordered && unique,
    "required sections appear once and in reading order",
  ));

  const experience = text.slice(
    text.indexOf("## Experience"),
    text.indexOf("## Strengths"),
  );
  const roles = experience.match(/^### .+$/gm) ?? [];
  const bullets = experience.match(/^- .+$/gm) ?? [];
  const dateRanges = experience.match(/\b(?:19|20)\d{2}-(?:Present|(?:19|20)\d{2})\b/g) ?? [];
  checks.push(result(
    "experience_parseability",
    roles.length >= 3 && bullets.length >= 12 && dateRanges.length >= 4,
    `${roles.length} roles, ${bullets.length} bullets, ${dateRanges.length} date ranges`,
  ));

  const targetSection = text.slice(
    text.indexOf("## Target lanes"),
    text.indexOf("## Experience"),
  );
  const targetLanes = targetSection.match(/^- .+$/gm) ?? [];
  checks.push(result(
    "search_outcome_signal",
    targetLanes.length >= 3
      && /content(?: and systems)? operations/i.test(targetSection)
      && /education/i.test(targetSection)
      && /assessment|certification/i.test(targetSection),
    `${targetLanes.length} target lanes with content, education, and assessment vocabulary`,
  ));
  checks.push(result(
    "artifact_completeness",
    text.length >= 5_000
      && !/\b(?:TODO|TBD|FIXME|LOREM IPSUM|PLACEHOLDER)\b/i.test(text),
    `${text.length} characters and no unresolved placeholders`,
  ));

  return {
    schema_version: 1,
    artifact: "public/resume.txt",
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    checks,
  };
}

function main() {
  const artifact = new URL("../public/resume.txt", import.meta.url);
  const evaluation = evaluateAtsArtifact(readFileSync(artifact, "utf8"));
  console.log(`ATS text artifact eval ${evaluation.status.toUpperCase()}`);
  for (const check of evaluation.checks) {
    console.log(`  ${check.status.toUpperCase().padEnd(4)} ${check.name}: ${check.detail}`);
  }
  process.exitCode = evaluation.status === "pass" ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
