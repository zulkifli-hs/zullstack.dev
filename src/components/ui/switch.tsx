"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

/**
 * Switch — the track carries the material, the thumb does not.
 *
 * Apple: toggles "transform into Liquid Glass during interaction". The track is
 * the container of the control, so it owns the one backdrop-filter; the thumb
 * stays a solid physical object floating *in* the glass. Blurring a 24px circle
 * would be invisible anyway and would double the cost for nothing.
 */
export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-surface="glass"
      className={cn(
        "glass surface-xs lift relative inline-flex h-7 w-12 shrink-0 items-center p-0.5",
        "[--surface-radius:9999px]",
        "data-checked:[--glass-base:var(--primary)] data-checked:[--tier-tint:1.6]",
        "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "relative z-3 size-6 rounded-full bg-white shadow-[0_1px_3px_oklch(0_0_0/0.25)]",
          "transition-transform duration-200 ease-glass",
          "data-checked:translate-x-5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
