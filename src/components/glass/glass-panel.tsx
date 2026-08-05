import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

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
      {interactive ? (
        <SpecularLayer />
      ) : (
        <span
          aria-hidden
          data-sheen
          className="glass-sheen pointer-events-none absolute inset-0 z-1 rounded-[inherit]"
        />
      )}

      {isGlass && grain && (
        <span
          aria-hidden
          data-grain
          className="glass-grain pointer-events-none absolute inset-0 z-2 rounded-[inherit]"
        />
      )}

      <div className="relative z-3">{children}</div>
    </Tag>
  );
}
