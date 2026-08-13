"use client";

import { ChevronLeft, ChevronRight, Maximize2, Minus, MoveVertical, Plus } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Locale } from "@/i18n/routing";
import {
  DEFAULT_GALLERY_COLS,
  DEFAULT_GALLERY_ROWS,
  SPAN_TO_COLS,
  type GalleryCols,
  type GalleryRows,
  type GallerySpan,
} from "@/lib/content-enums";
import { cloudinaryPreview, cloudinarySrc, croppedSize, isLong } from "@/lib/images/cloudinary";
import { cn, pick } from "@/lib/utils";
import type { GalleryGroup, GalleryImage } from "@/types/content";

/**
 * Span classes, written out rather than interpolated.
 *
 * Tailwind scans source text for complete class names, so `col-span-${n}` would
 * compile to nothing at all.
 *
 * Unprefixed, so the bento holds at every width — see the grid below.
 */
const COL_CLASS: Record<GalleryCols, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

const ROW_CLASS: Record<GalleryRows, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
  5: "row-span-5",
  6: "row-span-6",
  7: "row-span-7",
  8: "row-span-8",
  9: "row-span-9",
  10: "row-span-10",
  11: "row-span-11",
  12: "row-span-12",
  13: "row-span-13",
  14: "row-span-14",
  15: "row-span-15",
  16: "row-span-16",
  17: "row-span-17",
  18: "row-span-18",
  19: "row-span-19",
  20: "row-span-20",
  21: "row-span-21",
  22: "row-span-22",
  23: "row-span-23",
  24: "row-span-24",
};

type Labels = {
  /** Shown on the badge over a long capture. */
  long: string;
  ungrouped: string;
};

const colsOf = (image: GalleryImage): GalleryCols =>
  image.cols ?? SPAN_TO_COLS[image.span as GallerySpan] ?? DEFAULT_GALLERY_COLS;

const rowsOf = (image: GalleryImage): GalleryRows => image.rows ?? DEFAULT_GALLERY_ROWS;

/**
 * Screenshots of work that cannot be reached publicly.
 *
 * The grid is a real bento: each image declares how many of the twelve columns
 * *and* how many rows it occupies, so a tall portrait can sit beside two
 * stacked landscapes rather than everything being forced into a single
 * left-to-right flow. `grid-flow-row-dense` then backfills the gaps that
 * leaves.
 *
 * Breakpoints are **container** queries, not viewport ones. The gallery lays
 * itself out against the column it is placed in, which is what lets the CMS
 * preview show a genuine phone layout inside a desktop-sized admin window.
 */
export function ProjectGallery({
  images,
  locale,
  title,
  display = "flat",
  groups = [],
  labels,
  highlight = null,
  onHighlight,
}: {
  images: GalleryImage[];
  locale: Locale;
  title: string;
  display?: "flat" | "grouped";
  groups?: GalleryGroup[];
  labels: Labels;
  /**
   * Index of the cell to ring, and a way to report the one being pointed at.
   *
   * For the CMS, which shows this component beside the list that edits it and
   * has to say which row is which cell. Both are omitted on the public page, and
   * omitting `onHighlight` is what keeps its cells free of pointer handlers.
   *
   * It belongs here rather than in a copy of the grid built for the editor: the
   * preview is only worth having because it *is* the page, and the first time a
   * separate implementation drifted it would be worse than no preview at all.
   */
  highlight?: number | null;
  onHighlight?: (index: number | null) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      ),
    [images.length],
  );

  if (images.length === 0) return null;

  const sections = display === "grouped" ? groupImages(images, groups, labels.ungrouped) : null;

  return (
    <>
      <div className="@container">
        {sections ? (
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.key}>
                {/* `h2`, not `h3`: the page no longer prints a heading above the
                    gallery, so these sit directly under the project's `h1`. */}
                <h2 className="lab-label text-muted-foreground mb-3">
                  {pick(section.label, locale)}
                </h2>
                <Grid
                  entries={section.entries}
                  locale={locale}
                  title={title}
                  labels={labels}
                  onOpen={setOpenIndex}
                  highlight={highlight}
                  onHighlight={onHighlight}
                />
              </section>
            ))}
          </div>
        ) : (
          <Grid
            entries={images.map((image, index) => ({ image, index }))}
            locale={locale}
            title={title}
            labels={labels}
            onOpen={setOpenIndex}
            highlight={highlight}
            onHighlight={onHighlight}
          />
        )}
      </div>

      <Lightbox
        images={images}
        index={openIndex}
        locale={locale}
        title={title}
        onClose={() => setOpenIndex(null)}
        onStep={step}
      />
    </>
  );
}

type Entry = { image: GalleryImage; index: number };

