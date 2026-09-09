// Server-only. Loads the private employer application presets from the environment.
// Never import this from client code: the map holds prompt deltas and employer names
// that must not ship in the bundle.
import { readFileSync } from "node:fs";
import { parseCompanyPresetMap, type CompanyPresetMap } from "../src/lib/role-context.js";
import { isProductionRuntime } from "./config.js";

const EMPTY: CompanyPresetMap = Object.freeze(Object.create(null)) as CompanyPresetMap;

let cache: CompanyPresetMap | null = null;
let loggedFailure = false;

function readRawSource(): string | null {
  const inline = process.env.ROLE_CONTEXT_PRESETS;
  if (inline && inline.trim().length > 0) return inline;
  const file = process.env.ROLE_CONTEXT_PRESETS_FILE;
  if (file && file.trim().length > 0) return readFileSync(file.trim(), "utf8");
  return null;
}

function loadUncached(): CompanyPresetMap {
  const raw = readRawSource();
  if (raw === null) return EMPTY;
  return parseCompanyPresetMap(JSON.parse(raw));
}

// Source order: ROLE_CONTEXT_PRESETS (raw JSON), then ROLE_CONTEXT_PRESETS_FILE (path),
// else an empty map. Cached per process. A parse failure throws outside production;
// in production it logs once and yields an empty map, because employer context is
// optional and the site must stay up and neutral without it.
export function loadCompanyPresets(): CompanyPresetMap {
  if (cache) return cache;
  try {
    cache = loadUncached();
  } catch (err) {
    if (!isProductionRuntime()) throw err;
    if (!loggedFailure) {
      loggedFailure = true;
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("Role-context presets unavailable; serving neutral context:", message);
    }
    cache = EMPTY;
  }
  return cache;
}

export function resetCompanyPresetCache(): void {
  cache = null;
  loggedFailure = false;
}
