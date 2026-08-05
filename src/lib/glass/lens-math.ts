/**
 * The geometry that turns glass into a lens.
 *
 * Shared verbatim by the build-time generator (`scripts/gen-lens-maps.ts`) and
 * the runtime worker (`lens-worker.ts`). That sharing is the point: the two used
 * to be one file, and the moment a browser needs to generate a map at an
 * element's real size, any second implementation is a guarantee that the static
 * fallback and the live map will eventually disagree.
 *
 * PLATFORM-FREE. No `node:` imports, no DOM. Callers encode the bytes: the
 * script writes PNGs via zlib, the worker wraps them in `ImageData`.
 *
 * ── How the light works ─────────────────────────────────────────────────────
 *
 * Real glass is not a scatter, it is a lens: optically flat in the middle and
 * steeply curved at the rim. Light entering the curved rim bends (Snell), so
 * whatever is behind the edge appears displaced inward. That displacement is
 * what the eye reads as "thickness". A blur alone can never produce it.
 *
 * Two images come out of `buildMaps`:
 *
 *   1. A DISPLACEMENT map. R encodes the x offset, G the y offset, 128 = none.
 *      `feDisplacementMap` samples the backdrop at the offset position.
 *
 *   2. A SPECULAR map. A rim light whose intensity depends on the angle between
 *      the surface normal and a fixed light direction — bright where the bevel
 *      tilts toward the light, dark where it tilts away. Blended over the
 *      refracted result with `screen`.
 */

/** Signed distance to a rounded rect. Negative inside. */
export function sdRoundRect(
  px: number,
  py: number,
  hw: number,
  hh: number,
  r: number,
): number {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}

/**
 * Outward unit normal of the rounded rect at `(px, py)` — the SDF gradient.
 *
 * Closed form rather than four extra `sdRoundRect` probes per pixel. That
 * matters here and not in the Node script: the browser generates maps at the
 * element's real size, and a 355x492 card at DPR 2 is ~811k pixels, so five
 * distance evaluations per pixel is the difference between usable and not.
 *
 * Two regions, and they agree where they meet:
 *   - corner (`qx > 0 && qy > 0`): radial, out of the corner arc's centre
 *   - edge: axis-aligned along whichever of qx/qy dominates
 *
 * The switch between them is discontinuous only along the inward diagonal from
 * a corner, where `t` has already reached the flat interior and the offset this
 * multiplies is zero — so the seam is never visible.
 */
export function sdRoundRectNormal(
  px: number,
  py: number,
  hw: number,
  hh: number,
  r: number,
): { nx: number; ny: number } {
  const sx = px < 0 ? -1 : 1;
  const sy = py < 0 ? -1 : 1;
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;

  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1;
    return { nx: (qx / len) * sx, ny: (qy / len) * sy };
  }
  return qx > qy ? { nx: sx, ny: 0 } : { nx: 0, ny: sy };
}

export type Profile = "convex" | "squircle" | "concave" | "lip";

export const PROFILES: readonly Profile[] = ["convex", "squircle", "concave", "lip"];

const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

/**
 * Surface height at `x`, where x = 0 is the outer rim and x = 1 the flat centre.
 * The shape of this curve is the entire character of the glass.
 *
 *   convex circle    y = √(1 − (1−x)²)          a spherical dome
 *   convex squircle  y = ⁴√(1 − (1−x)⁴)         softer flat→curve transition
 *   concave          y = 1 − convex(x)
 *   lip              mix(convex, concave, smootherstep)
 */
export function surface(x: number, profile: Profile): number {
  const t = Math.min(Math.max(x, 0), 1);
  const convexCircle = Math.sqrt(Math.max(0, 1 - (1 - t) ** 2));
  const convexSquircle = Math.pow(Math.max(0, 1 - (1 - t) ** 4), 0.25);

  switch (profile) {
    case "convex":
      return convexCircle;
    case "squircle":
      return convexSquircle;
    case "concave":
      return 1 - convexSquircle;
    case "lip": {
      // Convex on the outside, concave in the middle — reads as a groove.
      const k = smootherstep(t);
      return convexSquircle * (1 - k) + (1 - convexSquircle) * k;
    }
  }
}

const DELTA = 1e-3;

/**
 * Lateral offset produced by refraction at `x`, in arbitrary units.
 *
 * The surface slope gives the normal; Snell's law turns the incidence angle
 * into a refraction angle; the difference between them is how far the ray
 * shifts sideways. Flat surface → zero slope → zero shift, which is why the
 * middle of the panel is undistorted and only the rim bends.
 */
export function refractionOffset(x: number, profile: Profile, ior: number): number {
  const y1 = surface(x - DELTA, profile);
  const y2 = surface(x + DELTA, profile);
  const slope = (y2 - y1) / (2 * DELTA);

  // Normal of the 1-D profile, normalised.
  const len = Math.hypot(-slope, 1);
  const nx = -slope / len;

  const theta1 = Math.asin(Math.min(1, Math.abs(nx)));
  const theta2 = Math.asin(Math.min(1, Math.sin(theta1) / ior));
  return Math.tan(theta1 - theta2) * Math.sign(nx);
}

