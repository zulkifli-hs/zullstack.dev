"use client";

import { Crop, ImageIcon, Images, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { cloudinaryPreview } from "@/lib/images/cloudinary";
import { formatBytes } from "@/lib/images/constraints";
import type { CropRatio, CropRect, Localized } from "@/lib/content-enums";
import { cn } from "@/lib/utils";

type StoredImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  alt?: Localized;
  crop?: CropRect | null;
  ratio?: CropRatio;
};

/**
 * An asset already on Cloudinary that this field may adopt.
 *
 * Deliberately the narrow subset a cover needs: gallery entries carry layout
 * and grouping too, and none of that means anything here.
 */
export type PickableImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  alt?: Localized;
};

/**
 * Uploads straight from the browser to Cloudinary using a server-signed
 * request, then submits the resulting URL and publicId as hidden inputs so the
 * surrounding form saves them like any other field.
 *
 * `publicId` is stored alongside the URL because it is what later allows the
 * asset to be transformed or deleted — a bare URL is a dead end.
 *
 * The upload itself lives in `useCloudinaryUpload`, which resizes and re-encodes
 * before sending — so a cover or a logo is web-sized for the same reason a
 * gallery screenshot is, without either field knowing how.
 */
export function ImageField({
  name,
  label,
  help,
  error: fieldError,
  value,
  folder,
  pickFrom = [],
}: {
  name: string;
  label: string;
  help?: string;
  /** Validation message from the Server Action, keyed by field name. */
  error?: string;
  value?: StoredImage;
  folder?: string;
  /** Assets already uploaded elsewhere on this form that may be reused. */
  pickFrom?: PickableImage[];
}) {
  const [image, setImage] = useState<StoredImage | undefined>(value);
  const [saved, setSaved] = useState<{ from: number; to: number } | null>(null);
  const [cropping, setCropping] = useState(false);
  const [picking, setPicking] = useState(false);
  const { upload, pending, error } = useCloudinaryUpload(folder);
  const [alt, setAlt] = useState<Localized>(() => ({
    en: String(value?.alt?.en ?? ""),
    id: String(value?.alt?.id ?? ""),
  }));

  function choose(file: File) {
    void upload([file], (uploaded) => {
      setImage({
        url: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
        crop: null,
        ratio: "original",
      });
      setSaved(
        uploaded.bytes < uploaded.originalBytes
          ? { from: uploaded.originalBytes, to: uploaded.bytes }
          : null,
      );
    });
  }

  /**
   * Adopts an asset that is already on Cloudinary.
   *
   * Nothing is re-uploaded — the same `publicId` is simply referenced twice, so
   * the cover costs no storage and no second compression pass.
   *
   * The crop is *not* carried over. It is a delivery-time transform chosen for
   * wherever that image sits in the gallery, which may be a tall cell; the cover
   * is a fixed 16:9 band and needs its own answer, which the Crop button beside
   * this one gives. Alt text is carried, but only into an empty field, so
   * picking a different image never silently overwrites text already typed here.
   */
  function adopt(candidate: PickableImage) {
    setImage({
      url: candidate.url,
      publicId: candidate.publicId,
      width: candidate.width,
      height: candidate.height,
      crop: null,
      ratio: "original",
    });
    setSaved(null);
    setPicking(false);

    if (!alt.en && !alt.id && candidate.alt) {
      setAlt({ en: String(candidate.alt.en ?? ""), id: String(candidate.alt.id ?? "") });
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <span className="lab-label text-muted-foreground block">{label}</span>
      {help && <p className="text-muted-foreground text-xs">{help}</p>}

      {/* Hidden inputs are what actually reach the Server Action. */}
      <input type="hidden" name={`${name}.url`} value={image?.url ?? ""} />
      <input type="hidden" name={`${name}.publicId`} value={image?.publicId ?? ""} />
      <input type="hidden" name={`${name}.width`} value={image?.width ?? ""} />
      <input type="hidden" name={`${name}.height`} value={image?.height ?? ""} />
      <input type="hidden" name={`${name}.alt.en`} value={alt.en} />
      <input type="hidden" name={`${name}.alt.id`} value={alt.id} />
      {/* One JSON input rather than four scalars that could disagree. */}
      <input
        type="hidden"
        name={`${name}.crop`}
        value={image?.crop ? JSON.stringify(image.crop) : ""}
      />
      <input type="hidden" name={`${name}.ratio`} value={image?.ratio ?? "original"} />

      {image?.url ? (
        <div className="space-y-3">
          <div className="border-hairline relative w-fit overflow-hidden rounded-lg border">
            {/* Plain <img>: this is an admin preview of an arbitrary remote asset,
                and next/image would demand it be in remotePatterns first. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cloudinaryPreview(image.url, 600)} alt="" className="max-h-48 w-auto" />
            {/* Was a hand-rolled `bg-background/80 backdrop-blur` — one of three
                uncoordinated blurs that ignored the glass tokens and never
                degraded. Now a real glass control. */}
            <div className="absolute top-2 right-2 flex gap-1.5">
              {pickFrom.length > 0 && (
                <Button
                  variant="glass"
                  size="icon-sm"
                  onClick={() => setPicking(true)}
                  aria-label="Replace from gallery"
                  className="[--surface-radius:9999px]"
                >
                  <Images className="size-4" />
                </Button>
              )}
              {/* Covers are rendered into a fixed 16:9 frame, so without this the
                  only fix for a badly-shaped upload was to crop it elsewhere and
                  upload it again. */}
              <Button
                variant="glass"
                size="icon-sm"
                onClick={() => setCropping(true)}
                aria-label="Crop image"
                className="[--surface-radius:9999px]"
              >
                <Crop className="size-4" />
              </Button>
              <Button
                variant="glass"
                size="icon-sm"
                onClick={() => setImage(undefined)}
                aria-label="Remove image"
                className="[--surface-radius:9999px]"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* The schema has always had a bilingual `alt`, but nothing ever wrote
              it — and because a save replaces the whole document, every save
              also erased anything set elsewhere. */}
          <div className="space-y-1">
            <Label htmlFor={`${name}-alt-en`} className="text-xs">
              Alt text
            </Label>
            <div className="grid max-w-lg gap-2 md:grid-cols-2">
              {(["en", "id"] as const).map((locale) => (
                <Input
                  key={locale}
                  id={`${name}-alt-${locale}`}
                  value={alt[locale]}
                  placeholder={locale}
                  className="h-8 text-xs"
                  onChange={(event) =>
                    setAlt((current) => ({ ...current, [locale]: event.target.value }))
                  }
                />
              ))}
            </div>
          </div>

          <p className="text-muted-foreground font-mono text-[10px]">
            {image.width}×{image.height}
            {image.crop && ` · cropped ${image.ratio}`}
            {saved && ` · ${formatBytes(saved.from)} → ${formatBytes(saved.to)}`}
          </p>

          <ImageCropDialog
            open={cropping}
            onOpenChange={setCropping}
            url={image.url}
            width={image.width}
            height={image.height}
            crop={image.crop}
            ratio={image.ratio}
            onApply={(crop, ratio) =>
              setImage((current) => (current ? { ...current, crop, ratio } : current))
            }
          />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <label className="border-hairline hover:border-ring flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors">
            {pending > 0 ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
            {pending > 0 ? "Uploading…" : "Choose image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={pending > 0}
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Reset so picking the same file twice still fires a change.
                event.target.value = "";
                if (file) choose(file);
              }}
            />
          </label>

          {/* Offered only when there is something to offer — an empty picker is
              a button that can only disappoint. */}
          {pickFrom.length > 0 && (
            <Button type="button" variant="outline" onClick={() => setPicking(true)}>
              <Images className="size-4" />
              From gallery
            </Button>
          )}
        </div>
      )}

      {/* Outside the branch above: the picker both fills an empty field and
          replaces a filled one. */}
      <ImagePickerDialog
        open={picking}
        onOpenChange={setPicking}
        images={pickFrom}
        currentPublicId={image?.publicId}
        onPick={adopt}
      />

      {(error ?? fieldError) && (
        <p role="alert" className="text-destructive text-xs">
          {error ?? fieldError}
        </p>
      )}
    </div>
  );
}

