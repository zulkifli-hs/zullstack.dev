"use client";

import { useCallback, useState } from "react";

import { createUploadSignature } from "@/lib/actions/upload";
import { compressImage } from "@/lib/images/compress";

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  /** Bytes before and after compression, for the readout in the field. */
  originalBytes: number;
  bytes: number;
};

/**
 * Compress-then-upload, shared by every image field in the CMS.
 *
 * Both uploaders previously carried their own copy of the signature/POST dance,
 * which is how one of them could gain compression and the other quietly not.
 * Routing every upload through here is what makes "every image entering the
 * site is web-sized" true rather than aspirational — it covers project covers,
 * partner logos, avatars and article art, not just the gallery.
 */
export function useCloudinaryUpload(folder?: string) {
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (files: File[], onUploaded: (image: UploadedImage) => void) => {
      if (files.length === 0) return;

      setError(null);
      setPending((count) => count + files.length);

      try {
        // One signature per batch: it is scoped to a folder and a timestamp,
        // not to a single file, so re-signing per image buys nothing.
        const signed = await createUploadSignature(folder);

        // Sequential rather than parallel — a dozen simultaneous uploads from
        // one browser tab is how you hit Cloudinary's rate limit mid-batch and
        // lose the images that were already in flight.
        for (const file of files) {
          const compressed = await compressImage(file);

          const body = new FormData();
          body.append("file", compressed.file);
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

          onUploaded({
            url: result.secure_url,
            publicId: result.public_id,
            // Cloudinary's own numbers, not the compressor's — they are the
            // dimensions of what is actually stored.
            width: result.width,
            height: result.height,
            originalBytes: compressed.originalBytes,
            bytes: compressed.bytes,
          });

          setPending((count) => count - 1);
        }
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
        setPending(0);
      }
    },
    [folder],
  );

  return { upload, pending, error, clearError: () => setError(null) };
}
