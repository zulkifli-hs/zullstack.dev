"use client";

import { useEffect, useState } from "react";

/** Warn past this share of the viewport covered by live backdrop-filters. */
const AREA_BUDGET = 0.55;

/**
 * Measures how much of the viewport is under a live backdrop-filter.
 *
 * This used to count surfaces and warn above three. That budget was inherited
 * from a design where glass was reserved for one or two hero panels, and it
 * became a lie the moment content cards became real glass — a listing page now
 * renders six to ten blur surfaces *by design*.
 *
 * Area is the honest metric anyway. Each `backdrop-filter` makes the compositor
 * snapshot the region behind the element and re-run a separable blur over it, so
 * the cost tracks pixels re-sampled, not elements. Nine small cards covering a
 * third of the screen are cheaper than one full-bleed sticky header.
 *
 * Only genuinely active surfaces count: the cascade guard and all seven
 * degradation modes switch `backdrop-filter` off via tokens, and a suppressed
 * surface costs nothing.
 */
export function DensityCounter() {
  const [{ count, ratio }, setStats] = useState({ count: 0, ratio: 0 });

  useEffect(() => {
    const visible = new Set<Element>();

    const measure = () => {
      const viewport = window.innerWidth * window.innerHeight;
      let blurred = 0;
      let active = 0;

      for (const el of visible) {
        if (getComputedStyle(el).backdropFilter === "none") continue;
        active += 1;

        // Clipped to the viewport — an off-screen half of a card is not
        // composited, so counting its full box would overstate the cost.
        const r = el.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
        const h = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
        blurred += w * h;
      }

      setStats({ count: active, ratio: viewport ? blurred / viewport : 0 });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        measure();
      },
      { threshold: 0.01 },
    );

    for (const el of document.querySelectorAll('[data-surface="glass"], [data-surface="lens"]')) {
      observer.observe(el);
    }

    // Surfaces partly on screen change their contribution as you scroll without
    // ever crossing the intersection threshold, so area has to be re-measured.
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const over = ratio > AREA_BUDGET;

  return (
    <div
      className={`border-hairline fixed right-4 bottom-4 z-100 rounded-full border px-3 py-1.5 font-mono text-xs ${
        over ? "border-destructive text-destructive" : "text-muted-foreground"
      }`}
      role="status"
    >
      {count} blur {count === 1 ? "surface" : "surfaces"} · {Math.round(ratio * 100)}% of viewport
      {over && " — over budget"}
    </div>
  );
}
