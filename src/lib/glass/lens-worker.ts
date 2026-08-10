/// <reference lib="webworker" />

import { buildMaps, type LensSpec } from "./lens-math";

/**
 * Generates displacement and specular maps off the main thread.
 *
 * The work is genuinely too big to do inline: a 355x492 card at DPR 2 is about
 * 811k pixels, and every one of them runs a signed-distance evaluation, a
 * normal, and a specular term — measured at ~35ms per map on a fast machine.
 * One card would drop two frames; a grid of them would stall the page.
 *
 * The main thread stays responsible for caching and de-duplication (see
 * `lens-registry.ts`); this file only does arithmetic.
 */

export type LensRequest = { id: string; spec: LensSpec };

export type LensResult = {
  id: string;
  displacement: string;
  specular: string;
  scale: number;
  pad: number;
  width: number;
  height: number;
};

export type LensResponse = ({ ok: true } & LensResult) | { ok: false; id: string; error: string };

/**
 * PNG, not WebP or JPEG, and this is not a preference.
 *
 * These bytes are not a picture — R and G are a vector field that
 * `feDisplacementMap` reads as coordinates. Any lossy codec would quietly
 * perturb those numbers, and the result is not "slightly soft", it is a rim
 * that ripples. Lossless is a correctness requirement.
 */
async function toObjectUrl(width: number, height: number, bytes: Uint8Array): Promise<string> {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context in worker");

  // Copies rather than aliasing `bytes.buffer`: a view would carry
  // `ArrayBufferLike`, which admits `SharedArrayBuffer`, and `ImageData` will
  // not take one. The copy is a memcpy of a few MB against ~35ms of geometry.
  const clamped = new Uint8ClampedArray(bytes);
  ctx.putImageData(new ImageData(clamped, width, height), 0, 0);

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return URL.createObjectURL(blob);
}

self.addEventListener("message", async (event: MessageEvent<LensRequest>) => {
  const { id, spec } = event.data;
  try {
    const maps = buildMaps(spec);
    const [displacement, specular] = await Promise.all([
      toObjectUrl(maps.pixelWidth, maps.pixelHeight, maps.displacement),
      toObjectUrl(maps.pixelWidth, maps.pixelHeight, maps.specular),
    ]);

    const response: LensResponse = {
      ok: true,
      id,
      displacement,
      specular,
      scale: maps.scale,
      pad: maps.pad,
      width: maps.width,
      height: maps.height,
    };
    self.postMessage(response);
  } catch (error) {
    const response: LensResponse = {
      ok: false,
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