export type LensSpec = {
  /** CSS pixels. */
  width: number;
  height: number;
  radius: number;
  /** Depth of the curved band, inward from the rim. CSS pixels. */
  bevel: number;
  profile: Profile;
  /**
   * Index of refraction — how strongly the rim bends light. 1.5 is glass, 1.0
   * is air (no bend at all), 2.4 is diamond.
   */
  ior?: number;
  /**
   * How far light travels through the slab, as a multiplier on the final
   * displacement. Distinct from `ior`: the index sets the *angle* of the bend,
   * thickness sets how much lateral shift that angle accumulates. Two knobs,
   * because glass that bends sharply over a short path looks nothing like glass
   * that bends gently over a long one.
   */
  thickness?: number;
  /** Light direction, degrees. Negative = from above-left. */
  specularAngle?: number;
  specularOpacity?: number;
  /** Higher = tighter, brighter rim. The reference uses 4–9. */
  specularSaturation?: number;
  /**
   * Device pixel ratio the maps are rasterised at. 2 keeps normals smooth on
   * retina; `scale` stays in CSS pixels either way, so the filter is unaffected.
   */
  dpr?: number;
};

export type LensMaps = {
  /** Map dimensions in CSS pixels, including `pad` on every side. */
  width: number;
  height: number;
  pad: number;
  /** Raster dimensions — `(width|height) * dpr`, rounded. */
  pixelWidth: number;
  pixelHeight: number;
  /** Peak displacement in CSS px, for the filter's `scale` attribute. */
  scale: number;
  displacement: Uint8Array;
  specular: Uint8Array;
};

export function buildMaps(spec: LensSpec): LensMaps {
  const {
    width,
    height,
    radius,
    bevel,
    profile,
    ior = 1.5,
    thickness = 1,
    specularAngle = -60,
    specularOpacity = 0.4,
    specularSaturation = 6,
    dpr = 2,
  } = spec;

  // Refraction samples the backdrop from OUTSIDE the element, so the filter
  // region has to be padded. Without this the samples fall outside the region
  // and come back transparent black — a dark fringe at maximum displacement.
  const pad = Math.ceil(bevel);
  const w = Math.round((width + pad * 2) * dpr);
  const h = Math.round((height + pad * 2) * dpr);

  const hw = (width / 2) * dpr;
  const hh = (height / 2) * dpr;
  const r = radius * dpr;
  const bevelPx = bevel * dpr;

  // Pass 1: raw displacement vectors, so they can be normalised afterwards.
  const dx = new Float32Array(w * h);
  const dy = new Float32Array(w * h);
  const spec1 = new Float32Array(w * h);
  let maxMag = 0;

  const lightX = Math.cos((specularAngle * Math.PI) / 180);
  const lightY = Math.sin((specularAngle * Math.PI) / 180);

  // `refractionOffset` depends only on `t`, and `t` is quantised to the bevel
  // band — so it is a 1-D function sampled over and over. Precomputing it turns
  // four transcendental calls per pixel into one array read.
  const LUT_SIZE = 1024;
  const offsetLut = new Float32Array(LUT_SIZE + 1);
  for (let i = 0; i <= LUT_SIZE; i++) {
    offsetLut[i] = refractionOffset(i / LUT_SIZE, profile, ior);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // Centre-relative coordinates, in device pixels.
      const px = x - w / 2 + 0.5;
      const py = y - h / 2 + 0.5;

      const d = sdRoundRect(px, py, hw, hh, r);
      if (d > 0) continue; // outside the shape: no displacement, no highlight

      // 0 at the rim, 1 at the flat interior.
      const t = Math.min(Math.max(-d / bevelPx, 0), 1);

      // Direction: the SDF gradient, which points radially outward — this is
      // what makes corners refract radially instead of as two crossed ramps.
      const { nx, ny } = sdRoundRectNormal(px, py, hw, hh, r);

      const offset = offsetLut[(t * LUT_SIZE) | 0];
      dx[i] = nx * offset;
      dy[i] = ny * offset;

      const mag = Math.hypot(dx[i], dy[i]);
      if (mag > maxMag) maxMag = mag;

      // Rim light: brightest where the bevel normal faces the light. Scaled by
      // how curved the surface is, so the flat centre stays dark.
      const facing = Math.max(0, nx * lightX + ny * lightY);
      const curvature = 1 - t;
      spec1[i] = Math.pow(facing, specularSaturation) * Math.pow(curvature, 1.5);
    }
  }

  // Pass 2: encode. 8 bits per channel caps displacement at ±127 steps, which
  // is why the vectors are normalised and the real magnitude is carried by the
  // filter's `scale` attribute instead.
  const displacement = new Uint8Array(w * h * 4);
  const specular = new Uint8Array(w * h * 4);
  const norm = maxMag || 1;

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    displacement[o] = Math.round(128 + (dx[i] / norm) * 127);
    displacement[o + 1] = Math.round(128 + (dy[i] / norm) * 127);
    displacement[o + 2] = 128;
    displacement[o + 3] = 255;

    const s = Math.min(1, spec1[i]) * specularOpacity;
    specular[o] = 255;
    specular[o + 1] = 255;
    specular[o + 2] = 255;
    specular[o + 3] = Math.round(s * 255);
  }

  /**
   * `refractionOffset` returns tan(θ1 − θ2), a dimensionless ratio. The actual
   * lateral shift is that ratio multiplied by the distance the ray travels
   * through the glass — which scales with the thickness at the rim, i.e. the
   * bevel. Without this the displacement lands under a pixel and the lens is
   * mathematically correct but invisible.
   */
  const scale = maxMag * bevel * thickness;

  return {
    width: width + pad * 2,
    height: height + pad * 2,
    pad,
    pixelWidth: w,
    pixelHeight: h,
    scale: Number(scale.toFixed(2)),
    displacement,
    specular,
  };
}
