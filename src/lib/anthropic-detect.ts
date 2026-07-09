import { composeRoleContext, detectRoleSelection } from "./role-context";

// Compatibility wrapper for older tests/imports. New code should use role-context.
export function detectRoleContext(): string | null {
  return composeRoleContext(detectRoleSelection())?.label ?? null;
}
