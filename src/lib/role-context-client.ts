import { useEffect, useState } from "react";
import {
  composeRoleContext,
  detectRoleSelection,
  type ActiveRoleContext,
  type RoleSelection,
} from "@/lib/role-context";

// The browser only ever receives the public-safe subset of a role context: everything the
// page renders, minus the server-side prompt context. Structurally identical to the
// `PublicRoleContext` the endpoint returns, declared here via Omit so this module compiles
// against the client-side type regardless of what role-context.ts exports.
export type PublicRoleContext = Omit<ActiveRoleContext, "promptContext">;

export const ROLE_CONTEXT_ENDPOINT = "/api/role-context";

export function hasRoleSelection(selection: RoleSelection): boolean {
  return Boolean(selection.target || selection.company);
}

function buildRoleContextUrl(selection: RoleSelection): string {
  const params = new URLSearchParams();
  // The wire parameter is `company`, the canonical link parameter (`for` is an alias).
  if (selection.company) params.set("company", selection.company);
  if (selection.target) params.set("target", selection.target);
  return `${ROLE_CONTEXT_ENDPOINT}?${params.toString()}`;
}

function isPublicRoleContext(value: unknown): value is PublicRoleContext {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.label === "string" && Array.isArray(candidate.suggestedQuestions);
}

/**
 * Fetch the public-safe role context for a selection. Resolves to `null` whenever the
 * page should fall back to target-only context: empty selection, non-200 response,
 * malformed body, network failure, or abort. It never throws.
 */
export async function fetchRoleContext(
  selection: RoleSelection,
  signal?: AbortSignal,
): Promise<PublicRoleContext | null> {
  if (!hasRoleSelection(selection)) return null;
  if (typeof fetch !== "function") return null;

  try {
    const res = await fetch(buildRoleContextUrl(selection), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    if (res.status !== 200) return null;
    const data: unknown = await res.json();
    return isPublicRoleContext(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Role context for the current page. The first render uses whatever the client can compose
 * from the URL alone (target presets ship with the bundle), so there is no flash of neutral
 * content. The effect then asks the server for the employer-specific public subset and
 * replaces the state only when the server returns something.
 */
export interface RoleContextState {
  selection: RoleSelection;
  roleContext: PublicRoleContext | null;
}

export function useRoleContext(): RoleContextState {
  const [selection] = useState<RoleSelection>(() => detectRoleSelection());
  const [roleContext, setRoleContext] = useState<PublicRoleContext | null>(() =>
    composeRoleContext(selection),
  );

  useEffect(() => {
    if (!hasRoleSelection(selection)) return;
    const controller = new AbortController();
    void fetchRoleContext(selection, controller.signal).then((serverContext) => {
      if (serverContext && !controller.signal.aborted) setRoleContext(serverContext);
    });
    return () => controller.abort();
  }, [selection]);

  return { selection, roleContext };
}

/** The current page without its query string or hash, for the "view the neutral version" link. */
export function neutralHref(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}
