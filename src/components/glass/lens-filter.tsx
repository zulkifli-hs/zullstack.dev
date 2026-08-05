export const LENS_FILTER_ID = "zl-lens";

/**
 * Edge-concentrated refraction for `backdrop-filter`.
 *
 * Real glass is a lens, not a scatter: it is optically flat in the middle and
 * steeply curved at the rim (a meniscus), so displacement should be ~0 at the
 * centre and rise sharply at the edges. That is what this map encodes.
 *
 * `feDisplacementMap` reads x-shift from R and y-shift from G, with 128 meaning
 * "no shift". The map is built by drawing a red horizontal ramp, then screening
 * a green vertical ramp over it — screen leaves each channel untouched by the
 * other (r,0,0) + (0,g,0) = (r,g,0) — which gives both axes in one image.
 * The flat 128 plateau between 22% and 78% is the optically flat centre.
 *
 * CHROMIUM ONLY. `backdrop-filter: url()` is unimplemented in Safari
 * (WebKit bug 245510, patches proposed but unmerged) and Firefox can fail to
 * paint the element entirely rather than ignoring the filter — hence the
 * `@supports` gate on `.glass-lens` rather than applying this unconditionally.
 * Everyone else gets blur + rim + sheen, which still reads as premium.
 *
 * Rendered once per document. Each additional filter instance reserves its own
 * GPU and compositing resources, so this is deliberately a shared singleton.
 */
export function LensFilter() {
  const displacementMap = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>`,
    `<defs>`,
    `<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>`,
    `<stop offset='0' stop-color='rgb(0,0,0)'/>`,
    `<stop offset='0.22' stop-color='rgb(128,0,0)'/>`,
    `<stop offset='0.78' stop-color='rgb(128,0,0)'/>`,
    `<stop offset='1' stop-color='rgb(255,0,0)'/>`,
    `</linearGradient>`,
    `<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>`,
    `<stop offset='0' stop-color='rgb(0,0,0)'/>`,
    `<stop offset='0.22' stop-color='rgb(0,128,0)'/>`,
    `<stop offset='0.78' stop-color='rgb(0,128,0)'/>`,
    `<stop offset='1' stop-color='rgb(0,255,0)'/>`,
    `</linearGradient>`,
    `</defs>`,
    `<rect width='100' height='100' fill='url(%23x)'/>`,
    `<rect width='100' height='100' fill='url(%23y)' style='mix-blend-mode:screen'/>`,
    `</svg>`,
  ].join("");

  const href = `data:image/svg+xml,${displacementMap.replace(/#/g, "%23").replace(/"/g, "'")}`;

  return (
    <svg aria-hidden width="0" height="0" className="absolute" style={{ position: "absolute" }}>
      <defs>
        <filter
          id={LENS_FILTER_ID}
          // sRGB rather than the linearRGB default, so displacement magnitudes
          // match the values authored above instead of being gamma-shifted.
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width="100%"
          height="100%"
        >
          <feImage href={href} preserveAspectRatio="none" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="42"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
