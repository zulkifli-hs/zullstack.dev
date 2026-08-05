"use client";

import { useEffect, useRef } from "react";

/**
 * Pointer-tracked specular highlight.
 *
 * Apple drives Liquid Glass highlights from the gyroscope; the web equivalent
 * that does not require a permission prompt is pointer position. Falls back to
 * the static rest highlight on touch devices, which never fire pointermove.
 *
 * Writes CSS custom properties directly rather than going through React state —
 * this fires on every pointer move, and a re-render per frame would be wasteful.
 */
export function SpecularLayer() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const surface = el?.parentElement;
    if (!el || !surface) return;

    // Respect Reduce Motion: the highlight is an elastic effect, and Apple's own
    // guidance is to disable elastic properties under this setting.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      if (frame) return; // coalesce to one update per animation frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = surface.getBoundingClientRect();
        el.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        el.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    };

    const onLeave = () => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    };

    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      // Same function references as were added — passing a fresh closure here
      // is the classic listener leak.
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      className="glass-sheen pointer-events-none absolute inset-0 z-1 rounded-[inherit] transition-opacity duration-300"
    />
  );
}
