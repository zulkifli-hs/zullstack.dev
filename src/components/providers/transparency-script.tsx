import {
  CSS_VAR_BY_PARAM,
  GLASS_STORAGE_KEY,
  RANGES,
  type CssParams,
} from "@/lib/glass/lens-params";

export const TRANSPARENCY_STORAGE_KEY = "zullstack-transparency";

/** `[min, max]` per CSS-half parameter, inlined into the blocking script. */
const CSS_LIMITS = Object.fromEntries(
  (Object.keys(CSS_VAR_BY_PARAM) as (keyof CssParams)[]).map((key) => [
    key,
    [RANGES[key].min, RANGES[key].max],
  ]),
);

/**
 * Applies stored glass preferences before first paint.
 *
 * Two separate settings, for two different reasons:
 *
 *   `data-transparency` exists because Safari does not implement
 *   `prefers-reduced-transparency` at all, and macOS/iOS users who enable
 *   "Reduce Transparency" are exactly the audience that needs it here.
 *
 *   The glass params are the material inspector's CSS half. Only that half can
 *   run this early — bevel, profile and specular are baked into displacement
 *   maps that do not exist until the worker has run, which is why the static
 *   tier maps have to remain correct on their own.
 *
 * Runs synchronously in <head>, so neither setting flashes.
 */
export function TransparencyScript() {
  const script = `
    try {
      var d = document.documentElement;
      if (localStorage.getItem(${JSON.stringify(TRANSPARENCY_STORAGE_KEY)}) === 'reduced') {
        d.setAttribute('data-transparency', 'reduced');
      }
      var raw = localStorage.getItem(${JSON.stringify(GLASS_STORAGE_KEY)});
      if (raw) {
        var p = JSON.parse(raw);
        var map = ${JSON.stringify(CSS_VAR_BY_PARAM)};
        var lim = ${JSON.stringify(CSS_LIMITS)};
        for (var k in map) {
          var v = p[k];
          if (typeof v !== 'number' || !isFinite(v)) continue;
          // Clamped HERE too, not only in normalizeParams. This runs before any
          // React code, so localStorage is untrusted input at this point — a
          // hand-edited or stale value would otherwise drive tint to zero and
          // put body copy below AA for the whole first paint.
          v = Math.min(lim[k][1], Math.max(lim[k][0], v));
          d.style.setProperty(map[k], String(v));
        }
      }
    } catch (e) {}
  `;

  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}
