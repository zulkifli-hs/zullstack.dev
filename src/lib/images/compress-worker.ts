/// <reference lib="webworker" />

import { targetSize, WEBP_QUALITY } from "./constraints";

/**
 * Resizes and re-encodes an upload off the main thread.
 *
 * Decoding a 24-megapixel PNG and re-encoding it as WebP is hundreds of
 * milliseconds of work per file. On the main thread a batch of screenshots
 * would lock the admin UI solid for seconds, which reads as a crash. This
 * mirrors `glass/lens-worker.ts`: the worker does only arithmetic and pixels,
 * the caller owns lifecycle and error handling.
 */

export type CompressRequest = {
  id: string;
  file: File;
};

export type CompressResponse =
  | {
      ok: true;
      id: string;
      blob: Blob;
      width: number;
      height: number;
    }
  | { ok: false; id: string; error: string };

async function compress(file: File) {
  // `createImageBitmap` decodes off-thread and honours EXIF orientation, which
  // a plain <img> would not — phone screenshots would otherwise come out
  // rotated once the orientation tag is dropped by the re-encode.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  try {
    const size = targetSize(bitmap.width, bitmap.height);

    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context in worker");

    // Quality hints matter here: the default nearest-ish downscale on a large
    // ratio produces visible aliasing on UI screenshots, where thin lines and
    // text are exactly what the image exists to show.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);

    const blob = await canvas.convertToBlob({ type: "image/webp", quality: WEBP_QUALITY });

    return { blob, width: size.width, height: size.height };
  } finally {
    // Frees the decoded bitmap immediately rather than waiting for GC; a batch
    // of 20MP images is otherwise hundreds of megabytes held at once.
    bitmap.close();
  }
}

self.addEventListener("message", async (event: MessageEvent<CompressRequest>) => {
  const { id, file } = event.data;

  try {
    const result = await compress(file);
    const response: CompressResponse = { ok: true, id, ...result };
    self.postMessage(response);
  } catch (error) {
    const response: CompressResponse = {
      ok: false,
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});
