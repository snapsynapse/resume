#!/usr/bin/env node
// Validate and package the private employer role-context presets.
//
// The presets JSON lives outside this repository (see README "Target and company
// routing"). This CLI is deliberately self-contained: it imports nothing from src/ so
// it can run before a build, in CI, or on a machine that only has the private file.
//
// Usage:
//   node scripts/role-context-presets.mjs validate <file>
//   node scripts/role-context-presets.mjs env <file>
//
// `validate` exits 1 on the first schema problem and prints the JSON path of the
// problem. It never prints a value from the file, so a malformed private file cannot
// leak employer names, role titles, or prompt text into a terminal or CI log.
//
// `env` prints the minified JSON to stdout so it can be piped straight into
// `vercel env add ROLE_CONTEXT_PRESETS production`.
//
// Schema (version 1):
// {
//   "version": 1,
//   "companies": {
//     "<key>": {
//       "label": string,
//       "applications": {
//         "<targetKey>": {
//           "sourceRole": string,
//           "heroTitle"?: string,
//           "reqId"?: string,
//           "sourceUrl"?: string,
//           "locationContext"?: string,
//           "promptDelta": string,
//           "suggestedQuestions": string[]
//         }
//       }
//     }
//   }
// }
// Company and target keys must match /^[a-z0-9-]{1,40}$/. Target keys must also be
// targets the site knows about (TARGET_KEYS below, mirrored from src/lib/role-context.ts).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SCHEMA_VERSION = 1;
const KEY_PATTERN = /^[a-z0-9-]{1,40}$/;
const TARGET_KEYS = new Set(["ai-education", "content-ops", "ai-transformation"]);
const REQUIRED_APPLICATION_STRINGS = ["sourceRole", "promptDelta"];
const OPTIONAL_APPLICATION_STRINGS = ["heroTitle", "reqId", "sourceUrl", "locationContext"];
const KNOWN_APPLICATION_FIELDS = new Set([
  ...REQUIRED_APPLICATION_STRINGS,
  ...OPTIONAL_APPLICATION_STRINGS,
  "suggestedQuestions",
]);
const KNOWN_COMPANY_FIELDS = new Set(["label", "applications"]);
const KNOWN_ROOT_FIELDS = new Set(["version", "companies"]);

class SchemaError extends Error {
  constructor(path, problem) {
    super(`${path}: ${problem}`);
    this.name = "SchemaError";
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(obj, field, path) {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SchemaError(`${path}.${field}`, "expected a non-empty string");
  }
}

function checkOptionalString(obj, field, path) {
  if (!Object.hasOwn(obj, field) || obj[field] === undefined) return;
  if (typeof obj[field] !== "string" || obj[field].trim().length === 0) {
    throw new SchemaError(`${path}.${field}`, "expected a non-empty string when present");
  }
}

function rejectUnknownFields(obj, known, path) {
  for (const field of Object.keys(obj)) {
    if (!known.has(field)) throw new SchemaError(`${path}.${field}`, "unknown field");
  }
}

function validateKey(key, path, what) {
  if (!KEY_PATTERN.test(key)) {
    throw new SchemaError(`${path}.${redactKey(key)}`, `${what} key must match ${KEY_PATTERN}`);
  }
}

// A malformed key is itself a value from the file; report its length, not its text.
function redactKey(key) {
  return `<key of length ${String(key).length}>`;
}

function validateApplication(app, path) {
  if (!isPlainObject(app)) throw new SchemaError(path, "expected an object");
  rejectUnknownFields(app, KNOWN_APPLICATION_FIELDS, path);
  for (const field of REQUIRED_APPLICATION_STRINGS) requireNonEmptyString(app, field, path);
  for (const field of OPTIONAL_APPLICATION_STRINGS) checkOptionalString(app, field, path);
  if (Object.hasOwn(app, "sourceUrl") && app.sourceUrl !== undefined) {
    let parsed;
    try {
      parsed = new URL(app.sourceUrl);
    } catch {
      throw new SchemaError(`${path}.sourceUrl`, "expected an absolute URL");
    }
    if (parsed.protocol !== "https:") {
      throw new SchemaError(`${path}.sourceUrl`, "expected an https URL");
    }
  }
  const questions = app.suggestedQuestions;
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new SchemaError(`${path}.suggestedQuestions`, "expected a non-empty array");
  }
  questions.forEach((question, index) => {
    if (typeof question !== "string" || question.trim().length === 0) {
      throw new SchemaError(`${path}.suggestedQuestions[${index}]`, "expected a non-empty string");
    }
  });
}

