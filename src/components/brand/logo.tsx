import Image from "next/image";

import { cn } from "@/lib/utils";

const LIGHT_BG = "/brand/horizontal_rectangle-two_tone_logo-black_text.png";
const DARK_BG = "/brand/horizontal_rectangle-two_tone_logo-white_text.png";

/** Intrinsic size of the supplied artwork; the ratio drives every rendered size. */
const INTRINSIC = { width: 1563, height: 469 };

/**
 * The full brand lockup — flask, "Zullstack" wordmark and the tagline, exactly
 * as supplied.
 *
 * The wordmark is part of the artwork, so nothing should print "zullstack.dev"
 * or the tagline beside it; that would show the same words twice.
 *
 * The two files differ only in wordmark colour, and the background is
 * transparent — so the wrong variant makes the wordmark *invisible*, not merely
 * low-contrast. Both are rendered and swapped with CSS rather than by reading
 * the active theme in JS: `next-themes` only knows the theme after hydration,
 * so a JS swap would flash the wrong variant on first paint.
 */
export function Logo({
  className,
  priority = false,
}: {
  /** Set the height; width follows from the aspect ratio. */
  className?: string;
  priority?: boolean;
}) {
  const common = {
    ...INTRINSIC,
    priority,
    // Rendered at most ~200px wide, so this stops the browser fetching a
    // source far larger than it can display.
    sizes: "220px",
    className: cn("w-auto", className),
  };

  // Only one variant is ever visible, so only one carries the accessible name.
  // Labelling both would announce the brand twice to a screen reader.
  const label = "Zullstack — Your Software Lab Partner";

  return (
    <>
      <Image
        {...common}
        src={LIGHT_BG}
        alt={label}
        className={cn(common.className, "dark:hidden")}
      />
      <Image
        {...common}
        src={DARK_BG}
        alt=""
        aria-hidden
        className={cn(common.className, "hidden dark:block")}
      />
    </>
  );
}
