import { cn } from "@/lib/utils";

/**
 * Stands in for a project that has no cover image yet.
 *
 * Without one, a card simply had no media band at all, so a grid of projects
 * came out ragged — some cards opening on a photo, others on a heading — and
 * the ones missing an image read as unfinished rather than as work that has no
 * public screenshot. Which is most of them: a private client system often
 * cannot show anything at all.
 *
 * So this is drawn rather than fetched. It reuses the page substrate — the
 * blueprint grid and the brand mesh from `LabBackground` — so the placeholder
 * looks like part of the site's material instead of a missing-image icon.
 */

/** Glow placements, picked per project so a grid of them is not one repeated tile. */
const GLOWS = [
  "-top-1/3 -left-1/4 bg-brand-600/25 dark:bg-brand-600/30",
  "-top-1/4 -right-1/4 bg-accent-400/20 dark:bg-accent-500/25",
  "-bottom-1/3 -left-1/5 bg-accent-500/20 dark:bg-accent-400/20",
  "-bottom-1/4 -right-1/5 bg-brand-400/25 dark:bg-brand-700/30",
];

/**
 * Stable bucket for a string.
 *
 * Deterministic on purpose: the same project must draw the same placeholder on
 * the server and in the browser, or hydration mismatches — and it should not
 * change shape every time the list is re-rendered.
 */
function bucket(value: string, buckets: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % buckets;
}

/**
 * Two letters from the project's name.
 *
 * Titles here are routinely `Name — What It Does`, and the descriptive half
 * makes for a poor monogram, so only the part before the dash is considered.
 */
function monogram(title: string): string {
  const name = title.split(/\s[—–-]\s/)[0].trim();
  const words = name.split(/[\s_-]+/).filter(Boolean);

  if (words.length === 0) return "··";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ProjectCoverFallback({
  title,
  seed,
  className,
}: {
  title: string;
  /** Anything stable per project; the slug is the obvious choice. */
  seed: string;
  className?: string;
}) {
  return (
    <div
      // The title is rendered as real text directly below, so announcing this
      // as well would just repeat it.
      aria-hidden
      className={cn("bg-card/30 relative overflow-hidden", className)}
    >
      <div className={cn("absolute h-[120%] w-[70%] rounded-full blur-3xl", GLOWS[bucket(seed, GLOWS.length)])} />

      {/* Masked so the grid dissolves toward the edges rather than ending on a
          hard line, exactly as it does on the page behind the card. */}
      <div className="lab-grid absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_100%)]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-foreground/25 font-mono text-4xl font-semibold tracking-[0.2em] select-none">
          {monogram(title)}
        </span>
      </div>
    </div>
  );
}
