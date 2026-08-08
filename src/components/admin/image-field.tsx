"use client";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createUploadSignature } from "@/lib/actions/upload";
import type { Localized } from "@/lib/models/shared";

type StoredImage = {
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alt, setAlt] = useState<Localized>(() => ({
    en: String(value?.alt?.en ?? ""),
    id: String(value?.alt?.id ?? ""),
  }));

  async function upload(file: File) {
    setPending(true);
    setError(null);

    try {
      const signed = await createUploadSignature(folder);

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
      setImage({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setPending(false);
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
            <Button
              variant="glass"
              size="icon-sm"
              onClick={() => setImage(undefined)}
              aria-label="Remove image"
              className="absolute top-2 right-2 [--surface-radius:9999px]"
            >
              <X className="size-4" />
            </Button>
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
        </div>
      ) : (
        <label className="border-hairline hover:border-ring flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm transition-colors">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
          {pending ? "Uploading…" : "Choose image"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
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
