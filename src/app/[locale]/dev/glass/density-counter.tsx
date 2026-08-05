"use client";

import { useEffect, useState } from "react";

/**
 * Counts how many real blur surfaces are actually in the viewport.
 *
 * The budget is ~3: each `backdrop-filter` forces the compositor to snapshot
 * the backdrop and re-run a separable blur, and the documented cost of
 * overshooting is a 15–30% frame-rate drop on mid-range mobile. The budget is
 * easy to state and easy to breach by accident, so it is measured rather than
 * trusted.
 *
 * Counts only elements whose blur is genuinely active — the cascade guard and
 * the degradation modes both switch `backdrop-filter` off via tokens, and a
 * suppressed surface costs nothing.
 */
export function DensityCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const visible = new Set<Element>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }

        let active = 0;
        for (const el of visible) {
          const filter = getComputedStyle(el).backdropFilter;
          if (filter && filter !== "none") active += 1;
        }
        setCount(active);
      },
      { threshold: 0.01 },
    );

    for (const el of document.querySelectorAll('[data-surface="glass"], [data-surface="lens"]')) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const over = count > 3;

  return (
    <div
      className={`fixed right-4 bottom-4 z-100 rounded-full border px-3 py-1.5 font-mono text-xs ${
        over ? "border-destructive text-destructive" : "border-hairline text-muted-foreground"
      }`}
      role="status"
    >
      {count} blur {count === 1 ? "surface" : "surfaces"} {over ? "— over budget" : "in viewport"}
    </div>
  );
}
