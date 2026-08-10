import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { LensAuto } from "./lens-auto";
import { SpecularLayer } from "./specular-layer";

const glassPanel = cva("relative", {
  variants: {
    variant: {
      /** Full Liquid Glass. Costs a backdrop-filter — budget ~3 per viewport. */
      glass: "glass",
      /** Glass plus Chromium-only edge refraction. Hero elements only. */
      lens: "glass glass-lens",
      /** No backdrop-filter. The content layer, where Apple says glass does not belong. */
      flat: "glass-flat",
    },
    /** Scales radius, blur, tint, rim and shadow together. */
    tier: {
      xs: "surface-xs",
      sm: "surface-sm",
      md: "surface-md",
      /** Content cards — same radius as `md`, denser tint for body copy. */
      card: "surface-card",
      lg: "surface-lg",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8 md:p-10",
    },
  },
  defaultVariants: { variant: "glass", tier: "lg", padding: "md" },
});

/**
 * Padding in the same units the tier maths expects.
 *
 * Published as `--surface-pad` so children can derive a concentric radius
 * (Apple's `containerConcentric`: inner = outer − padding). Kept in TS rather
 * than as parallel `p-*` utilities so it stays a Server Component.
 */
const PAD = { none: "0px", sm: "1rem", md: "1.5rem", lg: "2rem" } as const;

type GlassPanelProps = VariantProps<typeof glassPanel> & {
  children: ReactNode;
  className?: string;
  /** Pointer-tracked specular highlight and press illumination. */
  interactive?: boolean;
  /** Adds grain. Worth it on large surfaces, noise on small ones. */
  grain?: boolean;
  as?: ElementType;
  style?: CSSProperties;
};

/**
 * A Liquid Glass surface.
 *
 * Server component by default — `interactive` is what pulls a client component
 * in, and only for the highlight layer, so pages stay server-rendered.
 *
 * `data-surface` is not decorative: it drives the no-glass-on-glass cascade
 * guard and the `forced-colors` reset in globals.css. A surface that omits it
 * silently opts out of both.
 */
export function GlassPanel({
  children,
  className,
  variant,
  tier,
  padding,
  interactive = false,
  grain = false,
  as: Tag = "div",
  style,
}: GlassPanelProps) {
  const isGlass = variant !== "flat";

  return (
    <Tag
      data-surface={variant ?? "glass"}
      className={cn(glassPanel({ variant, tier, padding }), className)}
      style={{ "--surface-pad": PAD[padding ?? "md"], ...style } as CSSProperties}
    >
      {/*
        Sheen and grain sit at z-index -1, not above the content.

        The obvious construction — layers at z-1/z-2 and the content lifted into
        a `z-3` wrapper — was what this did, and it quietly broke every panel
        that carries a layout class: `flex`/`grid` on the panel would apply to
        that single wrapper instead of to the children, so `<GlassPanel
        className="flex">` had exactly one flex item.

        Negative z-index gets the same paint order for free. Within this
        element's stacking context (`isolation: isolate`), negative-z descendants
        paint after the element's own background but *before* in-flow content —
        so the highlight lies on the material and the text stays above it, with
        the children as real children of the panel.
      */}
      {/* Measures the panel and swaps in a lens generated at its real size.
          Renders nothing; the static tier map covers first paint and the
          no-worker case. */}
      {variant === "lens" && <LensAuto />}

      {interactive ? (
        <SpecularLayer />
      ) : (
        <span
          aria-hidden
          data-sheen
          className="glass-sheen pointer-events-none absolute inset-0 -z-1 rounded-[inherit]"
        />
      )}

      {isGlass && grain && (
        <span
          aria-hidden
          data-grain
          className="glass-grain pointer-events-none absolute inset-0 -z-1 rounded-[inherit]"
        />
      )}

      {children}
    </Tag>
  );
}
