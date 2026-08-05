"use server";

import { v2 as cloudinary } from "cloudinary";

import { requireAdmin } from "@/lib/auth-guard";

/**
 * Signed direct-to-Cloudinary uploads.
 *
 * The file never passes through this server. Server Actions cap the request
 * body at 1 MB by default, and raising that would stream every image through a
 * serverless function for no benefit. Instead the server signs a short-lived
 * upload request and the browser POSTs the bytes straight to Cloudinary.
 *
 * The signature is what makes this safe: an *unsigned* preset would let anyone
 * who finds the cloud name upload into the account.
 */
export type SignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
};

export async function createUploadSignature(folder = "zullstack"): Promise<SignedUpload> {
  // Authorize before signing, not after — a signature handed to an
  // unauthenticated caller is a write credential.
  await requireAdmin();

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.",
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const safeFolder = `${folder}`.replace(/[^a-z0-9/_-]/gi, "");

  // Every parameter signed here is one the client cannot alter without
  // invalidating the signature — which is how the upload stays constrained
  // to our folder.
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: safeFolder }, apiSecret);

  return { cloudName, apiKey, timestamp, signature, folder: safeFolder };
}
