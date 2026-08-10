import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";

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

type CardOwnProps = VariantProps<typeof card> & {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Polymorphic props: whatever element `as` names, its own props come with it.
 * Without this, `<Card as={Link} href={…}>` fails to typecheck — and casting
 * around that would throw away the checking that makes `as` safe at all.
 */
type CardProps<T extends ElementType> = CardOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | "as">;

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
export function Card<T extends ElementType = "div">({
  children,
  className,
  variant,
  tier,
  padding,
  interactive,
  as,
  style,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag
      data-surface={variant ?? "flat"}
      className={cn(card({ variant, tier, padding, interactive }), className)}
      style={{ "--surface-pad": PAD[padding ?? "md"], ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
