import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Every size carries a surface tier, and the tier owns the radius — which is
 * why `rounded-*` is gone from the size strings. That collapses what used to be
 * six competing radius systems (`--glass-radius`, rounded-lg/md/full, and two
 * `rounded-[min(var(--radius-md),Npx)]` one-offs) into one scale.
 *
 * `lift` supersedes the old `active:translate-y-px`; the two would fight for the
 * same transform.
 *
 * Focus pairs an inset ring with an outer ring: the inset survives a
 * `contain: paint` ancestor, the outer carries WCAG 2.4.13 contrast.
 */
const buttonVariants = cva(
  "group/button lift inline-flex shrink-0 items-center justify-center border border-transparent " +
    "bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none " +
    "rounded-[var(--surface-radius)] " +
    "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25 " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:inset-ring-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
        /** Translucent secondary action — Apple's `.buttonStyle(.glass)`. */
        glass: "glass [--glass-base:var(--card)]",
        /** Primary action — Apple's `.buttonStyle(.glassProminent)`. */
        glassProminent:
          "glass text-primary-foreground [--glass-base:var(--primary)] [--tier-tint:1.55]",
      },
      size: {
        default:
          "surface-sm h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "surface-xs h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "surface-xs h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "surface-sm h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        /** The shape the six duplicated CTA strings become. */
        pill: "surface-sm h-11 gap-2 px-5 [--surface-radius:9999px]",
        icon: "surface-sm size-8",
        "icon-xs": "surface-xs size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "surface-xs size-7",
        "icon-lg": "surface-sm size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const isGlass = variant === "glass" || variant === "glassProminent";

  return (
    <ButtonPrimitive
      data-slot="button"
      // Drives the no-glass-on-glass cascade guard and the forced-colors reset.
      data-surface={isGlass ? "glass" : "flat"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
