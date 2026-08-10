"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * Slider — the thumb carries the material, the track does not.
 *
 * The inverse of Switch, and for a concrete reason: the track has to show a
 * crisp fill, and blurring it would obliterate the value indication that is the
 * control's entire job.
 *
 * Apple's slider behaviour during drag is the thumb growing and the track
 * thickening, which is what the `data-dragging` sizes do.
 */
export function Slider({ className, ...props }: SliderPrimitive.Root.Props) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="flex h-6 w-full items-center">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "bg-secondary relative h-1.5 w-full rounded-full",
            "transition-[height] duration-150 ease-glass has-data-dragging:h-2.5",
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-indicator"
            className="bg-primary rounded-full"
          />
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            data-surface="glass"
            className={cn(
              "glass surface-xs lift size-4 [--surface-radius:9999px]",
              "transition-[width,height] duration-150 ease-glass data-dragging:size-5",
              "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25",
            )}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
