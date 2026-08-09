"use client";

import { Crop, ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";

import { ImageCropDialog } from "@/components/admin/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCloudinaryUpload } from "@/hooks/use-cloudinary-upload";
import { formatBytes } from "@/lib/images/constraints";
import type { CropRatio, CropRect, Localized } from "@/lib/content-enums";

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
}: {
  name: string;
  label: string;
  help?: string;
  /** Validation message from the Server Action, keyed by field name. */
  error?: string;
  value?: StoredImage;
  folder?: string;
}) {
  const [image, setImage] = useState<StoredImage | undefined>(value);
  const [saved, setSaved] = useState<{ from: number; to: number } | null>(null);
  const [cropping, setCropping] = useState(false);
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
            <img src={image.url} alt="" className="max-h-48 w-auto" />
            {/* Was a hand-rolled `bg-background/80 backdrop-blur` — one of three
                uncoordinated blurs that ignored the glass tokens and never
                degraded. Now a real glass control. */}
            <div className="absolute top-2 right-2 flex gap-1.5">
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
      )}

      {(error ?? fieldError) && (
        <p role="alert" className="text-destructive text-xs">
          {error ?? fieldError}
        </p>
      )}
    </div>
  );
}
