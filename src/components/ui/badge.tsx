import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Small status / metadata marker.
 *
 * Replaces three separate hand-rolled pills: the admin status pill (built twice,
 * in entity-row and comment-row), and the `Tag` in lab/section.tsx.
 *
 * `tone` carries meaning, not decoration — Apple's rule for tinting. `signal`
 * resolves through the theme-aware token, so the brand green is never used raw
 * on a light background where it sits at 1.47:1.
 */
const badge = cva(
  "lab-label inline-flex items-center gap-1 rounded-full border px-2.5 py-1 whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-hairline text-muted-foreground",
        signal: "border-signal/40 text-signal",
        destructive: "border-destructive/40 text-destructive",
        brand: "border-link/40 text-link",
      },
      /** Squared-off variant for tech-stack chips, which read as data not status. */
      shape: {
        pill: "rounded-full",
        tag: "bg-secondary/40 rounded-md px-2 py-0.5 font-mono text-[0.6875rem] normal-case tracking-normal",
      },
    },
    defaultVariants: { tone: "neutral", shape: "pill" },
  },
);

export function Badge({
  className,
  tone,
  shape,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span data-slot="badge" className={cn(badge({ tone, shape }), className)} {...props} />;
}

/**
 * Interactive variant, for the admin publish/unpublish toggle.
 *
 * A `<span>` cannot be clicked accessibly, and the two hand-rolled versions of
 * this were `<button>`s with no focus ring at all.
 */
export function BadgeButton({
  className,
  tone,
  shape,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof badge>) {
  return (
    <button
      type="button"
      data-slot="badge-button"
      className={cn(
        badge({ tone, shape }),
        "lift hover:bg-secondary/40 transition-colors",
        "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
