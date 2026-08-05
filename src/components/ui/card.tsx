import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const card = cva("relative", {
  variants: {
    variant: {
      /**
       * The content layer. No backdrop-filter — Apple is explicit that glass
       * does not belong on content, and a grid of blurred cards is the
       * documented cause of frame drops on mid-range hardware.
       */
      flat: "glass-flat",
      /** Only for a card that is genuinely part of the control layer. */
      glass: "glass",
    },
    tier: {
      sm: "surface-sm",
      md: "surface-md",
      lg: "surface-lg",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    /** Adds the hover/press lift. Only for cards that are actually clickable. */
    interactive: { true: "lift", false: "" },
  },
  defaultVariants: { variant: "flat", tier: "md", padding: "md", interactive: false },
});

/** Matches the `padding` variants, in units the concentric maths can subtract. */
const PAD = { none: "0px", sm: "1rem", md: "1.5rem", lg: "2rem" } as const;

type CardProps = VariantProps<typeof card> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
};

/**
 * A content surface.
 *
 * Publishes `--surface-pad` so descendants can read `--concentric-radius` —
 * Apple's containerConcentric, where an inner radius is the outer radius minus
 * the padding, keeping nested corners visually parallel instead of arbitrary.
 *
 * `data-surface` is load-bearing: it drives the no-glass-on-glass cascade guard
 * and the forced-colors reset in globals.css.
 */
export function Card({
  children,
  className,
  variant,
  tier,
  padding,
  interactive,
  as: Tag = "div",
  style,
}: CardProps) {
  return (
    <Tag
      data-surface={variant ?? "flat"}
      className={cn(card({ variant, tier, padding, interactive }), className)}
      style={{ "--surface-pad": PAD[padding ?? "md"], ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
