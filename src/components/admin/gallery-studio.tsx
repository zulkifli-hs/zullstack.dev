"use client";

import {
  Crop,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Type,
  X,
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { ProjectGallery } from "@/components/sections/project-gallery";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { cloudinaryPreview, isLong } from "@/lib/images/cloudinary";
import { formatBytes } from "@/lib/images/constraints";
import {
  DEFAULT_GALLERY_COLS,
  DEFAULT_GALLERY_ROWS,
  GALLERY_COLS,
  GALLERY_FITS,
  GALLERY_ROWS,
  SPAN_TO_COLS,
  type CropRatio,
  type CropRect,
  type GalleryCols,
  type GalleryFit,
  type GalleryGroup,
  type GalleryRows,
  type GallerySpan,
  type Localized,
} from "@/lib/content-enums";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "@/types/content";

export type GalleryEntry = GalleryImage & {
  /** Client-only identity, stripped before submit. */
  __uid: string;
  /** Only known for images uploaded in this session. */
  __savedFrom?: number;
  __savedTo?: number;
};

/** Local alias, so the rest of this file reads as it did. */
type Entry = GalleryEntry;

let uid = 0;
const nextUid = () => `img-${++uid}`;

const PREVIEW_WIDTHS = [
  { id: "desktop", label: "Desktop", width: 1152, icon: Monitor },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
] as const;

const localized = (value: unknown): Localized => {
  const record = (value ?? {}) as Record<string, unknown>;
  return { en: String(record.en ?? ""), id: String(record.id ?? "") };
};

/**
 * Reads a stored gallery array into editor entries.
 *
 * Exported because the list no longer belongs to this component alone — the
 * project form holds it so the cover field can offer the same images, and it
 * needs the same normalisation to hold it.
 */
export function toGalleryEntries(value: unknown): GalleryEntry[] {
  return (Array.isArray(value) ? value : []).map((raw) => {
    const image = raw as Record<string, unknown>;

    return {
      url: String(image.url ?? ""),
      publicId: String(image.publicId ?? ""),
      width: typeof image.width === "number" ? image.width : undefined,
      height: typeof image.height === "number" ? image.height : undefined,
      alt: localized(image.alt),
      caption: localized(image.caption),
      crop: (image.crop as CropRect | null) ?? null,
      ratio: (image.ratio as CropRatio) ?? "original",
      // Documents written before the grid gained a second axis carry `span`.
      cols:
        (image.cols as GalleryCols) ?? SPAN_TO_COLS[image.span as GallerySpan] ?? DEFAULT_GALLERY_COLS,
      rows: (image.rows as GalleryRows) ?? DEFAULT_GALLERY_ROWS,
      fit: (image.fit as GalleryFit) ?? "cover",
      group: String(image.group ?? ""),
      hidden: image.hidden === true,
      __uid: nextUid(),
    };
  });
}

/** Whether either language of a localized field has anything in it. */
const hasText = (value?: Localized) => Boolean(value?.en?.trim() || value?.id?.trim());

/**
 * Drops client-only keys before the entry is serialised for the server.
 *
 * Exported because a gallery is not always a top-level field: the experience
 * form nests one inside every position, and folds the result into that form's
 * own JSON rather than letting this component post its own input.
 */
export function galleryForSubmit(entry: GalleryEntry) {
  const { url, publicId, width, height, alt, caption, crop, ratio, cols, rows, fit, group, hidden } =
    entry;
  return {
    url,
    publicId,
    width,
    height,
    alt,
    caption,
    crop,
    ratio,
    cols,
    rows,
    fit,
    group,
    hidden: hidden === true,
  };
}

/**
 * Scale factor that fits `contentWidth` into the pane, plus the content's own
 * height so the scaled wrapper can collapse to match.
 *
 * `ResizeObserver` on both boxes, following `glass/lens-auto.tsx`: the pane
 * changes with the window and the content changes every time an image is added,
 * cropped or resized.
 */
function useFitScale(contentWidth: number) {
  const paneRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [paneWidth, setPaneWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const pane = paneRef.current;
    const content = contentRef.current;
    if (!pane || !content) return;

    // Padding is not part of the usable width; measuring the content box keeps
    // the scaled preview from overflowing its own border.
    const paneObserver = new ResizeObserver(([entry]) => {
      setPaneWidth(entry.contentRect.width);
    });
    const contentObserver = new ResizeObserver(([entry]) => {
      setContentHeight(entry.contentRect.height);
    });

    paneObserver.observe(pane);
    contentObserver.observe(content);

    return () => {
      paneObserver.disconnect();
      contentObserver.disconnect();
    };
  }, []);

  // Never scale up: a 390px mobile preview shown at 2× would be a lie about
  // how large everything is.
  const scale = paneWidth > 0 ? Math.min(1, paneWidth / contentWidth) : 1;

  return { paneRef, contentRef, scale, contentHeight };
}

