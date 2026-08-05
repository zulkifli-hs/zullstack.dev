import { cn } from "@/lib/utils";

/**
 * The Zullstack mark: a blue laboratory flask with a green "Z" suspended inside.
 *
 * Redrawn as vector geometry rather than shipped as the source PNG so it stays
 * crisp at any size and so the two brand colours stay tied to theme tokens.
 * Strokes are round-capped and round-joined, matching the original.
 *
 * Colours are the raw brand values on purpose — this is the logo, and a logo
 * does not shift hue with the theme. Only the wordmark beside it uses
 * `currentColor`, which is what lets one asset serve both light and dark.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 400"
      role="img"
      aria-label="Zullstack"
      className={cn("size-6", className)}
      fill="none"
      strokeWidth="34"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Flask: neck lip, right shoulder down to the base, along the bottom,
          then a short rise on the left. Deliberately open on the upper left so
          the Z reads as sitting inside the vessel. */}
      <path
        d="M262 22 H330 M282 22 V96 L438 366 H42 L86 290"
        stroke="#326afd"
      />
      {/* The Z, drawn as three strokes: top bar, diagonal, bottom bar. */}
      <path d="M126 22 H228 L96 244 H258" stroke="#92ec47" />
      {/* Counterweight dot to the right of the Z's baseline. */}
      <circle cx="310" cy="244" r="19" fill="#92ec47" />
    </svg>
  );
}
