import type { Profile } from "./lens-math";

/**
 * The material's tunable parameters, and the one place their names, ranges and
 * defaults are defined.
 *
 * Split into two groups, because they behave completely differently and the UI
 * has to reflect that:
 *
 *   CSS  — a custom property on <html>. Repaints in the same frame, applies
 *          before first paint via the blocking script, costs nothing.
 *   MAP  — baked into the displacement/specular PNGs. Changing one invalidates
 *          the cache and re-runs the worker, so it must be debounced, and it
 *          cannot apply before hydration.
 *
 * If you add a knob, put it in the right group. A MAP parameter wired up as a
 * CSS one silently does nothing — the value would reach a custom property that
 * no `@utility` reads, because by then the geometry is already a PNG.
 */

export type CssParams = {
  /** Multiplier on `--glass-blur-base`. */
  blur: number;
  /** Multiplier on the tint alpha — "glass background opacity". */
  opacity: number;
  saturation: number;
  brightness: number;
  /** Rim-light intensity. */
  rim: number;
  shadow: number;
  sheen: number;
  grain: number;
};

export type MapParams = {
  profile: Profile;
  /** Width of the curved band inward from the rim, in CSS px. */
  bevel: number;
  /** Index of refraction — the angle of the bend. */
  ior: number;
  /** Path length through the slab — how much lateral shift that angle accrues. */
  thickness: number;
  /** Light direction in degrees. Negative = from above-left. */
  specularAngle: number;
  specularOpacity: number;
  /** Higher = tighter, brighter rim. */
  specularSaturation: number;
};

export type GlassParams = CssParams & MapParams;

export const DEFAULT_PARAMS: GlassParams = {
  blur: 1,
  opacity: 1,
  saturation: 1,
  brightness: 1,
  rim: 1,
  shadow: 1,
  sheen: 1,
  grain: 1,

  // Convex, not squircle: a circle's normal falls off linearly across the
  // bevel, where the squircle's collapses within a pixel or two of the rim.
  // Measured in Chromium against a stripe pattern, that is the difference
  // between 18.08 and 6.73 mean delta — visible refraction versus none.
  profile: "convex",
  bevel: 28,
  ior: 1.5,
  thickness: 1,
  specularAngle: -60,
  specularOpacity: 0.4,
  specularSaturation: 6,
};

type Range = { min: number; max: number; step: number };

/**
 * Slider bounds.
 *
 * `opacity` does not go to zero on purpose. Body copy on glass was measured at
 * 5.14:1 against a 4.5:1 requirement — roughly 12% of headroom — so a visitor
 * dragging tint to nothing would take the site below AA. The floor is enforced
 * here rather than left to the input's `min`, because presets and stored values
 * bypass the input entirely.
 */
export const RANGES: Record<keyof CssParams | Exclude<keyof MapParams, "profile">, Range> = {
  blur: { min: 0, max: 2.5, step: 0.05 },
  opacity: { min: 0.55, max: 1.6, step: 0.05 },
  saturation: { min: 0.5, max: 2, step: 0.05 },
  brightness: { min: 0.85, max: 1.25, step: 0.01 },
  rim: { min: 0, max: 2.5, step: 0.05 },
  shadow: { min: 0, max: 2, step: 0.05 },
  sheen: { min: 0, max: 2, step: 0.05 },
  grain: { min: 0, max: 3, step: 0.05 },

  bevel: { min: 4, max: 48, step: 1 },
  ior: { min: 1, max: 2.4, step: 0.01 },
  thickness: { min: 0, max: 3, step: 0.05 },
  specularAngle: { min: -180, max: 180, step: 1 },
  specularOpacity: { min: 0, max: 1, step: 0.02 },
  specularSaturation: { min: 1, max: 12, step: 0.5 },
};

const clamp = (v: number, { min, max }: Range) => Math.min(max, Math.max(min, v));

/** Coerces anything — stored JSON, a preset, a slider — into a legal set. */
export function normalizeParams(input: Partial<GlassParams> | null | undefined): GlassParams {
  const out = { ...DEFAULT_PARAMS };
  if (!input) return out;

  for (const key of Object.keys(RANGES) as (keyof typeof RANGES)[]) {
    const value = input[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = clamp(value, RANGES[key]);
    }
  }

  const profiles: Profile[] = ["convex", "squircle", "concave", "lip"];
  if (input.profile && profiles.includes(input.profile)) out.profile = input.profile;

  return out;
}

/**
 * The CSS half, as custom properties.
 *
 * Deliberately mirrors the `--glass-*-scale` names that the degradation blocks
 * already reset, so a user setting and `prefers-contrast: more` compete through
 * the same tokens instead of fighting in two vocabularies. Degradation still
 * wins: it clamps via `--glass-*-min`/`-max`, which sit downstream of these.
 */
export const CSS_VAR_BY_PARAM: Record<keyof CssParams, string> = {
  blur: "--glass-user-blur",
  opacity: "--glass-user-tint",
  saturation: "--glass-user-sat",
  brightness: "--glass-user-bright",
  rim: "--glass-user-rim",
  shadow: "--glass-shadow-scale",
  sheen: "--glass-sheen-scale",
  grain: "--glass-grain-scale",
};

export function cssVars(p: GlassParams): Record<string, string> {
  return Object.fromEntries(
    (Object.entries(CSS_VAR_BY_PARAM) as [keyof CssParams, string][]).map(([key, name]) => [
      name,
      String(p[key]),
    ]),
  );
}

export const GLASS_STORAGE_KEY = "zullstack-glass";

export type PresetId = "default" | "clear" | "frosted" | "reduced";
export type Preset = { id: PresetId; params: Partial<GlassParams> };

/**
 * `reduced` is not a style choice — it is the accessibility escape hatch, and
 * it is the one preset that must remain reachable in one gesture.
 */
export const PRESETS: Preset[] = [
  { id: "default", params: DEFAULT_PARAMS },
  {
    id: "clear",
    params: { blur: 0.35, opacity: 0.7, saturation: 1.3, thickness: 1.6, bevel: 22, rim: 1.3 },
  },
  {
    id: "frosted",
    params: { blur: 2, opacity: 1.35, saturation: 1.1, thickness: 0.5, bevel: 10, sheen: 0.6 },
  },
  {
    id: "reduced",
    params: { blur: 0, opacity: 1.6, saturation: 1, thickness: 0, sheen: 0, grain: 0 },
  },
];
