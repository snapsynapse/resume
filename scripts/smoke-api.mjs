// Live API smoke test. Cheap liveness + shape checks against a deployed target.
// Local Vite cannot serve the /api functions, so this only runs against a
// Vercel deployment with ANTHROPIC_API_KEY configured. Point it at one with
// EVAL_BASE_URL. With no reachable endpoint it skips (exit 0) like eval-prompts.
const baseUrl = (process.env.EVAL_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

let failures = 0;
const fail = (name, detail) => {
  failures += 1;
  console.error(`FAIL ${name}`);
  if (detail) console.error(`- ${detail}`);
};
const pass = (name) => console.log(`PASS ${name}`);

async function getStatus(path) {
  try {
    const res = await fetch(`${baseUrl}${path}`, { method: "GET" });
    return res.status;
  } catch {
    return null;
  }
}

// A deployed function answers GET with 405 (method not allowed). A null means
// nothing is listening, which is the local-dev / no-preview case: skip.
const chatGet = await getStatus("/api/chat");
if (chatGet === null) {
  console.log(`API smoke skipped: no endpoint at ${baseUrl}.`);
  console.log("Run with EVAL_BASE_URL pointing at a Vercel deployment with ANTHROPIC_API_KEY configured.");
  process.exit(0);
}

if (chatGet === 405) pass("GET /api/chat rejects with 405");
else fail("GET /api/chat rejects with 405", `got ${chatGet}`);

const fitGet = await getStatus("/api/analyze-fit");
if (fitGet === 405) pass("GET /api/analyze-fit rejects with 405");
else fail("GET /api/analyze-fit rejects with 405", `got ${fitGet}`);

// GET /api/role-context: liveness, neutral fallback, and the two invariants that matter
// publicly. A missing selection resolves to null; an unknown company key behaves exactly like
// a typo (target-only context) and no response ever carries promptContext.
try {
  const empty = await fetch(`${baseUrl}/api/role-context`);
  const emptyBody = await empty.text();
  if (empty.status !== 200 || emptyBody.trim() !== "null") {
    fail("GET /api/role-context with no selection returns 200 null", `HTTP ${empty.status}: ${emptyBody.slice(0, 120)}`);
  } else pass("GET /api/role-context with no selection returns 200 null");

  const unknown = await fetch(`${baseUrl}/api/role-context?company=notareal&target=content-ops`);
  const unknownBody = await unknown.json();
  if (unknown.status !== 200 || unknownBody?.targetLabel !== "Content Operations") {
    fail("GET /api/role-context with unknown company falls back to target-only context", `HTTP ${unknown.status}`);
  } else if (unknownBody.companyLabel !== undefined || "promptContext" in unknownBody) {
    fail("GET /api/role-context never returns employer context for an unknown key or a prompt delta");
  } else pass("GET /api/role-context unknown key equals target-only, no promptContext");

  const post = await fetch(`${baseUrl}/api/role-context`, { method: "POST" });
  if (post.status === 405) pass("POST /api/role-context rejects with 405");
  else fail("POST /api/role-context rejects with 405", `got ${post.status}`);
} catch (error) {
  fail("GET /api/role-context reachable", error.message);
}

// POST /api/chat returns a non-empty assistant answer.
try {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "In one sentence, who is Sam?" }] }),
  });
  const body = await res.text();
  if (!res.ok) fail("POST /api/chat returns 200", `HTTP ${res.status}: ${body.slice(0, 200)}`);
  else if (body.trim().length === 0) fail("POST /api/chat returns 200", "empty body");
  else pass("POST /api/chat returns a non-empty answer");
} catch (error) {
  fail("POST /api/chat returns 200", error.message);
}

// POST /api/analyze-fit returns well-formed JSON with a valid verdict enum.
try {
  const res = await fetch(`${baseUrl}/api/analyze-fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription:
        "Content operations role: own content portfolio health, lifecycle governance, discoverability, reuse, AI-assisted workflow quality, scalable handoffs, and measurement of whether customer education content changes capability.",
      }),
    });
  const body = await res.text();
  if (!res.ok) {
    fail("POST /api/analyze-fit returns 200", `HTTP ${res.status}: ${body.slice(0, 200)}`);
  } else {
    const parsed = JSON.parse(body);
    if (!["strong", "moderate", "weak"].includes(parsed.verdict)) {
      fail("POST /api/analyze-fit returns a valid verdict", `verdict=${JSON.stringify(parsed.verdict)}`);
    } else if (!Array.isArray(parsed.matches) || !Array.isArray(parsed.gaps)) {
      fail("POST /api/analyze-fit returns matches and gaps arrays");
    } else {
      pass("POST /api/analyze-fit returns well-formed JSON");
    }
  }
} catch (error) {
  fail("POST /api/analyze-fit returns 200", error.message);
}

if (failures > 0) process.exit(1);
console.log("API smoke passed.");
