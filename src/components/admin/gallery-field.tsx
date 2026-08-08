"use client";

import { GripVertical, ImagePlus, Loader2, X } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createUploadSignature } from "@/lib/actions/upload";
import type { Localized } from "@/lib/models/shared";

type GalleryEntry = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  alt?: Localized;
  caption?: Localized;
  /** Client-only identity, stripped before submit. */
  __uid: string;
};

let uid = 0;
const nextUid = () => `img-${++uid}`;

/** Drops the client-only key before the image is serialised for the server. */
function withoutUid(image: GalleryEntry) {
  const { url, publicId, width, height, alt, caption } = image;
  return { url, publicId, width, height, alt, caption };
}

const emptyLocalized = (value: unknown): Localized => {
  const record = (value ?? {}) as Record<string, unknown>;
  return { en: String(record.en ?? ""), id: String(record.id ?? "") };
};

/**
 * Several images with captions, reorderable.
 *
 * The multi-image sibling of `ImageField`, sharing its signed direct-to-
 * Cloudinary upload so bytes never pass through this server. What it adds
 * beyond looping is that it keeps `width`/`height` from every upload: the
 * public gallery lays each image out at its true aspect ratio so a 16:9 desktop
 * capture and a 9:16 phone capture can sit together uncropped, and that is only
 * possible if the dimensions are recorded here.
 *
 * Captions and alt text are bilingual, matching every other content field.
 */
export function GalleryField({
  name,
  label,
  help,
  value,
  folder,
}: {
  name: string;
  label: string;
  help?: string;
  value?: unknown;
  folder?: string;
}) {
  const [images, setImages] = useState<GalleryEntry[]>(() =>
    (Array.isArray(value) ? value : []).map((entry) => {
      const image = entry as Record<string, unknown>;
      return {
        url: String(image.url ?? ""),
        publicId: String(image.publicId ?? ""),
        width: typeof image.width === "number" ? image.width : undefined,
        height: typeof image.height === "number" ? image.height : undefined,
        alt: emptyLocalized(image.alt),
        caption: emptyLocalized(image.caption),
        __uid: nextUid(),
      };
    }),
  );
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: File[]) {
    setError(null);
    setPending((count) => count + files.length);

    try {
      // One signature per batch: it is scoped to a folder and a timestamp, not
      // to a single file, so re-signing per image buys nothing.
      const signed = await createUploadSignature(folder);

      // Sequential rather than parallel — a dozen simultaneous uploads from one
      // browser tab is how you hit Cloudinary's rate limit mid-batch and lose
      // the images that were already in flight.
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signed.apiKey);
        body.append("timestamp", String(signed.timestamp));
        body.append("signature", signed.signature);
        body.append("folder", signed.folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`,
          { method: "POST", body },
        );

        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error?.message ?? `Upload failed (${response.status})`);
        }

        const result = await response.json();
        setImages((current) => [
          ...current,
          {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            alt: { en: "", id: "" },
            caption: { en: "", id: "" },
            __uid: nextUid(),
          },
        ]);
        setPending((count) => count - 1);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
      setPending(0);
    }
  }

  function update(imageUid: string, patch: Partial<GalleryEntry>) {
    setImages((current) =>
      current.map((image) => (image.__uid === imageUid ? { ...image, ...patch } : image)),
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="lab-label text-muted-foreground block">{label}</span>
          {help && <p className="text-muted-foreground mt-1 max-w-prose text-xs">{help}</p>}
        </div>

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
              if (files.length) void upload(files);
            }}
          />
        </label>
      </div>

      <input type="hidden" name={name} value={JSON.stringify(images.map(withoutUid))} />

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
        <Reorder.Group axis="y" values={images} onReorder={setImages} className="space-y-3">
          {images.map((image) => (
            <GalleryRow
              key={image.__uid}
              image={image}
              onChange={(patch) => update(image.__uid, patch)}
              onRemove={() =>
                setImages((current) => current.filter((entry) => entry.__uid !== image.__uid))
              }
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function GalleryRow({
  image,
  onChange,
  onRemove,
}: {
  image: GalleryEntry;
  onChange: (patch: Partial<GalleryEntry>) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const id = useId();

  return (
    <Reorder.Item
      value={image}
      dragListener={false}
      dragControls={controls}
      className="border-hairline bg-background/40 flex items-start gap-3 rounded-lg border p-3"
    >
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        aria-label="Reorder"
        className="text-muted-foreground hover:text-foreground mt-1 cursor-grab touch-none transition-colors active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Plain <img>: an admin preview of an arbitrary remote asset, which
          next/image would require in remotePatterns first. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        className="border-hairline size-20 shrink-0 rounded-md border object-cover"
      />

      <div className="min-w-0 flex-1 space-y-2">
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
        {image.width && image.height && (
          <p className="text-muted-foreground font-mono text-[10px]">
            {image.width}×{image.height}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove image"
        className="hover:text-destructive shrink-0"
      >
        <X className="size-4" />
      </Button>
    </Reorder.Item>
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
  const current = emptyLocalized(value);

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
