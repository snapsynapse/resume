import {
  composeRoleContext,
  parseRoleSelection,
  toPublicRoleContext,
} from "../src/lib/role-context.js";
import { boundaryResponse } from "./boundaries.js";
import { loadCompanyPresets } from "./role-context-store.js";
import { withVercelAdapter } from "./vercel-adapter.js";

// GET /api/role-context?company=<key>&target=<target>  (`for` and `role` are aliases)
// Returns the public-safe role context for one selection, or null when the selection
// resolves to nothing. An unknown company key produces the same body as no company
// key at all, so the endpoint cannot be used to enumerate which employers exist.
// promptContext is stripped server-side and never reaches the client.
export async function handleRoleContextRequest(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return boundaryResponse({
      status: 405,
      error: "method_not_allowed",
      detail: "Use GET to read role context.",
      why: "/api/role-context is a read-only lookup keyed by the URL query string.",
      headers: { Allow: "GET" },
    });
  }

  const search = new URL(req.url).search;
  const selection = parseRoleSelection(search);
  const context = composeRoleContext(selection, loadCompanyPresets());
  const body = context ? toPublicRoleContext(context) : null;

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default withVercelAdapter(handleRoleContextRequest);
