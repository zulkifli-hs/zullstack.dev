"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Checkbox — a control, so it gets the material and lifts on interaction.
 *
 * `surface-xs` keeps the blur small enough to be cheap at 16px while the denser
 * tier tint keeps it legible; a control this size has too little area to
 * establish material at panel alpha.
 *
 * Replaces the bare `<input type="checkbox" className="accent-primary">` in
 * entity-form, which had no focus ring and no indeterminate state.
 */
export function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-surface="glass"
      className={cn(
        "glass surface-xs lift size-4 shrink-0 [--surface-radius:var(--radius-xs)]",
        "flex items-center justify-center",
        "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        "data-checked:[--glass-base:var(--primary)] data-checked:[--tier-tint:1.7]",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="text-primary-foreground relative z-3 flex data-unchecked:hidden"
      >
        <Check className="size-3" strokeWidth={3.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
