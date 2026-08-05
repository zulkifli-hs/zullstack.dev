/**
 * Generates the displacement and specular maps that make glass behave like a
 * lens instead of a blur.
 *
 *   pnpm gen:lens          # write src/lib/glass/lens-maps.generated.ts
 *   pnpm gen:lens --check  # fail if the committed output is stale
 *
 * ── How the light works ─────────────────────────────────────────────────────
 *
 * Real glass is not a scatter, it is a lens: optically flat in the middle and
 * steeply curved at the rim. Light entering the curved rim bends (Snell), so
 * whatever is behind the edge appears displaced inward. That displacement is
 * what the eye reads as "thickness". A blur alone can never produce it.
 *
 * Two images are generated per size:
 *
 *   1. A DISPLACEMENT map. R encodes the x offset, G the y offset, 128 = none.
 *      `feDisplacementMap` samples the backdrop at the offset position.
 *
 *   2. A SPECULAR map. A rim light whose intensity depends on the angle between
 *      the surface normal and a fixed light direction — bright where the bevel
 *      tilts toward the light, dark where it tilts away. Blended over the
 *      refracted result with `screen`.
 *
 * The surface profiles come from the reference write-up:
 *   convex circle    y = √(1 − (1−x)⁴)          a spherical dome
 *   convex squircle  y = ⁴√(1 − (1−x)⁴)         softer flat→curve transition
 *   concave          y = 1 − convex(x)
 *   lip              mix(convex, concave, smootherstep)  convex outside,
 *                                                        concave in the middle
 *
 * `lip` is what a switch track wants: it reads as a groove rather than a dome.
 */
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/* ── PNG encoding (no dependencies) ──────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** `rgba` is a flat RGBA byte array. Colour type 6, 8-bit. */
function encodePng(width: number, height: number, rgba: Uint8Array): Buffer {
  // One filter byte (0 = none) per scanline.
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(
      raw,
      rowStart + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── Geometry ────────────────────────────────────────────────────────────── */

/** Signed distance to a rounded rect. Negative inside. */
function sdRoundRect(px: number, py: number, hw: number, hh: number, r: number): number {
  const qx = Math.abs(px) - hw + r;
  const qy = Math.abs(py) - hh + r;
  return (
    Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
  );
}

type Profile = "convex" | "squircle" | "concave" | "lip";

const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

/**
 * Surface height at `x`, where x = 0 is the outer rim and x = 1 the flat centre.
 * The shape of this curve is the entire character of the glass.
 */
function surface(x: number, profile: Profile): number {
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
function refractionOffset(x: number, profile: Profile, ior: number): number {
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

type TierSpec = {
  id: string;
  width: number;
  height: number;
  radius: number;
  /** Depth of the curved band, inward from the rim. */
  bevel: number;
  profile: Profile;
  /** Index of refraction. 1.5 is glass. */
  ior?: number;
  /** 0.70–1.00 in the reference. Scales the whole displacement. */
  refraction?: number;
  /** Light direction, degrees. Negative = from above-left. */
  specularAngle?: number;
  specularOpacity?: number;
  /** Higher = tighter, brighter rim. The reference uses 4–9. */
  specularSaturation?: number;
};

/**
 * Emitted at 2x so the normals stay smooth on retina displays; `scale` stays in
 * CSS pixels, so the filter value is unaffected.
 */
const DPR = 2;

function build(spec: TierSpec) {
  const {
    width,
    height,
    radius,
    bevel,
    profile,
    ior = 1.5,
    refraction = 1,
    specularAngle = -60,
    specularOpacity = 0.4,
    specularSaturation = 6,
  } = spec;

  // Refraction samples the backdrop from OUTSIDE the element, so the filter
  // region has to be padded. Without this the samples fall outside the region
  // and come back transparent black — a dark fringe at maximum displacement.
  const pad = Math.ceil(bevel);
  const w = Math.round((width + pad * 2) * DPR);
  const h = Math.round((height + pad * 2) * DPR);

  const hw = (width / 2) * DPR;
  const hh = (height / 2) * DPR;
  const r = radius * DPR;
  const bevelPx = bevel * DPR;

  // Pass 1: raw displacement vectors, so they can be normalised afterwards.
  const dx = new Float32Array(w * h);
  const dy = new Float32Array(w * h);
  const spec1 = new Float32Array(w * h);
  let maxMag = 0;

  const lightX = Math.cos((specularAngle * Math.PI) / 180);
  const lightY = Math.sin((specularAngle * Math.PI) / 180);

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
      const e = 1;
      const gx =
        sdRoundRect(px + e, py, hw, hh, r) - sdRoundRect(px - e, py, hw, hh, r);
      const gy =
        sdRoundRect(px, py + e, hw, hh, r) - sdRoundRect(px, py - e, hw, hh, r);
      const glen = Math.hypot(gx, gy) || 1;
      const nx = gx / glen;
      const ny = gy / glen;

      const offset = refractionOffset(t, profile, ior);
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
  const disp = new Uint8Array(w * h * 4);
  const specular = new Uint8Array(w * h * 4);
  const norm = maxMag || 1;

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    disp[o] = Math.round(128 + (dx[i] / norm) * 127);
    disp[o + 1] = Math.round(128 + (dy[i] / norm) * 127);
    disp[o + 2] = 128;
    disp[o + 3] = 255;

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
  const scalePx = maxMag * bevel * refraction;

  return {
    id: spec.id,
    width: width + pad * 2,
    height: height + pad * 2,
    pad,
    // Peak displacement in CSS px.
    scale: Number(scalePx.toFixed(2)),
    displacement: `data:image/png;base64,${encodePng(w, h, disp).toString("base64")}`,
    specular: `data:image/png;base64,${encodePng(w, h, specular).toString("base64")}`,
  };
}

/* ── Tiers ───────────────────────────────────────────────────────────────────
   A displacement map does NOT scale with its element — `backdrop-filter` gives
   the filter the element's own box, so the map has to be authored at the size
   it will be used. Hence a fixed set rather than one generic map.
   ────────────────────────────────────────────────────────────────────────── */
const TIERS: TierSpec[] = [
  // Icon buttons and small controls.
  { id: "xs", width: 32, height: 32, radius: 10, bevel: 7, profile: "squircle" },
  // Default buttons.
  { id: "sm", width: 120, height: 36, radius: 12, bevel: 9, profile: "squircle" },
  // Pill buttons and the search field.
  { id: "pill", width: 320, height: 44, radius: 22, bevel: 12, profile: "squircle" },
  // Switch track — the reference uses a lip bezel here, convex outside and
  // concave in the middle, which reads as a groove rather than a dome.
  {
    id: "switch",
    width: 48,
    height: 28,
    radius: 14,
    bevel: 9,
    profile: "lip",
    specularOpacity: 0.5,
    specularSaturation: 5,
  },
  // Slider thumb — a small dome.
  {
    id: "thumb",
    width: 20,
    height: 20,
    radius: 10,
    bevel: 8,
    profile: "convex",
    specularOpacity: 0.5,
  },
  // Cards.
  { id: "card", width: 360, height: 220, radius: 18, bevel: 16, profile: "squircle" },
  // Menus and popovers.
  { id: "md", width: 320, height: 240, radius: 18, bevel: 18, profile: "squircle" },
  // Hero panel.
  {
    id: "lg",
    width: 768,
    height: 400,
    radius: 24,
    bevel: 26,
    profile: "squircle",
    specularOpacity: 0.35,
  },
];

const OUT = path.join(process.cwd(), "src/lib/glass/lens-maps.generated.ts");

function render(): string {
  const maps = TIERS.map(build);
  const body = maps
    .map(
      (m) =>
        `  "${m.id}": {\n` +
        `    width: ${m.width},\n` +
        `    height: ${m.height},\n` +
        `    pad: ${m.pad},\n` +
        `    scale: ${m.scale},\n` +
        `    displacement: "${m.displacement}",\n` +
        `    specular: "${m.specular}",\n` +
        `  },`,
    )
    .join("\n");

  return (
    "// GENERATED by scripts/gen-lens-maps.ts — do not edit.\n" +
    "// Run `pnpm gen:lens` after changing a tier spec.\n" +
    "//\n" +
    "// Inlined as data URIs rather than files in public/: an feImage with an\n" +
    "// external href loads asynchronously, and until it resolves feDisplacementMap\n" +
    "// has no map — Chromium renders that as transparent black, so the panel's\n" +
    "// backdrop momentarily vanishes on first paint.\n\n" +
    "export const LENS_MAPS = {\n" +
    body +
    "\n} as const;\n\n" +
    "export type LensTier = keyof typeof LENS_MAPS;\n"
  );
}

function main() {
  const out = render();
  const check = process.argv.includes("--check");

  if (check) {
    if (!existsSync(OUT)) {
      console.error("lens-maps.generated.ts is missing — run `pnpm gen:lens`.");
      process.exit(1);
    }
    const current = readFileSync(OUT, "utf8");
    const same =
      createHash("sha256").update(current).digest("hex") ===
      createHash("sha256").update(out).digest("hex");
    if (!same) {
      console.error("lens maps are stale — run `pnpm gen:lens` and commit the result.");
      process.exit(1);
    }
    console.log("lens maps up to date");
    return;
  }

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
  console.log(`wrote ${TIERS.length} tiers to ${path.relative(process.cwd(), OUT)} (${kb} KB)`);
  for (const m of TIERS.map(build)) {
    console.log(`  ${m.id.padEnd(7)} ${m.width}x${m.height}  scale=${m.scale}px`);
  }
}

main();
