"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";

import { cn } from "@/lib/utils";

/**
 * Segmented control — the track carries the material, the items do not.
 *
 * This is the clearest case of the layering rule: one backdrop-filter on the
 * container, and the items inside are flat. The nesting guard in globals.css
 * enforces it in the cascade even if an item is given a glass class by mistake.
 */
export function Segmented({ className, ...props }: ToggleGroup.Props) {
  return (
    <ToggleGroup
      data-slot="segmented"
      data-surface="glass"
      className={cn("glass surface-sm inline-flex gap-0.5 p-0.5", className)}
      style={{ "--surface-pad": "0.125rem" } as React.CSSProperties}
      {...props}
    />
  );
}

export function SegmentedItem({ className, ...props }: Toggle.Props) {
  return (
    <Toggle
      data-slot="segmented-item"
      className={cn(
        // Concentric with the track: inner radius = track radius − its padding.
        "rounded-concentric lift relative z-3 px-3 py-1.5 text-sm font-medium whitespace-nowrap",
        "text-muted-foreground transition-colors",
        "hover:text-foreground",
        "data-pressed:bg-secondary data-pressed:text-foreground",
        "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
