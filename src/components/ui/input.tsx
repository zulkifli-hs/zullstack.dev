import { cn } from "@/lib/utils";

/**
 * Text field.
 *
 * Deliberately NOT glass. Apple does not put the material on text fields in the
 * content layer, and blurring behind editable text costs legibility for no gain.
 * It joins the family through the shared rim highlight in `field-surface`.
 *
 * Focus pairs an inset ring with an outer ring: the inset survives a
 * `contain: paint` ancestor, the outer carries WCAG 2.4.13 contrast against the
 * page ground.
 */
export const inputBaseClass =
  "field-surface w-full px-3 py-2 text-sm outline-none transition-shadow " +
  "placeholder:text-muted-foreground " +
  "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25 " +
  "aria-invalid:inset-ring-2 aria-invalid:inset-ring-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 " +
  "disabled:pointer-events-none disabled:opacity-50";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input data-slot="input" data-surface="flat" className={cn(inputBaseClass, className)} {...props} />
  );
}
