import { cva, type VariantProps } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SpecularLayer } from "./specular-layer";

const glassPanel = cva("relative", {
  variants: {
    variant: {
      /** Full Liquid Glass. Costs a backdrop-filter — budget ~3 per viewport. */
      glass: "glass",
      /** Glass plus Chromium-only edge refraction. Hero elements only. */
      lens: "glass glass-lens",
      /** No backdrop-filter. Use for repeated surfaces such as grid cards. */
      flat: "glass-flat",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8 md:p-10",
    },
  },
  defaultVariants: { variant: "glass", padding: "md" },
});

type GlassPanelProps = VariantProps<typeof glassPanel> & {
  children: ReactNode;
  className?: string;
  /** Renders the pointer-tracked specular highlight. Costs a client component. */
  interactive?: boolean;
  /** Adds grain. Worth it on large surfaces, noise on small ones. */
  grain?: boolean;
  as?: ElementType;
};

/**
 * A Liquid Glass surface.
 *
 * Server component by default — `interactive` is what pulls a client component
 * in, and only for the highlight layer, so pages stay server-rendered.
 *
 * Two rules this component cannot enforce but callers must follow:
 *   1. Never nest a `glass` panel inside another `glass` panel. Apple forbids it
 *      and nested backdrop-filters multiply compositor snapshot cost.
 *   2. Never put body copy on glass. Labels, icons and short strings only,
 *      weight >= 500 — 400-weight text dissolves into the blur.
 */
export function GlassPanel({
  children,
  className,
  variant,
  padding,
  interactive = false,
  grain = false,
  as: Tag = "div",
}: GlassPanelProps) {
  const isGlass = variant !== "flat";

  return (
    <Tag className={cn(glassPanel({ variant, padding }), className)}>
      {isGlass &&
        (interactive ? (
          <SpecularLayer />
        ) : (
          <span
            aria-hidden
            className="glass-sheen pointer-events-none absolute inset-0 z-1 rounded-[inherit]"
          />
        ))}

      {isGlass && grain && (
        <span
          aria-hidden
          className="glass-grain pointer-events-none absolute inset-0 z-2 rounded-[inherit]"
        />
      )}

      <div className="relative z-3">{children}</div>
    </Tag>
  );
}
