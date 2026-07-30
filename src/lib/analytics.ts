import type { PostHog } from "posthog-js";

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

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
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

  if (client) {
    client.capture(event, properties, captureOptions);
    return;
  }
  initAnalytics();
  clientPromise?.then((posthog) => posthog?.capture(event, properties, captureOptions));
};
