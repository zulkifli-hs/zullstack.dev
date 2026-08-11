/**
 * Builds Cloudinary delivery URLs.
 *
 * A stored `secure_url` carries no transformation — it is the original asset.
 * Everything this site does to an image on the way out (crop, thumbnail
 * framing, format, width) is expressed as URL segments here, which is why crop
 * can be re-edited or removed forever: the original is never overwritten.
 *
 * Cloudinary applies transformation components left to right, so a crop written
 * here always runs before the resize that `loader.ts` appends.
 */

export type CropRect = { x: number; y: number; w: number; h: number };

export type TransformableImage = {
  url: string;
  width?: number;
  height?: number;
  crop?: CropRect | null;
};

const UPLOAD_MARKER = "/image/upload/";

/** Cloudinary versions look like `v1712345678` and always precede the public id. */
const VERSION = /^v\d+$/;

export function isCloudinary(src: string): boolean {
  return src.includes("res.cloudinary.com") && src.includes(UPLOAD_MARKER);
}

/**
 * Splits a delivery URL into its three meaningful parts.
 *
 * Returns null for anything that is not a Cloudinary upload URL, which is how
 * both this module and the loader stay safe for other hosts.
 */
function parse(src: string): { prefix: string; transforms: string[]; asset: string } | null {
  if (!isCloudinary(src)) return null;

  const index = src.indexOf(UPLOAD_MARKER);
  const prefix = src.slice(0, index + UPLOAD_MARKER.length);
  const rest = src.slice(index + UPLOAD_MARKER.length).split("/");

  // Everything before the version segment is an existing transformation. A URL
  // with no version is possible, in which case there is nothing to keep.
  const versionAt = rest.findIndex((segment) => VERSION.test(segment));
  if (versionAt === -1) return { prefix, transforms: [], asset: rest.join("/") };

  return {
    prefix,
    transforms: rest.slice(0, versionAt),
    asset: rest.slice(versionAt).join("/"),
  };
}

/** Reassembles a URL with `extra` appended after any existing transformation. */
export function withTransform(src: string, extra: string): string {
  const parts = parse(src);
  if (!parts) return src;

  return `${parts.prefix}${[...parts.transforms, extra, parts.asset].join("/")}`;
}

/**
 * The crop component for a normalised rectangle.
 *
 * The rectangle is stored as fractions of the original so it survives the
 * image being re-uploaded at a different size; Cloudinary wants pixels, so the
 * stored intrinsic dimensions are what convert it.
 */
function cropTransform(image: TransformableImage): string | null {
  const { crop, width, height } = image;
  if (!crop || !width || !height) return null;

  // A rectangle covering essentially everything is not a crop; emitting it
  // would cost a transformation and a cache entry for no visible difference.
  if (crop.w >= 0.999 && crop.h >= 0.999) return null;

  const w = Math.max(1, Math.round(crop.w * width));
  const h = Math.max(1, Math.round(crop.h * height));
  const x = Math.max(0, Math.min(width - w, Math.round(crop.x * width)));
  const y = Math.max(0, Math.min(height - h, Math.round(crop.y * height)));

  return `c_crop,x_${x},y_${y},w_${w},h_${h}`;
}

/** The image as the editor cropped it, at full resolution. */
export function cloudinarySrc(image: TransformableImage): string {
  const crop = cropTransform(image);
  return crop ? withTransform(image.url, crop) : image.url;
}

/**
 * A top-anchored thumbnail at a fixed aspect ratio.
 *
 * Used for very tall images in the grid, where the frame shows only the top of
 * the capture. Without this the browser would download a 9000px-tall
 * screenshot in order to display 400px of it.
 */
export function cloudinaryThumb(image: TransformableImage, aspect: number): string {
  const crop = cropTransform(image);
  const base = crop ? withTransform(image.url, crop) : image.url;

  // `g_north` keeps the top edge, which for a page capture is the part that
  // identifies it — a centre crop of a long page is a band of body content.
  return withTransform(base, `c_fill,g_north,ar_${aspect.toFixed(3)}`);
}

/**
 * A copy the browser can actually decode, for the CMS's plain `<img>` previews.
 *
 * HEIC is why this exists. An iPhone photo uploads fine and Cloudinary stores it
 * happily, but Chrome and Firefox cannot decode HEIC at all — so the crop dialog
 * and every admin thumbnail rendered a broken image, and there was no way to
 * crop a photo taken on a phone. `f_auto` hands back whatever the requesting
 * browser accepts, which for a HEIC source means a real conversion rather than a
 * rename.
 *
 * The public site never hit this: `next/image` goes through the custom loader,
 * which already appends `f_auto`. Only the admin, which deliberately uses plain
 * `<img>` for arbitrary remote assets, was left decoding the original bytes.
 *
 * Deliberately ignores any stored crop — the crop dialog draws its rectangle
 * over the *whole* image, and a pre-cropped preview would let a second crop
 * compound on the first.
 */
export function cloudinaryPreview(src: string, width = 1200): string {
  return withTransform(src, `f_auto,q_auto,w_${width},c_limit`);
}

/** Dimensions after the stored crop, used for grid layout and lightbox sizing. */
export function croppedSize(image: TransformableImage): { width: number; height: number } {
  const { crop, width = 0, height = 0 } = image;
  if (!crop || !width || !height) return { width, height };

  return {
    width: Math.max(1, Math.round(crop.w * width)),
    height: Math.max(1, Math.round(crop.h * height)),
  };
}

/**
 * Images taller than twice their width get the framed treatment.
 *
 * Derived rather than stored: a flag would be one more thing to keep in sync
 * with a crop that can change the shape underneath it.
 */
export const LONG_RATIO = 2;

export function isLong(image: TransformableImage): boolean {
  const { width, height } = croppedSize(image);
  return Boolean(width && height && height / width > LONG_RATIO);
}