function Grid({
  entries,
  locale,
  title,
  labels,
  onOpen,
  highlight,
  onHighlight,
}: {
  entries: Entry[];
  locale: Locale;
  title: string;
  labels: Labels;
  onOpen: (index: number) => void;
  highlight: number | null;
  onHighlight?: (index: number | null) => void;
}) {
  return (
    <ul
      // The same twelve-column bento at every width. Collapsing to one full
      // width column on a phone turned a dozen screenshots into a dozen screens
      // of scrolling with no overview — and there is no need for a large image
      // here, because tapping one opens it full size anyway.
      //
      // Only the row height changes across breakpoints, and it is chosen to
      // track the column width so a cell keeps roughly its proportions: at
      // 390px a column is ~21px and a row 10px; at 1104px they are ~81px and
      // 44px. A 6x6 cell is 1.67:1 on the phone and 1.68:1 on the desktop.
      //
      // Written out in full — `grid-cols-${COUNT}` would compile to nothing,
      // because Tailwind matches complete class names in source text and never
      // sees the interpolated value.
      className="grid auto-rows-2.5 grid-flow-row-dense grid-cols-12 gap-2 @xl:auto-rows-8 @xl:gap-3 @4xl:auto-rows-11"
    >
      {entries.map(({ image, index }) => {
        const long = isLong(image);
        const contain = image.fit === "contain";
        const size = croppedSize(image);
        const src = cloudinarySrc(image);
        const caption = pick(image.caption, locale);
        const alt = pick(image.alt, locale) || caption || title;

        return (
          <li
            key={image.publicId || image.url}
            // Read by the CMS to scroll a cell into view inside its preview
            // pane. Inert everywhere else, and cheaper than a ref per cell.
            data-gallery-index={index}
            // Only wired up when someone is listening, so the public grid
            // registers no pointer handlers at all.
            onPointerEnter={onHighlight && (() => onHighlight(index))}
            onPointerLeave={onHighlight && (() => onHighlight(null))}
            className={cn(COL_CLASS[colsOf(image)], ROW_CLASS[rowsOf(image)], "min-w-0")}
          >
            <button
              type="button"
              onClick={() => onOpen(index)}
              className={cn(
                "border-hairline/60 hover:border-ring group relative block h-full w-full overflow-hidden rounded-xl border transition-colors",
                // Ring rather than a tint or a dimming of everything else: the
                // preview's whole claim is that it is the page, and this is the
                // least it can add and still answer "which one is this?".
                // `ring-2` survives being scaled down to a phone width, where a
                // hairline would round away to nothing.
                highlight === index && "ring-signal border-signal ring-2",
              )}
            >
              {/* `contain` would otherwise leave bare page behind the image and
                  the cell would read as a gap rather than a card. A blurred
                  enlargement of the image itself fills it without inventing a
                  colour that fights the theme. */}
              {contain && (
                <span
                  aria-hidden
                  className="absolute inset-0 scale-110 bg-cover bg-center opacity-35 blur-2xl"
                  // A CSS background never reaches the image loader, so this
                  // asks Cloudinary directly — for a format the browser can
                  // decode (a HEIC original renders as nothing otherwise), and
                  // at 64px, since the only thing done to it is a 2xl blur.
                  style={{ backgroundImage: `url(${cloudinaryPreview(src, 64)})` }}
                />
              )}

              <Image
                src={src}
                alt={alt}
                width={size.width || 1200}
                height={size.height || 800}
                // Derived from the cell's own width rather than a flat 100vw, so
                // a three-column thumbnail no longer downloads a full-width
                // image. Twelfths of the gallery either way: ~1104px of column
                // once the page stops growing, a share of the viewport below it.
                sizes={`(min-width: 1200px) ${Math.round((colsOf(image) / 12) * 1104)}px, ${Math.round((colsOf(image) / 12) * 100)}vw`}
                className={cn(
                  "relative h-full w-full",
                  contain
                    ? "object-contain"
                    : // `object-top` is `50% 0%`: the sides are trimmed evenly
                      // and only the bottom is cut, so the top of a screenshot
                      // — the part that identifies it — always survives.
                      //
                      // No Cloudinary crop is applied here on purpose. Asking
                      // the CDN for a guessed cell aspect and then covering it
                      // again in CSS cropped the image twice, which is what
                      // made every cell look slightly and needlessly zoomed.
                      "object-top object-cover @xl:transition-transform @xl:duration-500 @xl:group-hover:scale-[1.02]",
                )}
              />

              {/* The label is dropped on a phone-sized cell, where it would
                  cover the screenshot it is describing. The icon still reads. */}
              {long && !contain && (
                <span className="text-muted-foreground bg-background/80 absolute top-1 right-1 inline-flex items-center gap-1 rounded-full px-1.5 py-1 font-mono text-[10px] backdrop-blur-sm @xl:top-2 @xl:right-2 @xl:px-2">
                  <MoveVertical className="size-3" />
                  <span className="hidden @xl:inline">{labels.long}</span>
                </span>
              )}

              {/* Inside the cell, not below it. A caption in normal flow
                  overflowed a fixed-height cell and collided with the row
                  underneath. Clamped on small cells, where a long caption would
                  otherwise cover the whole image. */}
              {caption && (
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-linear-to-t from-black/75 to-transparent px-2 pt-6 pb-1.5 text-left text-[10px] text-pretty text-white/90 @xl:line-clamp-none @xl:px-3 @xl:pt-8 @xl:pb-2 @xl:text-xs">
                  {caption}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Zoom steps as a multiple of the container width. */
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

function Lightbox({
  images,
  index,
  locale,
  title,
  onClose,
  onStep,
}: {
  images: GalleryImage[];
  index: number | null;
  locale: Locale;
  title: string;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  // `fit` shows the whole image at once; any other value is a width multiple
  // the viewport scrolls around.
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const [zoomedIndex, setZoomedIndex] = useState(index);

  // Each image deserves its own starting zoom — carrying 4× onto the next one
  // would open it somewhere in its middle with no indication why. Adjusted
  // during render rather than in an effect, which is React's documented way to
  // reset derived state and avoids the extra commit an effect would cost.
  if (zoomedIndex !== index) {
    setZoomedIndex(index);
    setZoom("fit");
  }

  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") onStep(1);
      if (event.key === "ArrowLeft") onStep(-1);
    };

    // Escape is the dialog's own job; only the arrows need handling here.
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onStep]);

  // After the hooks, so their order stays stable across renders.
  if (index === null) return null;
  const active = images[index];
  if (!active) return null;

  const size = croppedSize(active);
  const zoomIndex = zoom === "fit" ? -1 : ZOOM_STEPS.indexOf(zoom);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-5xl p-4 sm:p-6">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* A phone screenshot is both very tall and very narrow. Rendered at
            full width it became enormous and needed a long scroll to read, so
            the default fits the whole image and zoom is opt-in. */}
        <div className={cn("max-h-[76vh]", zoom === "fit" ? "overflow-hidden" : "overflow-auto")}>
          <Image
            src={cloudinarySrc(active)}
            alt={pick(active.alt, locale) || pick(active.caption, locale) || title}
            width={size.width || 1600}
            height={size.height || 1000}
            quality={90}
            sizes="(min-width: 1024px) 1024px, 100vw"
            className={cn(
              "mx-auto rounded-lg",
              zoom === "fit" ? "max-h-[76vh] w-auto object-contain" : "h-auto",
            )}
            style={zoom === "fit" ? undefined : { width: `${zoom * 100}%`, maxWidth: "none" }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground min-w-0 flex-1 text-sm text-pretty">
            {pick(active.caption, locale)}
          </p>

          <div className="flex shrink-0 items-center gap-1">
            <ControlButton
              label="Zoom out"
              disabled={zoom === "fit"}
              onClick={() => setZoom(zoomIndex <= 0 ? "fit" : ZOOM_STEPS[zoomIndex - 1])}
            >
              <Minus className="size-4" />
            </ControlButton>

            <ControlButton
              label="Fit to screen"
              onClick={() => setZoom("fit")}
              active={zoom === "fit"}
            >
              <Maximize2 className="size-3.5" />
            </ControlButton>

            <ControlButton
              label="Zoom in"
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() =>
                setZoom(zoom === "fit" ? ZOOM_STEPS[0] : ZOOM_STEPS[zoomIndex + 1])
              }
            >
              <Plus className="size-4" />
            </ControlButton>

            <span className="text-muted-foreground tabular w-10 text-center font-mono text-xs">
              {zoom === "fit" ? "fit" : `${zoom}×`}
            </span>
          </div>

          {images.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-muted-foreground tabular font-mono text-xs">
                {index + 1}/{images.length}
              </span>
              <ControlButton label="Previous image" onClick={() => onStep(-1)}>
                <ChevronLeft className="size-4" />
              </ControlButton>
              <ControlButton label="Next image" onClick={() => onStep(1)}>
                <ChevronRight className="size-4" />
              </ControlButton>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "border-hairline hover:border-ring rounded-full border p-1.5 transition-colors disabled:opacity-40",
        active && "border-signal/40 text-signal",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Splits images into sections.
 *
 * Section order follows `galleryGroups`, which the editor can drag to
 * rearrange; image order within a section follows the image list. Anything
 * ungrouped collects at the end, where it reads as "and the rest" rather than
 * as an unlabelled first section.
 */
function groupImages(
  images: GalleryImage[],
  groups: GalleryGroup[],
  ungroupedLabel: string,
): { key: string; label: { en: string; id: string }; entries: Entry[] }[] {
  const entries = images.map((image, index) => ({ image, index }));

  const sections = groups.map((group, index) => ({
    // Index guards against two groups sharing a key, which happens transiently
    // in the CMS preview while a new group is still being named.
    key: `${group.key}-${index}`,
    label:
      group.label?.en || group.label?.id
        ? group.label
        : { en: group.key, id: group.key },
    entries: entries.filter((entry) => entry.image.group === group.key),
  }));

  const known = new Set(groups.map((group) => group.key));
  const rest = entries.filter((entry) => !known.has(entry.image.group ?? ""));

  if (rest.length > 0) {
    sections.push({
      key: "__ungrouped",
      label: { en: ungroupedLabel, id: ungroupedLabel },
      entries: rest,
    });
  }

  // A group with nothing in it would render as a heading over blank space.
  return sections.filter((section) => section.entries.length > 0);
}
