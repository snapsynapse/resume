import { evaluateRecruiterCase, recruiterEvalCases } from "./recruiter-eval-cases.mjs";

const configuredBaseUrl = process.env.EVAL_BASE_URL;
if (!configuredBaseUrl) {
  console.error("INCONCLUSIVE recruiter eval: EVAL_BASE_URL is required.");
  process.exit(2);
}

let baseUrl;
try {
  baseUrl = new URL(configuredBaseUrl);
  if (!/^https?:$/.test(baseUrl.protocol)) throw new Error("unsupported protocol");
} catch {
  console.error("INCONCLUSIVE recruiter eval: EVAL_BASE_URL must be an HTTP(S) URL.");
  process.exit(2);
}

async function requestCase(testCase) {
  const endpoint = testCase.endpoint === "chat" ? "/api/chat" : "/api/analyze-fit";
  const body =
    testCase.endpoint === "chat"
      ? { messages: [{ role: "user", content: testCase.question }] }
      : { jobDescription: testCase.jobDescription };

  // One request is one observation. Retrying a failed model answer would turn
  // this into a best-of-N check and conceal the behavior a recruiter can see.
  const response = await fetch(new URL(endpoint, baseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`${endpoint} returned HTTP ${response.status}`);
  }

  if (testCase.endpoint === "chat") return response.text();

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    // A reachable fit endpoint that emits a malformed assessment is a product
    // failure, not an unavailable test environment.
    return { __invalidResponse: text };
  }
}

let failures = 0;

for (const testCase of recruiterEvalCases) {
  let output;
  try {
    output = await requestCase(testCase);
  } catch (error) {
    console.error(`INCONCLUSIVE ${testCase.name}: ${error.message}`);
    // Stop immediately. A missing/rate-limited endpoint cannot produce a
    // complete behavioral result, and further calls would only add load.
    process.exit(2);
  }

  const failedChecks = evaluateRecruiterCase(testCase, output);
  if (failedChecks.length === 0) {
    console.log(`PASS ${testCase.name}`);
    continue;
  }

  failures += 1;
  console.error(`FAIL ${testCase.name}`);
  for (const label of failedChecks) console.error(`- ${label}`);
  console.error(typeof output === "string" ? output : JSON.stringify(output, null, 2));
}

if (failures > 0) process.exit(1);
