"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cloudinaryPreview } from "@/lib/images/cloudinary";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CROP_RATIOS, type CropRatio, type CropRect } from "@/lib/content-enums";
import { cn } from "@/lib/utils";

/** Numeric aspect (w/h) per preset. `original` and `free` are unconstrained. */
const RATIO_VALUES: Record<CropRatio, number | null> = {
  original: null,
  free: null,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
  "9:16": 9 / 16,
  "21:9": 21 / 9,
};

const FULL: CropRect = { x: 0, y: 0, w: 1, h: 1 };

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

const HANDLES: { id: Handle; className: string; cursor: string }[] = [
  { id: "nw", className: "top-0 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "nwse-resize" },
  { id: "n", className: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", cursor: "ns-resize" },
  { id: "ne", className: "top-0 right-0 translate-x-1/2 -translate-y-1/2", cursor: "nesw-resize" },
  { id: "e", className: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
  { id: "se", className: "bottom-0 right-0 translate-x-1/2 translate-y-1/2", cursor: "nwse-resize" },
  { id: "s", className: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", cursor: "ns-resize" },
  { id: "sw", className: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2", cursor: "nesw-resize" },
  { id: "w", className: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2", cursor: "ew-resize" },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Smallest crop, as a fraction — below this the handles overlap each other. */
const MIN_SIZE = 0.05;

/**
 * Centres the largest rectangle of a given aspect that fits the image.
 *
 * `aspect` is in image space (w/h of the final crop), but the rectangle is
 * stored in *fractions of the image*, so the image's own aspect has to be
 * divided out — otherwise "1:1" would come out square only for square images.
 */
function fitRatio(aspect: number, imageAspect: number): CropRect {
  const relative = aspect / imageAspect;

  const w = relative >= 1 ? 1 : relative;
  const h = relative >= 1 ? 1 / relative : 1;

  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/**
 * Non-destructive crop.
 *
 * Nothing is re-uploaded and no pixels are written: the dialog produces a
 * rectangle in normalised coordinates, and Cloudinary applies it at delivery.
 * That is what lets a crop be adjusted or removed later with the original still
 * intact — and why `original` is a real state rather than "a crop covering
 * everything".
 */
export function ImageCropDialog({
  open,
  onOpenChange,
  url,
  width,
  height,
  crop,
  ratio,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  width?: number;
  height?: number;
  crop?: CropRect | null;
  ratio?: CropRatio;
  onApply: (crop: CropRect | null, ratio: CropRatio) => void;
}) {
  const [rect, setRect] = useState<CropRect>(crop ?? FULL);
  const [active, setActive] = useState<CropRatio>(ratio ?? "original");
  const frameRef = useRef<HTMLDivElement>(null);

  const imageAspect = width && height ? width / height : 1;

  function pickRatio(next: CropRatio) {
    setActive(next);

    const aspect = RATIO_VALUES[next];
    if (next === "original") setRect(FULL);
    else if (aspect) setRect(fitRatio(aspect, imageAspect));
    // `free` keeps whatever rectangle is currently drawn.
  }

  /**
   * One pointer handler for dragging the box and all eight handles.
   *
   * Pointer capture rather than window listeners: it keeps the drag alive when
   * the cursor leaves the frame — which it constantly does when pulling an edge
   * outward — and releases automatically if the pointer is cancelled.
   */
  const startDrag = useCallback(
    (handle: Handle) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const frame = frameRef.current;
      if (!frame) return;

      const bounds = frame.getBoundingClientRect();
      const origin = { x: event.clientX, y: event.clientY };
      const start = rect;
      const aspect = RATIO_VALUES[active];
      const relative = aspect ? aspect / imageAspect : null;

      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture(event.pointerId);

      const onMove = (move: PointerEvent) => {
        const dx = (move.clientX - origin.x) / bounds.width;
        const dy = (move.clientY - origin.y) / bounds.height;

        if (handle === "move") {
          setRect({
            ...start,
            x: clamp01(Math.min(start.x + dx, 1 - start.w)),
            y: clamp01(Math.min(start.y + dy, 1 - start.h)),
          });
          return;
        }

        let { x, y, w, h } = start;

        if (handle.includes("w")) {
          const next = clamp01(start.x + dx);
          w = Math.max(MIN_SIZE, start.x + start.w - next);
          x = start.x + start.w - w;
        }
        if (handle.includes("e")) {
          w = Math.max(MIN_SIZE, Math.min(1 - start.x, start.w + dx));
        }
        if (handle.includes("n")) {
          const next = clamp01(start.y + dy);
          h = Math.max(MIN_SIZE, start.y + start.h - next);
          y = start.y + start.h - h;
        }
        if (handle.includes("s")) {
          h = Math.max(MIN_SIZE, Math.min(1 - start.y, start.h + dy));
        }

        // A locked ratio derives the other axis rather than letting both drift.
        if (relative) {
          if (handle === "n" || handle === "s") w = Math.min(1 - x, h * relative);
          else h = Math.min(1 - y, w / relative);

          if (handle.includes("n")) y = Math.min(start.y + start.h - h, 1 - h);
          if (handle.includes("w")) x = Math.min(start.x + start.w - w, 1 - w);
        }

        setRect({ x: clamp01(x), y: clamp01(y), w, h });
      };

      const onUp = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [rect, active, imageAspect],
  );

  const isFull = rect.w >= 0.999 && rect.h >= 0.999;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-3xl p-5 sm:p-6">
        <DialogTitle className="text-lg font-semibold tracking-tight">Crop</DialogTitle>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {CROP_RATIOS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => pickRatio(option)}
              className={cn(
                "border-hairline rounded-full border px-3 py-1 font-mono text-xs transition-colors",
                active === option
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "text-muted-foreground hover:border-ring hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {/* The frame shrink-wraps the image rather than being a full-width box
            the image is letterboxed inside. The overlay is positioned in
            percentages, so if the frame were wider than the rendered image —
            which is exactly what happens to a tall screenshot under
            `object-contain` — every crop coordinate would be measured against
            empty space beside the picture. */}
        <div className="mt-4 flex justify-center">
          <div
            ref={frameRef}
            className="bg-secondary/30 relative max-h-[60vh] touch-none overflow-hidden rounded-lg select-none"
          >
            {/* Plain <img>: an admin preview of an arbitrary remote asset, which
                next/image would require in remotePatterns first — and the crop
                maths needs the element's own box, not a fill wrapper.

                Served through `cloudinaryPreview` so a HEIC original arrives as
                something the browser can decode. Without it this element was
                simply blank for every photo taken on a phone. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cloudinaryPreview(url)}
              alt=""
              draggable={false}
              className="block max-h-[60vh] w-auto max-w-full object-contain"
            />

            <div
              onPointerDown={startDrag("move")}
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
                // An enormous shadow spread dims everything outside the selection
                // in one paint. A separate overlay element would have to be
                // punched through with a mask to leave the selection crisp.
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              }}
              className="absolute cursor-move outline-2 outline-white/90"
            >
              {HANDLES.map((handle) => (
                <span
                  key={handle.id}
                  onPointerDown={startDrag(handle.id)}
                  style={{ cursor: handle.cursor }}
                  className={cn(
                    "absolute size-3 rounded-full border-2 border-white bg-black/70",
                    handle.className,
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground font-mono text-xs">
            {isFull
              ? "No crop — full image"
              : width && height
                ? `${Math.round(rect.w * width)}×${Math.round(rect.h * height)}`
                : `${Math.round(rect.w * 100)}% × ${Math.round(rect.h * 100)}%`}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setRect(FULL);
                setActive("original");
              }}
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // A full-frame rectangle is stored as "no crop", so the delivery
                // URL stays clean and `original` round-trips honestly.
                onApply(isFull ? null : rect, isFull ? "original" : active);
                onOpenChange(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
