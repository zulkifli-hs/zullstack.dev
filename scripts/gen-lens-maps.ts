/**
 * Generates the static displacement and specular maps.
 *
 *   pnpm gen:lens          # write src/lib/glass/lens-maps.generated.ts
 *   pnpm gen:lens --check  # fail if the committed output is stale
 *
 * These are the *fallback* maps, not the only ones. At runtime the worker in
 * `src/lib/glass/lens-worker.ts` regenerates maps at each element's real size —
 * a displacement map does not scale, so a map authored at 360x220 and stretched
 * across a 1104x143 row has a bevel band three times too wide horizontally.
 *
 * These committed maps still matter for three cases the runtime path cannot
 * cover: first paint before the worker resolves, no-JS, and worker failure. An
 * `feImage` whose href is still loading leaves `feDisplacementMap` without a
 * map, which Chromium paints as transparent black — the panel's backdrop
 * momentarily vanishing. So something correct has to be there from frame one.
 *
 * All geometry lives in `src/lib/glass/lens-math.ts`, shared with the worker.
 * This file owns only PNG encoding, which needs `node:zlib` and cannot run in
 * the browser.
 */
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { buildMaps, type LensSpec } from "../src/lib/glass/lens-math";

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

/* ── Tiers ───────────────────────────────────────────────────────────────────
   Authored at the size each is most often used, because a stretched map
   distorts the bevel. The runtime worker removes that constraint for anything
   that can measure itself; these remain the honest starting point.

   PROFILE: `convex` (a spherical dome), not `squircle`, and the difference is
   not cosmetic. A circle's surface normal falls off linearly from rim to
   centre; the squircle's collapses almost immediately. Measured against a 4px
   stripe pattern in Chromium, squircle at a 16px bevel put more than 1px of
   shift across only 5px of that bevel and scored 6.73 mean delta — the lens was
   arithmetically correct and visually absent. Convex at a 28px bevel spreads it
   over 10px and scores 18.08, near enough 3x.

   `lip` scores highest of all (19.56) but is convex outside and concave in the
   middle, so it reads as a groove. That is right for a switch track and wrong
   for a panel.
   ────────────────────────────────────────────────────────────────────────── */
const TIERS: (LensSpec & { id: string })[] = [
  // Icon buttons and small controls.
  { id: "xs", width: 32, height: 32, radius: 10, bevel: 9, profile: "convex" },
  // Default buttons.
  { id: "sm", width: 120, height: 36, radius: 12, bevel: 12, profile: "convex" },
  // Pill buttons and the search field.
  { id: "pill", width: 320, height: 44, radius: 22, bevel: 15, profile: "convex" },
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
  { id: "card", width: 360, height: 220, radius: 18, bevel: 28, profile: "convex" },
  // Menus and popovers.
  { id: "md", width: 320, height: 240, radius: 18, bevel: 24, profile: "convex" },
  // Hero panel.
  {
    id: "lg",
    width: 768,
    height: 400,
    radius: 24,
    bevel: 34,
    profile: "convex",
    specularOpacity: 0.35,
  },
];

const OUT = path.join(process.cwd(), "src/lib/glass/lens-maps.generated.ts");

function render(): string {
  const body = TIERS.map((spec) => {
    const m = buildMaps(spec);
    const png = (bytes: Uint8Array) =>
      `data:image/png;base64,${encodePng(m.pixelWidth, m.pixelHeight, bytes).toString("base64")}`;

    return (
      `  "${spec.id}": {\n` +
      `    width: ${m.width},\n` +
      `    height: ${m.height},\n` +
      `    pad: ${m.pad},\n` +
      `    scale: ${m.scale},\n` +
      `    displacement: "${png(m.displacement)}",\n` +
      `    specular: "${png(m.specular)}",\n` +
      `  },`
    );
  }).join("\n");

  return (
    "// GENERATED by scripts/gen-lens-maps.ts — do not edit.\n" +
    "// Run `pnpm gen:lens` after changing a tier spec or src/lib/glass/lens-math.ts.\n" +
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
  for (const spec of TIERS) {
    const m = buildMaps(spec);
    console.log(`  ${spec.id.padEnd(7)} ${m.width}x${m.height}  scale=${m.scale}px`);
  }
}

main();
