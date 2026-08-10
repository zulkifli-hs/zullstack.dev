import { isPassthrough, MAX_WIDTH, targetSize } from "./constraints";
import type { CompressRequest, CompressResponse } from "./compress-worker";

/**
 * Client for the compression worker.
 *
 * Follows `glass/lens-registry.ts`: one lazily-created worker for the whole
 * session, and a hard rule that a broken worker degrades rather than throws.
 * An image that failed to compress is a slightly heavy image; an upload that
 * failed because the worker was blocked is lost work.
 */

export type CompressedImage = {
  file: File;
  width: number;
  height: number;
  /** Bytes before and after, so the UI can show what the resize bought. */
  originalBytes: number;
  bytes: number;
};

let worker: Worker | null = null;
let workerBroken = false;
let sequence = 0;

const pending = new Map<string, (response: CompressResponse) => void>();

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;

  // `OffscreenCanvas` is the load-bearing API and is not universal. Checking up
  // front means the fallback path is taken deliberately rather than after a
  // file has already been handed over.
  if (typeof Worker === "undefined" || typeof OffscreenCanvas === "undefined") {
    workerBroken = true;
    return null;
  }

  try {
    worker = new Worker(new URL("./compress-worker.ts", import.meta.url), { type: "module" });

    worker.addEventListener("message", (event: MessageEvent<CompressResponse>) => {
      pending.get(event.data.id)?.(event.data);
      pending.delete(event.data.id);
    });

    worker.addEventListener("error", () => {
      // Blocked by CSP, unsupported, or a bundling failure. Resolve everything
      // in flight as a failure so no upload hangs waiting on a dead worker.
      workerBroken = true;
      for (const [id, resolve] of pending) resolve({ ok: false, id, error: "worker failed" });
      pending.clear();
      worker = null;
    });

    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** What we report when the file is used exactly as the browser handed it over. */
async function untouched(file: File): Promise<CompressedImage> {
  const size = await intrinsicSize(file).catch(() => ({ width: 0, height: 0 }));
  return { file, ...size, originalBytes: file.size, bytes: file.size };
}

/**
 * Reads dimensions without decoding into a canvas.
 *
 * Needed on the fallback path: the schema stores width and height, and the
 * public gallery lays images out from them, so an uncompressed upload must
 * still arrive with its size known.
 */
async function intrinsicSize(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("could not read image"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Resizes and re-encodes `file` to WebP unless doing so would be a downgrade.
 *
 * Never rejects: every failure path returns the original file, because the
 * caller's next step is an upload that should still happen.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (isPassthrough(file.type) || !file.type.startsWith("image/")) return untouched(file);

  const active = getWorker();
  if (!active) return untouched(file);

  const id = `img-${++sequence}`;

  const response = await new Promise<CompressResponse>((resolve) => {
    pending.set(id, resolve);
    const request: CompressRequest = { id, file };
    active.postMessage(request);
  });

  if (!response.ok) return untouched(file);

  // A file that is already small and well-encoded can come out of a re-encode
  // larger. Keeping the original is both smaller and lossless, so there is no
  // argument for the new one.
  if (response.blob.size >= file.size) {
    const size = await intrinsicSize(file).catch(() => ({
      width: response.width,
      height: response.height,
    }));
    return { file, ...size, originalBytes: file.size, bytes: file.size };
  }

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";

  return {
    file: new File([response.blob], name, { type: "image/webp" }),
    width: response.width,
    height: response.height,
    originalBytes: file.size,
    bytes: response.blob.size,
  };
}

/** Whether an image was actually reduced, for the "6.2 MB → 610 KB" readout. */
export function wasCompressed(result: CompressedImage): boolean {
  return result.bytes < result.originalBytes;
}

export { MAX_WIDTH, targetSize };
