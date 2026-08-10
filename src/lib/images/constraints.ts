/**
 * How large an image is allowed to be once it is stored.
 *
 * Shared by the worker that resizes and the UI that explains what happened, so
 * the numbers quoted to the editor are the numbers actually applied.
 */

/**
 * The widest an image is ever rendered on this site is the 1152px content
 * column, and the lightbox caps at 1024px. At 2× device pixel ratio that is
 * ~2300px — anything beyond it is bytes no screen will ever resolve.
 */
export const MAX_WIDTH = 2400;

/**
 * Total pixel budget. Cloudinary rejects very large images, and a 2400px-wide
 * capture of a long page can still be enormous, so height needs a ceiling too —
 * just a much higher one than width.
 */
export const MAX_PIXELS = 20_000_000;

export const WEBP_QUALITY = 0.85;

/**
 * Formats that are passed through untouched.
 *
 * SVG is already resolution-independent and rasterising it would be a
 * downgrade. GIF is here because canvas only ever sees the first frame — an
 * animated GIF would come out the other side as a still.
 */
const PASSTHROUGH_TYPES = new Set(["image/svg+xml", "image/gif"]);

export function isPassthrough(type: string): boolean {
  return PASSTHROUGH_TYPES.has(type);
}

/**
 * Target dimensions for a source image, preserving aspect ratio.
 *
 * The width cap is applied first and the pixel cap second, which is what keeps
 * long screenshots usable: a 1440×9000 page capture is already under the width
 * limit, so it stays 9000px tall and readable rather than being squashed to fit
 * a "longest edge" rule.
 */
export function targetSize(width: number, height: number): { width: number; height: number } {
  let scale = Math.min(1, MAX_WIDTH / width);

  const pixels = width * scale * (height * scale);
  if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** "6.2 MB" — for the before/after readout in the uploader. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
