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
