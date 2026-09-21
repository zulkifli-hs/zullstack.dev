import {
  ANALYTICS_ENDPOINT,
  type AnalyticsEventName,
  type AnalyticsPayload,
} from "@/lib/analytics/types";

/*
 * No `"use client"` here, on purpose. This module holds functions, not
 * components, and the directive would turn each export into a client reference
 * for any Server Component that imported it — uncallable, failing at render
 * time with "Attempted to call … from the server", and invisible to the build.
 * Every function below already guards on `window`/`navigator`, so without the
 * directive a server-side call is simply a no-op.
 */

/**
 * Whether collection is on for this build.
 *
 * Set once by the tracker from a value the server resolved at prerender time,
 * so `trackEvent` callers do not each need the flag threaded to them. A module
 * variable is safe here: the value is fixed for the lifetime of the page.
 */
let enabled = false;

export function setTrackingEnabled(value: boolean) {
  enabled = value;
}

/**
 * Fire-and-forget send.
 *
 * `sendBeacon` first, because it is the only transport the browser promises to
 * deliver from a page that is being torn down — which is exactly when the
 * leave-beacon carrying duration and scroll depth is sent. `keepalive` fetch is
 * the fallback for the handful of cases where the beacon queue refuses.
 */
export function send(payload: AnalyticsPayload) {
  if (!enabled || typeof navigator === "undefined") return;

  const body = JSON.stringify(payload);

  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) return;
  } catch {
    // Fall through to fetch.
  }

  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never surface an error to a visitor.
  });
}

/**
 * Record a custom event.
 *
 * `name` is a closed union — see `ANALYTICS_EVENTS` — so a typo is a build
 * error rather than a phantom row in the goals table.
 */
export function trackEvent(
  name: AnalyticsEventName,
  props?: Record<string, string | number | boolean>,
) {
  if (typeof window === "undefined") return;

  send({
    type: "event",
    name,
    path: stripLocale(window.location.pathname),
    locale: localeOf(window.location.pathname),
    props,
  });
}

/** `/en/projects` → `/projects`. The locale is its own dimension. */
export function stripLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|id)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

export function localeOf(pathname: string): string {
  return pathname.match(/^\/(en|id)(?=\/|$)/)?.[1] ?? "";
}
