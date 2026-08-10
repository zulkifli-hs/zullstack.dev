"use client";

import { useEffect, useRef, useState } from "react";

import { useLens, type LensRequestInput } from "@/lib/glass/lens-registry";

/**
 * Upgrades its parent surface from the static tier lens to one generated at the
 * element's real size.
 *
 * Why this is a child rather than a prop on a client `GlassPanel`: measuring
 * needs the DOM, but `GlassPanel` is a Server Component and every page depends
 * on it staying one. `SpecularLayer` already solved this by reaching for
 * `parentElement`, so this follows the same shape — the client boundary is a
 * `display: none` span, and the panel and its content stay on the server.
 *
 * The bug this fixes: a displacement map does not scale. `feImage
 * preserveAspectRatio="none"` stretches the tier map to whatever box it lands
 * on, so the `card` map authored at 360x220 rendered on a 1104x143 article row
 * with a bevel band roughly three times too wide horizontally. Measuring first
 * is the only way the bevel stays the width it claims to be.
 */
export function LensAuto() {
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<LensRequestInput | null>(null);

  useEffect(() => {
    const surface = ref.current?.parentElement;
    if (!surface) return;

    let inView = false;
    let measured: LensRequestInput | null = null;

    const push = () => {
      // Generation is deferred until the surface is near the viewport: the cost
      // is per distinct geometry, and a listing page below the fold has plenty.
      if (inView && measured) setBox(measured);
    };

    const measure = () => {
      const rect = surface.getBoundingClientRect();
      const style = getComputedStyle(surface);
      const raw = style.borderTopLeftRadius;
      // A pill writes 9999px and a percentage radius resolves against the box;
      // either way the registry clamps to half the shorter side.
      const radius = raw.endsWith("%")
        ? (parseFloat(raw) / 100) * Math.min(rect.width, rect.height)
        : parseFloat(raw) || 0;

      measured = { width: rect.width, height: rect.height, radius };
      push();
    };

    const resize = new ResizeObserver(measure);
    resize.observe(surface);

    const intersect = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        push();
      },
      { rootMargin: "200px" },
    );
    intersect.observe(surface);

    return () => {
      resize.disconnect();
      intersect.disconnect();
    };
  }, []);

  const entry = useLens(box);

  useEffect(() => {
    const surface = ref.current?.parentElement;
    if (!surface) return;

    // `--tier-lens` is what the `glass-lens` utility already reads, so the
    // upgrade is a single custom property and needs no new CSS. Removing it
    // falls back to the tier's own map rather than to nothing.
    if (entry) surface.style.setProperty("--tier-lens", `url(#${entry.filterId})`);
    else surface.style.removeProperty("--tier-lens");

    return () => {
      surface.style.removeProperty("--tier-lens");
    };
  }, [entry]);

  return <span ref={ref} aria-hidden hidden />;
}