/**
 * The gallery editor: an ordered list on the left, the real thing on the right.
 *
 * The preview renders `ProjectGallery` — the same component the public page
 * uses, not a mock-up of it. That is the whole point: a preview built
 * separately would drift from the page it claims to show, and the first time it
 * did, it would be worse than no preview at all.
 *
 * Ordering is one flat drag list even when the gallery is grouped. Grouping is
 * a tag on each image rather than a container to drag between, so there is
 * exactly one sequence to reason about and the existing vertical `Reorder`
 * remains sufficient.
 */
export function GalleryStudio({
  name,
  label,
  help,
  images,
  setImages,
  folder,
  groups = [],
  display = "flat",
}: {
  /**
   * Posts the list as one hidden input under this name.
   *
   * Omitted when the gallery is nested inside another field's JSON — the
   * experience form keeps its positions' media in its own blob, and a second
   * input would post the same images twice under a name nothing reads.
   */
  name?: string;
  label: string;
  help?: string;
  images: GalleryEntry[];
  /**
   * The state setter itself, not a plain callback: several uploads resolve
   * independently, so each has to append to whatever the list is *then*. A
   * callback closing over `images` would drop every file but the last.
   */
  setImages: Dispatch<SetStateAction<GalleryEntry[]>>;
  folder?: string;
  groups?: GalleryGroup[];
  display?: "flat" | "grouped";
}) {
  const [cropping, setCropping] = useState<string | null>(null);
  const [preview, setPreview] = useState<(typeof PREVIEW_WIDTHS)[number]["id"]>("desktop");
  const [previewLocale, setPreviewLocale] = useState<"en" | "id">("en");

  // Caption and alt are two fields in two languages — four inputs per image,
  // which is the bulk of a row's height, and most screenshots need none of it.
  // Collapsed by default, unless something is already written: a gallery that
  // has been captioned should not open looking as though the captions are gone.
  // This only ever hides the *inputs*; nothing stored is touched either way.
  const [showText, setShowText] = useState(() =>
    images.some((image) => hasText(image.caption) || hasText(image.alt)),
  );

  const { upload, pending, error } = useCloudinaryUpload(folder);

  function update(entryUid: string, patch: Partial<Entry>) {
    setImages((current) =>
      current.map((image) => (image.__uid === entryUid ? { ...image, ...patch } : image)),
    );
  }

  const active = images.find((image) => image.__uid === cropping);
  const previewWidth = PREVIEW_WIDTHS.find((option) => option.id === preview)!.width;
  const { paneRef, contentRef, scale, contentHeight: previewHeight } = useFitScale(previewWidth);

  // The preview is the public page, so it shows what the public would get.
  // Seeing a held-back image disappear from the grid is also the clearest
  // confirmation that hiding it did something.
  const published = images.filter((image) => !image.hidden);
  const hiddenCount = images.length - published.length;

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="lab-label text-muted-foreground block">{label}</span>
          {help && <p className="text-muted-foreground mt-1 max-w-prose text-xs">{help}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => setShowText((current) => !current)}
              aria-pressed={showText}
              title="Show the caption and alt text fields on every row. Hiding them changes nothing that is stored."
              className={cn(
                "border-hairline inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-xs transition-colors",
                showText
                  ? "border-signal/40 bg-signal/10 text-signal"
                  : "text-muted-foreground hover:border-ring hover:text-foreground",
              )}
            >
              <Type className="size-3.5" />
              Caption &amp; alt
            </button>
          )}

          <label className="border-hairline hover:border-ring inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors">
            {pending > 0 ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {pending > 0 ? `Uploading ${pending}…` : "Add images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={pending > 0}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                // Reset so picking the same file twice still fires a change.
                event.target.value = "";
                void upload(files, (uploaded) => {
                  setImages((current) => [
                    ...current,
                    {
                      url: uploaded.url,
                      publicId: uploaded.publicId,
                      width: uploaded.width,
                      height: uploaded.height,
                      alt: { en: "", id: "" },
                      caption: { en: "", id: "" },
                      crop: null,
                      ratio: "original",
                      // Half the row at roughly 16:9 — a cell that reads as
                      // deliberate in a two-up grid whatever the image's shape.
                      cols: DEFAULT_GALLERY_COLS,
                      rows: DEFAULT_GALLERY_ROWS,
                      fit: "cover",
                      group: "",
                      hidden: false,
                      __uid: nextUid(),
                      __savedFrom: uploaded.originalBytes,
                      __savedTo: uploaded.bytes,
                    },
                  ]);
                });
              }}
            />
          </label>
        </div>
      </div>

      {name && (
        <input type="hidden" name={name} value={JSON.stringify(images.map(galleryForSubmit))} />
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="border-hairline text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
          No images yet.
        </p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-3">
            {images.map((image) => (
              <StudioRow
                key={image.__uid}
                image={image}
                groups={groups}
                showGroup={display === "grouped"}
                showText={showText}
                onChange={(patch) => update(image.__uid, patch)}
                onCrop={() => setCropping(image.__uid)}
                onRemove={() =>
                  setImages((current) => current.filter((entry) => entry.__uid !== image.__uid))
                }
              />
            ))}
          </Reorder.Group>

          <div className="xl:sticky xl:top-24 xl:self-start">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="lab-label text-muted-foreground">
                Preview
                {hiddenCount > 0 && (
                  <span className="text-muted-foreground/70 ml-2 font-mono text-[10px] normal-case">
                    {hiddenCount} hidden
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1">
                {PREVIEW_WIDTHS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreview(option.id)}
                    aria-label={option.label}
                    aria-pressed={preview === option.id}
                    className={cn(
                      "rounded-md p-1.5 transition-colors",
                      preview === option.id
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <option.icon className="size-4" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPreviewLocale((current) => (current === "en" ? "id" : "en"))}
                  className="text-muted-foreground hover:text-foreground ml-1 rounded-md px-2 py-1 font-mono text-xs transition-colors"
                >
                  {previewLocale}
                </button>
              </div>
            </div>

            {/* Laid out at the real viewport width and then scaled down, rather
                than squeezed into the pane. Squeezing would resolve the
                gallery's breakpoints against the pane's width, so the preview
                would show a phone layout while claiming to be a desktop.

                The pane scrolls on its own. Before, it grew to whatever height
                the gallery came to, and since it is sticky the only way to
                reach the bottom of a tall preview was to scroll the *list* to
                its end and let the page carry the preview up with it — so the
                images being judged were off screen exactly while judging them.

                `scrollbar-gutter: stable` reserves the scrollbar's width
                whether or not it is showing. Without it the pane narrows the
                moment a scrollbar appears, which changes the fit scale, which
                changes the scaled height — enough, at the wrong content height,
                to cross back over the threshold and flicker. */}
            <div
              ref={paneRef}
              className="border-hairline bg-background max-h-[calc(100dvh-10rem)] overflow-x-hidden overflow-y-auto overscroll-contain scrollbar-gutter-stable rounded-xl border p-4"
            >
              <div
                style={{
                  width: previewWidth,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  // The wrapper has to shrink with the content or the scaled-down
                  // preview would leave a tall empty gap beneath it.
                  height: previewHeight ? previewHeight * scale : undefined,
                }}
              >
                <div ref={contentRef}>
                  {published.length === 0 ? (
                    // `ProjectGallery` renders nothing for an empty list, which
                    // here would be an empty box that looks like a fault.
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      Every image is hidden, so the gallery does not appear.
                    </p>
                  ) : (
                    <ProjectGallery
                      images={published.map(galleryForSubmit)}
                      locale={previewLocale}
                      title="Preview"
                      display={display}
                      groups={groups}
                      labels={{ long: "long", ungrouped: "Other" }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {active && (
        <ImageCropDialog
          open
          onOpenChange={(open) => !open && setCropping(null)}
          url={active.url}
          width={active.width}
          height={active.height}
          crop={active.crop}
          ratio={active.ratio}
          onApply={(crop, ratio) => update(active.__uid, { crop, ratio })}
        />
      )}
    </div>
  );
}

/**
 * The studio holding its own list, for forms that have nothing to share it with.
 *
 * The project form does share it — its cover field offers the same images — so
 * there the state lives one level up. Every other resource with a gallery has
 * only this one consumer, and making them all lift state would be ceremony for
 * a list nobody else reads.
 */
export function GalleryStudioField({
  value,
  ...props
}: Omit<React.ComponentProps<typeof GalleryStudio>, "images" | "setImages"> & {
  value?: unknown;
}) {
  const [images, setImages] = useState<GalleryEntry[]>(() => toGalleryEntries(value));

  return <GalleryStudio {...props} images={images} setImages={setImages} />;
}

function StudioRow({
  image,
  groups,
  showGroup,
  showText,
  onChange,
  onCrop,
  onRemove,
}: {
  image: Entry;
  groups: GalleryGroup[];
  showGroup: boolean;
  showText: boolean;
  onChange: (patch: Partial<Entry>) => void;
  onCrop: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const id = useId();
  const long = isLong(image);
  const hidden = image.hidden === true;

  return (
    <Reorder.Item
      value={image}
      dragListener={false}
      dragControls={controls}
      className={cn(
        "border-hairline bg-background/40 flex items-start gap-3 rounded-lg border p-3",
        // Faded rather than moved to the bottom of the list: a hidden image
        // keeps its place in the order, because that is the place it goes back
        // to when it is published.
        hidden && "opacity-55",
      )}
    >
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        aria-label="Reorder"
        className="text-muted-foreground hover:text-foreground mt-1 cursor-grab touch-none transition-colors active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative shrink-0">
        {/* Plain <img>: an admin thumbnail of an arbitrary remote asset, which
            next/image would require in remotePatterns first. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cloudinaryPreview(image.url, 200)}
          alt=""
          className="border-hairline size-20 rounded-md border object-cover"
        />
        {long && (
          <span className="bg-background/85 text-muted-foreground absolute right-1 bottom-1 rounded px-1 font-mono text-[9px]">
            long
          </span>
        )}
        {hidden && (
          // On the thumbnail, so the state is legible while scanning the list
          // rather than only from the toggle at the far end of the row.
          <span className="bg-background/85 text-signal absolute top-1 left-1 rounded px-1 font-mono text-[9px]">
            hidden
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="xs" onClick={onCrop}>
            <Crop className="size-3" />
            {image.crop ? image.ratio : "Crop"}
          </Button>

          <SizePicker
            cols={image.cols ?? DEFAULT_GALLERY_COLS}
            rows={image.rows ?? DEFAULT_GALLERY_ROWS}
            onChange={(cols, rows) => onChange({ cols, rows })}
          />

          <div className="border-hairline flex overflow-hidden rounded-md border">
            {GALLERY_FITS.map((fit) => (
              <button
                key={fit}
                type="button"
                onClick={() => onChange({ fit })}
                aria-pressed={(image.fit ?? "cover") === fit}
                className={cn(
                  "px-2 py-1 font-mono text-[11px] transition-colors",
                  (image.fit ?? "cover") === fit
                    ? "bg-signal/15 text-signal"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {fit}
              </button>
            ))}
          </div>

          {showGroup && (
            <NativeSelect
              value={image.group ?? ""}
              onChange={(event) => onChange({ group: event.target.value })}
              className="h-7 w-auto py-0 text-xs"
            >
              <option value="">— no group —</option>
              {groups.map((group, index) => (
                // Index in the key because two freshly-added groups both have an
                // empty key until one is typed, and duplicate keys are a React
                // warning plus unpredictable reconciliation.
                <option key={`${group.key}-${index}`} value={group.key}>
                  {group.label?.en || group.key || "(unnamed)"}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>

        {/* Collapsed by the studio-wide toggle. The values stay in state and
            still submit — this hides four inputs, not their contents. */}
        {showText && (
          <>
            <LocalizedRow
              id={`${id}-caption`}
              label="Caption"
              value={image.caption}
              onChange={(caption) => onChange({ caption })}
            />
            <LocalizedRow
              id={`${id}-alt`}
              label="Alt text"
              value={image.alt}
              onChange={(alt) => onChange({ alt })}
            />
          </>
        )}

        <p className="text-muted-foreground font-mono text-[10px]">
          {image.width}×{image.height}
          {image.__savedFrom && image.__savedTo && image.__savedTo < image.__savedFrom
            ? ` · ${formatBytes(image.__savedFrom)} → ${formatBytes(image.__savedTo)}`
            : ""}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange({ hidden: !hidden })}
          aria-pressed={hidden}
          aria-label={hidden ? "Publish this image" : "Hide this image from the public page"}
          title={hidden ? "Hidden — kept, but not published" : "Visible on the public page"}
          className={cn(hidden && "text-signal")}
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove image"
          className="hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

/**
 * Picks how many columns and rows a cell occupies, by sweeping the grid.
 *
 * A pair of number inputs would be fewer pixels but would ask the editor to
 * hold the shape in their head. Here the highlighted block *is* the cell, at
 * the grid's own proportions — choosing "six wide, four tall" is one gesture
 * and the result is visible before it is committed.
 *
 * Behind a popover because the sweep is 12x24: rendering 288 buttons inline for
 * every image in the list would be thousands of nodes for a control that is
 * used a few times per image.
 */
function SizePicker({
  cols,
  rows,
  onChange,
}: {
  cols: GalleryCols;
  rows: GalleryRows;
  onChange: (cols: GalleryCols, rows: GalleryRows) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ cols: number; rows: number } | null>(null);

  const shown = hover ?? { cols, rows };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className="border-hairline hover:border-ring text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors"
          />
        }
      >
        <LayoutGrid className="size-3" />
        {cols}×{rows}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-3">
        <div
          role="group"
          aria-label="Cell size"
          onPointerLeave={() => setHover(null)}
          className="grid w-fit grid-cols-12 gap-px"
        >
          {GALLERY_ROWS.map((row) =>
            GALLERY_COLS.map((col) => {
              const active = col <= shown.cols && row <= shown.rows;

              return (
                <button
                  key={`${col}-${row}`}
                  type="button"
                  aria-label={`${col} by ${row}`}
                  onPointerEnter={() => setHover({ cols: col, rows: row })}
                  onClick={() => {
                    onChange(col, row);
                    setOpen(false);
                  }}
                  className={cn(
                    "size-3 rounded-[2px] transition-colors",
                    active ? "bg-signal" : "bg-secondary hover:bg-secondary/70",
                  )}
                />
              );
            }),
          )}
        </div>

        <p className="text-muted-foreground tabular mt-2 text-center font-mono text-[11px]">
          {shown.cols}×{shown.rows}
        </p>
      </PopoverContent>
    </Popover>
  );
}

function LocalizedRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: Localized;
  onChange: (value: Localized) => void;
}) {
  const current = localized(value);

  return (
    <div className="space-y-1">
      <Label htmlFor={`${id}-en`} className="text-xs">
        {label}
      </Label>
      <div className="grid gap-2 md:grid-cols-2">
        {(["en", "id"] as const).map((locale) => (
          <Input
            key={locale}
            id={`${id}-${locale}`}
            value={current[locale]}
            placeholder={locale}
            className="h-8 text-xs"
            onChange={(event) => onChange({ ...current, [locale]: event.target.value })}
          />
        ))}
      </div>
    </div>
  );
}
