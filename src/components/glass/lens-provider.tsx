"use client";

import { useSyncExternalStore } from "react";

import { noEntries, readyEntries, subscribeAll, type LensEntry } from "@/lib/glass/lens-registry";

/**
 * The `<defs>` pool for runtime-generated lenses.
 *
 * Mounted once per document. Filters are keyed by *geometry*, not by element,
 * so a three-column grid of identically-sized cards contributes one `<filter>`
 * here, not nine — the same collapse that makes generating them affordable at
 * all.
 *
 * The static tier filters in `LensFilter` stay mounted alongside this. They are
 * what every surface uses until its own map resolves, and what it keeps using
 * if the worker never arrives.
 */
export function LensProvider() {
  const entries = useSyncExternalStore(subscribeAll, readyEntries, noEntries);

  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {entries.map((entry) => (
          <RuntimeFilter key={entry.key} entry={entry} />
        ))}
      </defs>
    </svg>
  );
}

function RuntimeFilter({ entry }: { entry: LensEntry }) {
  const { filterId, displacement, specular, scale, pad, width, height } = entry;
  if (!displacement || !specular || scale == null || pad == null || !width || !height) return null;

  // The map is authored at the element's size plus `pad` on every side, because
  // edge refraction samples the backdrop from outside the element. Expressing
  // the region as a percentage of the element box keeps that padding correct
  // even though the element is not pixel-identical to the quantized map.
  const inner = { w: width - pad * 2, h: height - pad * 2 };
  const pct = (value: number, of: number) => `${((value / of) * 100).toFixed(4)}%`;

  return (
    <filter
      id={filterId}
      colorInterpolationFilters="sRGB"
      x={pct(-pad, inner.w)}
      y={pct(-pad, inner.h)}
      width={pct(width, inner.w)}
      height={pct(height, inner.h)}
    >
      <feImage href={displacement} preserveAspectRatio="none" result="displacementMap" />
      <feDisplacementMap
        in="SourceGraphic"
        in2="displacementMap"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="refracted"
      />
      <feImage href={specular} preserveAspectRatio="none" result="specular" />
      <feBlend in="refracted" in2="specular" mode="screen" />
    </filter>
  );
}
