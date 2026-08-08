"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Locale } from "@/i18n/routing";
import { pick } from "@/lib/utils";
import type { GalleryImage } from "@/types/content";

/**
 * Screenshots of work that cannot be reached publicly.
 *
 * Each image is laid out at its own aspect ratio rather than cropped into a
 * uniform tile: a project is routinely a web app, a phone app and a CMS, and
 * forcing a 9:16 phone capture into a 16:9 box would cut away the exact thing
 * it was included to show. Declaring the real dimensions also means the grid
 * reserves the right space before the image loads, so nothing shifts.
 *
 * Images with unknown dimensions fall back to 3:2, which is close enough for a
 * screenshot to look deliberate rather than broken.
 */
export function ProjectGallery({
  images,
  locale,
  title,
}: {
  images: GalleryImage[];
  locale: Locale;
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };

    // Escape is the dialog's own job; only the arrows need handling here.
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, step]);

  if (images.length === 0) return null;

  const active = openIndex === null ? null : images[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image, index) => {
          const ratio = image.width && image.height ? image.width / image.height : 3 / 2;
          // Portrait captures earn a full column; landscape ones sit two-up so a
          // phone screenshot is not rendered postage-stamp sized next to them.
          const portrait = ratio < 0.9;

          return (
            <li
              key={image.publicId || image.url}
              className={portrait ? "row-span-2" : "col-span-2 sm:col-span-2"}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="border-hairline/60 hover:border-ring group block w-full overflow-hidden rounded-xl border transition-colors"
              >
                <Image
                  src={image.url}
                  alt={pick(image.alt, locale) || pick(image.caption, locale) || title}
                  width={image.width ?? 1200}
                  height={image.height ?? 800}
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>

              {pick(image.caption, locale) && (
                <p className="text-muted-foreground mt-2 text-xs text-pretty">
                  {pick(image.caption, locale)}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-5xl p-4 sm:p-6">
          <DialogTitle className="sr-only">{title}</DialogTitle>

          {active && (
            <>
              <Image
                src={active.url}
                alt={pick(active.alt, locale) || pick(active.caption, locale) || title}
                width={active.width ?? 1600}
                height={active.height ?? 1000}
                quality={90}
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="mx-auto max-h-[74vh] w-auto rounded-lg object-contain"
              />

              <div className="mt-4 flex items-center gap-4">
                <p className="text-muted-foreground min-w-0 flex-1 text-sm text-pretty">
                  {pick(active.caption, locale)}
                </p>

                {images.length > 1 && (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground tabular font-mono text-xs">
                      {(openIndex ?? 0) + 1}/{images.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Previous image"
                      className="border-hairline hover:border-ring rounded-full border p-1.5 transition-colors"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Next image"
                      className="border-hairline hover:border-ring rounded-full border p-1.5 transition-colors"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