function validateCompany(company, key, path) {
  if (!isPlainObject(company)) throw new SchemaError(path, "expected an object");
  rejectUnknownFields(company, KNOWN_COMPANY_FIELDS, path);
  requireNonEmptyString(company, "label", path);
  if (!isPlainObject(company.applications)) {
    throw new SchemaError(`${path}.applications`, "expected an object");
  }
  const targetKeys = Object.keys(company.applications);
  if (targetKeys.length === 0) {
    throw new SchemaError(`${path}.applications`, "expected at least one application");
  }
  for (const targetKey of targetKeys) {
    validateKey(targetKey, `${path}.applications`, "target");
    if (!TARGET_KEYS.has(targetKey)) {
      throw new SchemaError(
        `${path}.applications.${targetKey}`,
        `unknown target; expected one of ${[...TARGET_KEYS].join(", ")}`,
      );
    }
    validateApplication(company.applications[targetKey], `${path}.applications.${targetKey}`);
  }
}

export function validatePresets(data) {
  if (!isPlainObject(data)) throw new SchemaError("$", "expected a JSON object");
  rejectUnknownFields(data, KNOWN_ROOT_FIELDS, "$");
  if (data.version !== SCHEMA_VERSION) {
    throw new SchemaError("$.version", `expected ${SCHEMA_VERSION}`);
  }
  if (!isPlainObject(data.companies)) throw new SchemaError("$.companies", "expected an object");
  for (const key of Object.keys(data.companies)) {
    validateKey(key, "$.companies", "company");
    validateCompany(data.companies[key], key, `$.companies.${key}`);
  }
  return {
    companies: Object.keys(data.companies).length,
    applications: Object.values(data.companies).reduce(
      (count, company) => count + Object.keys(company.applications).length,
      0,
    ),
  };
}

function readJson(file) {
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    throw new SchemaError("$", `cannot read file (${err.code ?? "error"})`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    // JSON.parse error messages quote surrounding text; do not forward them.
    throw new SchemaError("$", "not valid JSON");
  }
}

function usage() {
  console.error("Usage: node scripts/role-context-presets.mjs <validate|env> <file>");
  process.exit(2);
}

function main(argv) {
  const [command, file] = argv;
  if (!command || !file || !["validate", "env"].includes(command)) usage();

  let data;
  let summary;
  try {
    data = readJson(file);
    summary = validatePresets(data);
  } catch (err) {
    if (err instanceof SchemaError) {
      console.error(`Invalid role-context presets at ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  if (command === "validate") {
    console.error(
      `OK: ${summary.companies} compan${summary.companies === 1 ? "y" : "ies"}, ` +
        `${summary.applications} application${summary.applications === 1 ? "" : "s"}`,
    );
    return;
  }

  // `env`: minified JSON on stdout only. Diagnostics go to stderr so the stdout stream
  // stays a clean value for `| pbcopy` or `| vercel env add`. A closed reader (for example a
  // missing `vercel` binary) is not this script's error: exit quietly instead of a stack trace.
  process.stdout.on("error", (err) => {
    if (err.code === "EPIPE") process.exit(0);
    throw err;
  });
  process.stdout.write(JSON.stringify(data));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2));
}
