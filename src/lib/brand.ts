import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";

/**
 * The brand assets, exactly as supplied.
 *
 * The wordmark and tagline are baked into the horizontal lockups, which is why
 * nothing in the UI prints "zullstack.dev" or the tagline alongside the logo.
 */
export const BRAND = {
  /** White wordmark — for dark backgrounds only. */
  lockupOnDark: "horizontal_rectangle-two_tone_logo-white_text.png",
  /** Black wordmark — for light backgrounds only. */
  lockupOnLight: "horizontal_rectangle-two_tone_logo-black_text.png",
  squareOnDark: "square-two_tone_logo-white_text.png",
  squareMarkOnly: "square-two_tone_logo-no_text.png",
} as const;

/**
 * Icons, declared explicitly rather than via `app/icon.*` file conventions.
 *
 * The generated set lives under `public/favicon/` where it was produced, and
 * pointing at it directly avoids duplicating the same images into `src/app/`
 * just to satisfy a naming convention.
 */
export const ICONS: Metadata["icons"] = {
  icon: [
    { url: "/favicon/favicon.ico", sizes: "any" },
    { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
  ],
  apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
};

/**
 * Reads a brand PNG off disk and returns it as a data URI.
 *
 * `next/og` renders in an isolated environment with no access to the site's own
 * origin, so an `/brand/...` path would not resolve — and an absolute URL would
 * depend on the deployment being reachable while it builds its own OG image.
 * Inlining the bytes sidesteps both.
 */
export async function brandDataUri(file: string): Promise<string> {
  const buffer = await readFile(path.join(process.cwd(), "public", "brand", file));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
