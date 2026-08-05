import { LENS_MAPS, type LensTier } from "@/lib/glass/lens-maps.generated";

export const lensFilterId = (tier: LensTier) => `zl-lens-${tier}`;

/**
 * The SVG filters that turn glass from a blur into a lens.
 *
 * Each filter is a four-primitive chain:
 *
 *   feImage           the displacement map
 *   feDisplacementMap bend the backdrop — R drives x, G drives y, 128 = no shift
 *   feImage           the specular map (rim light)
 *   feBlend screen    add the highlight on top of the refracted backdrop
 *
 * The filter region is expanded by `pad` on every side. Edge refraction samples
 * the backdrop from *outside* the element, and without the padding those samples
 * fall outside the region and return transparent black — a dark fringe exactly
 * where the bend should be strongest.
 *
 * CHROMIUM ONLY. Safari has never shipped `backdrop-filter: url()`
 * (WebKit 245510) and Firefox can satisfy the `@supports` test then fail to
 * paint, which is why `.glass-lens` carries a Gecko-only negative probe.
 * Everyone else gets blur + rim + sheen, which still reads as premium.
 *
 * Rendered once per document; each filter instance reserves its own GPU and
 * compositing resources, so only the tiers actually used should be mounted.
 */
export function LensFilter({ tiers }: { tiers?: LensTier[] }) {
  const ids = tiers ?? (Object.keys(LENS_MAPS) as LensTier[]);

  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {ids.map((tier) => {
          const map = LENS_MAPS[tier];
          // Region expressed as a percentage of the element box, so the padding
          // survives the element being a different size than the map.
          const inner = { w: map.width - map.pad * 2, h: map.height - map.pad * 2 };
          const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(4)}%`;

          return (
            <filter
              key={tier}
              id={lensFilterId(tier)}
              colorInterpolationFilters="sRGB"
              x={pct(-map.pad, inner.w)}
              y={pct(-map.pad, inner.h)}
              width={pct(map.width, inner.w)}
              height={pct(map.height, inner.h)}
            >
              <feImage
                href={map.displacement}
                preserveAspectRatio="none"
                result="displacementMap"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="displacementMap"
                scale={map.scale}
                xChannelSelector="R"
                yChannelSelector="G"
                result="refracted"
              />
              <feImage href={map.specular} preserveAspectRatio="none" result="specular" />
              <feBlend in="refracted" in2="specular" mode="screen" />
            </filter>
          );
        })}
      </defs>
    </svg>
  );
}