/**
 * Picks one of the images already attached to this form.
 *
 * A cover is almost always a screenshot that is in the gallery too, and until
 * now that meant uploading the same file twice — two Cloudinary assets, two
 * compressions, and two things to remember to replace when the screenshot goes
 * stale.
 *
 * Shown as a plain grid of the images at gallery order, because that is the
 * order they are being thought about in on the same screen.
 */
function ImagePickerDialog({
  open,
  onOpenChange,
  images,
  currentPublicId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: PickableImage[];
  currentPublicId?: string;
  onPick: (image: PickableImage) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="text-base font-semibold tracking-tight">
          Use a gallery image
        </DialogTitle>
        <p className="text-muted-foreground mt-1 text-xs">
          Reuses the same upload. The cover keeps its own crop, so pick first and crop after.
        </p>

        <div className="mt-4 grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
          {images.map((candidate, index) => {
            const current = Boolean(currentPublicId) && candidate.publicId === currentPublicId;

            return (
              <button
                // A gallery can legitimately hold the same asset twice, so the
                // publicId alone is not an identity here.
                key={`${candidate.publicId}-${index}`}
                type="button"
                onClick={() => onPick(candidate)}
                className={cn(
                  "border-hairline hover:border-ring relative overflow-hidden rounded-lg border transition-colors",
                  current && "border-signal ring-signal/40 ring-2",
                )}
              >
                {/* Plain <img>: an admin thumbnail of an arbitrary remote asset,
                    which next/image would require in remotePatterns first. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cloudinaryPreview(candidate.url, 400)}
                  alt=""
                  // The cover renders as a 16:9 band, so previewing the
                  // candidates in that same frame is what makes the choice
                  // answerable — a square thumbnail would hide the crop the
                  // decision actually turns on.
                  className="aspect-video w-full object-cover object-top"
                />
                {current && (
                  <span className="bg-signal/90 text-background absolute top-1.5 left-1.5 rounded px-1.5 font-mono text-[10px]">
                    current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
