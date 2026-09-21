"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { localeOf, send, setTrackingEnabled, stripLocale, trackEvent } from "@/lib/analytics/track";
import { isTrackablePath } from "@/lib/analytics/types";

/** Extensions counted as a download when a link points at one. */
const DOWNLOAD = /\.(pdf|zip|rar|7z|docx?|xlsx?|pptx?|csv|txt|dmg|pkg|apk|exe|mp3|mp4)$/i;

const MAX_VISIT_MS = 6 * 60 * 60 * 1000;

/**
 * The browser half of analytics.
 *
 * Mounted once, from the locale layout. That placement is load-bearing: the
 * admin area lives outside `[locale]`, so mounting here is what keeps the CMS
 * untracked without a path check that someone could later get wrong.
 *
 * Being a Client Component in a layout does not make any page dynamic — this
 * ships JavaScript, it does not read request state, so every public route stays
 * statically prerendered.
 *
 * `usePathname` comes from `next/navigation`, not from `@/i18n/navigation`. The
 * locale-aware one strips the prefix already, and this needs the raw path to
 * record the locale as its own dimension before stripping it.
 */
export function AnalyticsTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const sentDuration = useRef(-1);

  useEffect(() => {
    setTrackingEnabled(enabled);
  }, [enabled]);

  /* ── Pageview, engagement time and scroll depth ─────────────────────────── */
  useEffect(() => {
    if (!enabled) return;

    const path = stripLocale(pathname);
    if (!isTrackablePath(path)) return;

    const locale = localeOf(pathname);

    /**
     * `since` is when the current *visible* span began, and null while the tab
     * is hidden. Accumulating spans rather than measuring wall-clock is what
     * stops a page left open in a background tab overnight from reporting a
     * fourteen-hour visit and dragging every average with it.
     */
    let visibleMs = 0;
    let since: number | null = document.visibilityState === "visible" ? Date.now() : null;
    let scroll = 0;

    sentDuration.current = -1;

    send({
      type: "pageview",
      path,
      locale,
      title: document.title.slice(0, 200),
      referrer: document.referrer || undefined,
      query: window.location.search || undefined,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    });

    const measureScroll = () => {
      const height = document.documentElement.scrollHeight;
      const depth =
        height <= window.innerHeight
          ? 100
          : Math.round(((window.scrollY + window.innerHeight) / height) * 100);
      scroll = Math.min(100, Math.max(scroll, depth));
    };

    const elapsed = () => visibleMs + (since === null ? 0 : Date.now() - since);

    /**
     * Reported more than once per page on purpose — on every hide, and again
     * when the visit truly ends. The server `$set`s duration and `$max`es
     * scroll depth on the same pageview, so a later report simply corrects an
     * earlier one, and someone who tabs away and comes back is measured for
     * both halves instead of only the first.
     */
    const report = () => {
      const durationMs = Math.min(elapsed(), MAX_VISIT_MS);
      // Nothing new to say. Skips the duplicate write when `pagehide` and the
      // effect cleanup both fire on a real unload.
      if (durationMs === sentDuration.current) return;
      sentDuration.current = durationMs;

      send({ type: "leave", path, locale, durationMs, scrollDepth: scroll });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (since !== null) {
          visibleMs += Date.now() - since;
          since = null;
        }
        report();
      } else if (since === null) {
        since = Date.now();
      }
    };

    measureScroll();
    window.addEventListener("scroll", measureScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    // `pagehide`, never `unload`: `unload` does not fire at all on mobile
    // Safari and disqualifies the page from the back/forward cache everywhere.
    window.addEventListener("pagehide", report);

    return () => {
      window.removeEventListener("scroll", measureScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      // A client-side navigation ends this page's visit as surely as closing
      // the tab does.
      report();
    };
  }, [enabled, pathname]);

  /* ── Outbound links and downloads ───────────────────────────────────────── */
  useEffect(() => {
    if (!enabled) return;

    /**
     * One delegated listener rather than props threaded through every link.
     * Plausible tracks both of these automatically and so does this — the
     * alternative is remembering to annotate each of the dozens of outbound
     * links on the project pages, which is the kind of thing that is complete
     * on the day it ships and never again.
     */
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor?.href) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      if (anchor.hasAttribute("download") || DOWNLOAD.test(url.pathname)) {
        trackEvent("download", { url: url.href });
        return;
      }

      if (url.host !== window.location.host) {
        trackEvent("outbound", { url: url.href, host: url.host });
      }
    };

    // Capture phase: a handler on the link itself may stop propagation, and a
    // click that was not recorded is indistinguishable from one that never
    // happened.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [enabled]);

  return null;
}
