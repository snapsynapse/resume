import type { PostHog, Properties } from "posthog-js/dist/module.no-external";

type AnalyticsEvent =
  | "ai_chat_opened"
  | "ai_chat_message_sent"
  | "ai_chat_response_received"
  | "ai_chat_response_failed"
  | "fit_assessment_started"
  | "fit_assessment_completed"
  | "fit_assessment_failed"
  | "jd_review_panel_opened"
  | "jd_review_skipped"
  | "jd_review_completed"
  | "decision_brief_copied"
  | "booking_cta_clicked"
  | "email_clicked"
  | "footer_link_clicked"
  | "nav_section_clicked"
  | "experience_context_toggled"
  | "ai_usage_dashboard_clicked";

const EVENT_PROPERTY_KEYS = [
  "source", "lengthBucket", "mode", "status", "verdict", "flagCount", "edited",
  "block", "fitVerdict", "section", "expanded", "link",
] as const;
const allowedEventProperties = new Set<string>(EVENT_PROPERTY_KEYS);
type AnalyticsProperties = Partial<Record<(typeof EVENT_PROPERTY_KEYS)[number], string | number | boolean | null>>;
type TrackOptions = {
  immediate?: boolean;
};

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
const enabled =
  Boolean(key) &&
  typeof window !== "undefined" &&
  !import.meta.env.SSR &&
  import.meta.env.MODE !== "test";

let client: PostHog | null = null;
let clientPromise: Promise<PostHog | null> | null = null;
let warnedMissingConfig = false;

const analyticsDebugEnabled = () => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("analytics_debug");
};

const warnIfMisconfigured = () => {
  if (
    warnedMissingConfig ||
    import.meta.env.PROD ||
    import.meta.env.MODE === "test" ||
    key
  ) {
    return;
  }

  warnedMissingConfig = true;
  console.warn(
    "PostHog analytics disabled: VITE_POSTHOG_KEY is not set for this build.",
  );
};

// PostHog stamps the page URL and referrer onto every event. Tailored links carry
// `?for=` and `?target=` params that identify which employer preset a reader used, and
// those must never leave the browser. Strip query string and hash from every URL-shaped
// property before it is queued, so only the path survives.
const URL_PROPERTY_KEYS = [
  "$current_url",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$pathname",
] as const;

export const stripUrlParams = (value: unknown): unknown => {
  if (typeof value !== "string" || value === "" || value === "$direct") return value;
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
};

export const sanitizeAnalyticsProperties = (properties: Properties): Properties => {
  // Custom application properties are allowlisted. In particular, context labels,
  // employer selectors, and submitted text cannot ride alongside coarse metadata.
  // PostHog's own $ properties retain the URL sanitization below.
  const sanitized: Properties = Object.fromEntries(Object.entries(properties).filter(
    ([name]) => name.startsWith("$") || allowedEventProperties.has(name),
  ));
  for (const key of URL_PROPERTY_KEYS) {
    if (key in sanitized) sanitized[key] = stripUrlParams(sanitized[key]);
  }
  // `$set` / `$set_once` carry the initial URL and referrer on person properties.
  for (const bucket of ["$set", "$set_once"] as const) {
    const nested = sanitized[bucket];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      sanitized[bucket] = sanitizeAnalyticsProperties(nested as Properties);
    }
  }
  return sanitized;
};

export const initAnalytics = () => {
  warnIfMisconfigured();
  if (!enabled || clientPromise) return;

  clientPromise = import("posthog-js/dist/module.no-external").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      cookieless_mode: "always",
      person_profiles: "identified_only",
      respect_dnt: true,
      sanitize_properties: sanitizeAnalyticsProperties,
      debug: analyticsDebugEnabled(),
    });
    client = posthog;
    return posthog;
  });
};

export const track = (
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
  options: TrackOptions = {},
) => {
  warnIfMisconfigured();
  if (!enabled) return;
  const captureOptions = options.immediate
    ? { send_instantly: true, transport: "sendBeacon" as const }
    : undefined;
  const safeProperties = sanitizeAnalyticsProperties(properties ?? {});

  if (client) {
    client.capture(event, safeProperties, captureOptions);
    return;
  }
  initAnalytics();
  clientPromise?.then((posthog) => posthog?.capture(event, safeProperties, captureOptions));
};
