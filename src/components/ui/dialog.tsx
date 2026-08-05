"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

/**
 * The scrim DIMS, it does not blur.
 *
 * Blurring the scrim *and* the dialog is glass-on-glass by another name, and it
 * defeats the effect: a lens needs crisp geometry behind it to visibly bend, and
 * a pre-blurred scrim leaves nothing to bend. Dimming also costs one paint
 * instead of a second full-viewport backdrop snapshot — the single most
 * expensive blur on any page.
 */
export function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-[oklch(0.22_0.02_265_/_0.42)] dark:bg-[oklch(0_0_0_/_0.62)]",
        "duration-150 data-open:animate-in data-open:fade-in-0",
        "data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

const dialogPopup = cva(
  "glass surface-lg fixed z-50 outline-none duration-200 " +
    "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
  {
    variants: {
      side: {
        center:
          "top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-6 " +
          "data-open:zoom-in-95 data-closed:zoom-out-95",
        /** Command-palette position: near the top, where the eye already is. */
        top: "top-[12vh] left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 " +
          "data-open:slide-in-from-top-4 data-closed:slide-out-to-top-4",
        right:
          "inset-y-0 right-0 h-full w-full max-w-md p-6 [--surface-radius:var(--radius-2xl)_0_0_var(--radius-2xl)] " +
          "data-open:slide-in-from-right data-closed:slide-out-to-right",
        bottom:
          "inset-x-0 bottom-0 w-full p-6 [--surface-radius:var(--radius-2xl)_var(--radius-2xl)_0_0] " +
          "data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
      },
    },
    defaultVariants: { side: "center" },
  },
);

export function DialogContent({
  className,
  children,
  side,
  showClose = true,
  ...props
}: DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogPopup> & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-surface="glass"
        className={cn(dialogPopup({ side }), className)}
        {...props}
      >
        {children}

        {showClose && (
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close"
                className="absolute top-4 right-4 [--surface-radius:9999px]"
              >
                <X className="size-4" />
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

/** A dialog anchored to an edge. Same machinery, different `side`. */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export function SheetContent({
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return <DialogContent side={side} {...props} />;
}
