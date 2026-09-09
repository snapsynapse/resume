import { composeRoleContext, detectRoleSelection } from "./role-context";

// Compatibility wrapper for older tests/imports. New code should use role-context.
// Client-side there is no company map, so this resolves target context only; the
// employer-aware label comes from /api/role-context.
export function detectRoleContext(): string | null {
  return composeRoleContext(detectRoleSelection())?.label ?? null;
}
