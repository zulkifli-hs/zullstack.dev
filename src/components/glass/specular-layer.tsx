"use client";

import { useEffect, useRef } from "react";

/**
 * Pointer-tracked specular highlight and press illumination.
 *
 * Apple drives Liquid Glass highlights from the gyroscope; the web equivalent
 * that needs no permission prompt is pointer position. On press the material
 * "illuminates from within, starting right under your fingertips" — that is
 * `--px`/`--py`/`--press`.
 *
 * Writes CSS custom properties directly rather than going through React state:
 * this fires on every pointer move, and a re-render per frame would be waste.
 */
export function SpecularLayer() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const surface = el?.parentElement;
    if (!el || !surface) return;

    // Respect Reduce Motion: the highlight is an elastic effect, and Apple's
    // guidance is to disable elastic properties under this setting.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const pointTo = (event: PointerEvent, xProp: string, yProp: string) => {
      const rect = surface.getBoundingClientRect();
      el.style.setProperty(xProp, `${((event.clientX - rect.left) / rect.width) * 100}%`);
      el.style.setProperty(yProp, `${((event.clientY - rect.top) / rect.height) * 100}%`);
    };

    const onMove = (event: PointerEvent) => {
      if (frame) return; // coalesce to one update per animation frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        pointTo(event, "--mx", "--my");
      });
    };

    const onDown = (event: PointerEvent) => {
      pointTo(event, "--px", "--py");
      el.style.setProperty("--press", "1");
    };

    const endPress = () => el.style.setProperty("--press", "0");

    const onLeave = () => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
      endPress();
    };

    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerdown", onDown);
    surface.addEventListener("pointerup", endPress);
    surface.addEventListener("pointercancel", endPress);
    surface.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      // Same function references as were added — passing fresh closures here
      // is the classic listener leak.
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerdown", onDown);
      surface.removeEventListener("pointerup", endPress);
      surface.removeEventListener("pointercancel", endPress);
      surface.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden
      data-sheen
      className="glass-sheen pointer-events-none absolute inset-0 z-1 rounded-[inherit]"
    />
  );
}
