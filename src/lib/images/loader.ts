"use client";

import { isCloudinary, withTransform } from "./cloudinary";

/**
 * Custom `next/image` loader — Cloudinary does the optimising, not Next.
 *
 * Every image on this site is already in Cloudinary, so routing them through
 * Next's optimizer meant decoding and re-encoding an asset the CDN could have
 * served correctly in one hop. Delegating hands over format negotiation
 * (`f_auto` serves AVIF where the browser accepts it), quality (`q_auto` reads
 * the image's own content), and sizing in a single transformation — and it is
 * the only way a stored crop and the responsive width can end up in the same
 * URL.
 *
 * Registered via `images.loaderFile`, so it applies to *every* `next/image` in
 * the app. Sources from other hosts are returned untouched and therefore
 * unoptimised — acceptable here, where the only ones are small avatars.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!isCloudinary(src)) return src;

  // `c_limit` never enlarges: asking for a width above the stored one returns
  // the original rather than an upscaled blur.
  const transform = [
    "f_auto",
    `q_auto:${quality && quality >= 90 ? "best" : "good"}`,
    `w_${width}`,
    "c_limit",
  ].join(",");

  // Appended, not prepended — a crop already present in `src` has to be applied
  // before this resize, and Cloudinary reads components left to right.
  return withTransform(src, transform);
}
