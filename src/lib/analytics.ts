import type { PostHog } from "posthog-js";

type AnalyticsEvent =
  | "ai_chat_opened"
  | "ai_chat_message_sent"
  | "ai_chat_response_received"
  | "ai_chat_response_failed"
  | "fit_assessment_started"
  | "fit_assessment_completed"
  | "fit_assessment_failed"
  | "booking_cta_clicked"
  | "email_clicked"
  | "footer_link_clicked"
  | "nav_section_clicked"
  | "experience_context_toggled";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
const enabled =
  Boolean(key) &&
  typeof window !== "undefined" &&
  !import.meta.env.SSR &&
  import.meta.env.MODE !== "test";

let client: PostHog | null = null;
let clientPromise: Promise<PostHog | null> | null = null;

export const initAnalytics = () => {
  if (!enabled || clientPromise) return;

  clientPromise = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      cookieless_mode: "always",
      person_profiles: "identified_only",
      respect_dnt: true,
    });
    client = posthog;
    return posthog;
  });
};

export const track = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
  if (!enabled) return;
  if (client) {
    client.capture(event, properties);
    return;
  }
  initAnalytics();
  clientPromise?.then((posthog) => posthog?.capture(event, properties));
};
