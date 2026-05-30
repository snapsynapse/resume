import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

const siteUrl = "https://resume.sam-rogers.com";
const routes = ["/", "/about/", "/experience/", "/fit-assessment/", "/portfolio/", "/contact/"];
const publicFiles = [
  "public/llms.txt",
  "public/llms-full.txt",
  "public/agents.json",
  "public/api-manifest.json",
  "public/resume.txt",
  "public/changelog.txt",
  "public/sitemap.xml",
  "public/.well-known/security.txt",
];

const failures = [];

function fail(message) {
  failures.push(message);
}

async function text(path) {
  return readFile(path, "utf8");
}

function routeFile(route) {
  return route === "/" ? "dist/index.html" : `dist${route}index.html`;
}

function absoluteUrl(route) {
  return route === "/" ? `${siteUrl}/` : `${siteUrl}${route}`;
}

function extractJsonLd(html, file) {
  const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (matches.length === 0) {
    fail(`${file}: missing JSON-LD script`);
    return [];
  }
  return matches.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      fail(`${file}: JSON-LD script ${index + 1} does not parse: ${error.message}`);
      return null;
    }
  }).filter(Boolean);
}

for (const file of publicFiles) {
  if (!existsSync(file)) {
    fail(`${file}: missing`);
    continue;
  }
  const info = await stat(file);
  if (info.size === 0) {
    fail(`${file}: empty`);
  }
}

for (const file of ["public/agents.json", "public/api-manifest.json"]) {
  try {
    JSON.parse(await text(file));
  } catch (error) {
    fail(`${file}: invalid JSON: ${error.message}`);
  }
}

const apiManifest = JSON.parse(await text("public/api-manifest.json"));
if (apiManifest.schema_version !== "1.1") {
  fail("api-manifest.json: schema_version must be 1.1");
}

const expectedRateLimits = new Map([
  [
    "/api/chat",
    [
      { window: "60 s", max_requests: 5 },
      { window: "1 h", max_requests: 50 },
    ],
  ],
  ["/api/analyze-fit", [{ window: "1 h", max_requests: 10 }]],
]);

for (const endpoint of apiManifest.endpoints ?? []) {
  const expected = expectedRateLimits.get(endpoint.path);
  if (!expected) continue;
  const rateLimit = endpoint.rate_limit;
  if (!rateLimit) {
    fail(`api-manifest.json: ${endpoint.path} missing rate_limit`);
    continue;
  }
  if (rateLimit.enabled !== "conditional") {
    fail(`api-manifest.json: ${endpoint.path} rate_limit.enabled must be conditional`);
  }
  if (rateLimit.provider !== "Upstash Redis") {
    fail(`api-manifest.json: ${endpoint.path} rate_limit.provider must be Upstash Redis`);
  }
  for (const envName of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) {
    if (!rateLimit.required_env?.includes(envName)) {
      fail(`api-manifest.json: ${endpoint.path} missing required env ${envName}`);
    }
  }
  if (rateLimit.missing_config_behavior !== "fail_open_local_dev_fail_closed_production") {
    fail(`api-manifest.json: ${endpoint.path} must disclose fail_open_local_dev_fail_closed_production`);
  }
  const actualLimits = JSON.stringify(rateLimit.limits ?? []);
  if (actualLimits !== JSON.stringify(expected)) {
    fail(`api-manifest.json: ${endpoint.path} rate limits do not match expected values`);
  }
}

const vercelConfig = JSON.parse(await text("vercel.json"));
const headersBySource = new Map((vercelConfig.headers ?? []).map((entry) => [entry.source, entry.headers ?? []]));
const globalHeaderKeys = new Set(headersBySource.get("/(.*)")?.map((header) => header.key));
for (const key of [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
]) {
  if (!globalHeaderKeys.has(key)) {
    fail(`vercel.json: missing global security header ${key}`);
  }
}

const csp = headersBySource.get("/(.*)")?.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
for (const directive of [
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://us.i.posthog.com",
]) {
  if (!csp.includes(directive)) {
    fail(`vercel.json: Content-Security-Policy missing ${directive}`);
  }
}

const apiHeaders = headersBySource.get("/api/:path*") ?? [];
const apiCache = apiHeaders.find((header) => header.key === "Cache-Control")?.value;
if (apiCache !== "no-store") {
  fail("vercel.json: /api/:path* Cache-Control must be no-store");
}
if (!apiHeaders.some((header) => header.key === "X-Content-Type-Options" && header.value === "nosniff")) {
  fail("vercel.json: /api/:path* missing X-Content-Type-Options nosniff");
}

for (const file of ["public/.DS_Store", "dist/.DS_Store"]) {
  if (existsSync(file)) {
    fail(`${file}: must not exist in public or generated build output`);
  }
}

const sitemap = await text("public/sitemap.xml");
for (const route of routes) {
  const url = absoluteUrl(route);
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    fail(`sitemap.xml: missing ${url}`);
  }
  if (!sitemap.includes("<lastmod>2026-05-12</lastmod>")) {
    fail("sitemap.xml: missing lastmod values");
    break;
  }
}

for (const route of routes) {
  const file = routeFile(route);
  if (!existsSync(file)) {
    fail(`${file}: missing generated route`);
    continue;
  }
  const html = await text(file);
  const canonical = absoluteUrl(route);
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
    fail(`${file}: missing canonical ${canonical}`);
  }
  if (!html.includes('<meta name="description"')) {
    fail(`${file}: missing meta description`);
  }
  if (!html.includes('property="og:image"')) {
    fail(`${file}: missing OpenGraph image`);
  }
  extractJsonLd(html, file);
}

const rootHtml = await text("dist/index.html");
for (const required of [
  "Sam Rogers",
  "PAICE.work PBC",
  "Snap Synapse LLC",
  "mailto:sam@sam-rogers.com",
  "/about/",
  "/portfolio/",
]) {
  if (!rootHtml.includes(required)) {
    fail(`dist/index.html: missing no-JS fallback content ${required}`);
  }
}

const urlPolicyFiles = [
  "index.html",
  "public/llms.txt",
  "public/llms-full.txt",
  "public/agents.json",
  "public/api-manifest.json",
  "public/resume.txt",
  "public/changelog.txt",
  "scripts/generate-static-html.mjs",
];
for (const file of urlPolicyFiles) {
  const content = await text(file);
  if (content.includes("http://")) {
    fail(`${file}: contains http://`);
  }
  if (content.includes("https://www.")) {
    fail(`${file}: contains https://www.`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Metadata validation passed.");
