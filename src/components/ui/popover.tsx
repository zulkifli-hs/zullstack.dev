"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverTitle = PopoverPrimitive.Title;
export const PopoverDescription = PopoverPrimitive.Description;
export const PopoverClose = PopoverPrimitive.Close;

/**
 * Popover — `surface-md`, the overlay tier.
 *
 * That tier deliberately sets `--surface-contain: none`, because `contain: paint`
 * would clip anything anchored or overflowing out of the popup.
 *
 * Like the dropdown menu, this is portaled to <body>, so the descendant nesting
 * guard cannot reach it when it opens over the blurred header — the tier-blur
 * cap is what keeps the two from stacking into mud.
 */
export function PopoverContent({
  className,
  sideOffset = 6,
  align = "center",
  // Anything anchored near the bottom of the viewport — the mobile contact
  // button — has to open upward; Base UI flips automatically, but only if it is
  // told which side to prefer.
  side,
  children,
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        sideOffset={sideOffset}
        align={align}
        side={side}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          data-surface="glass"
          className={cn(
            "glass surface-md [--tier-blur:0.9] w-72 p-4 outline-none",
            "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          style={{ "--surface-pad": "1rem" } as React.CSSProperties}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
