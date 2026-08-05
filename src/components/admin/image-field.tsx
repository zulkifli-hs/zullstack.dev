"use client";

import { ImageIcon, Loader2, X } from "lucide-react";
import { useState } from "react";

import { createUploadSignature } from "@/lib/actions/upload";

type StoredImage = { url: string; publicId: string; width?: number; height?: number };

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
  value,
  folder,
}: {
  name: string;
  label: string;
  value?: StoredImage;
  folder?: string;
}) {
  const [image, setImage] = useState<StoredImage | undefined>(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      {/* Hidden inputs are what actually reach the Server Action. */}
      <input type="hidden" name={`${name}.url`} value={image?.url ?? ""} />
      <input type="hidden" name={`${name}.publicId`} value={image?.publicId ?? ""} />
      <input type="hidden" name={`${name}.width`} value={image?.width ?? ""} />
      <input type="hidden" name={`${name}.height`} value={image?.height ?? ""} />

      {image?.url ? (
        <div className="border-hairline relative w-fit overflow-hidden rounded-lg border">
          {/* Plain <img>: this is an admin preview of an arbitrary remote asset,
              and next/image would demand it be in remotePatterns first. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="max-h-48 w-auto" />
          <button
            type="button"
            onClick={() => setImage(undefined)}
            aria-label="Remove image"
            className="bg-background/80 absolute top-2 right-2 rounded-full p-1.5 backdrop-blur"
          >
            <X className="size-4" />
          </button>
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

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
