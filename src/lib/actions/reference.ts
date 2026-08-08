"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { isResourceKey, RESOURCES } from "@/lib/admin/resources";

export type ReferenceOption = {
  id: string;
  label: string;
  logoUrl?: string;
};

/**
 * Options for a `reference` field, fetched when its picker opens.
 *
 * Loading these lazily rather than passing them down with the form matters once
 * a project references partners and a partner list grows: the edit page would
 * otherwise ship every option for every reference field on every render, most
 * of which are never opened.
 *
 * Drafts are included on purpose — a partner is often created moments before
 * the project that credits them, and hiding unpublished ones would make the new
 * entry invisible exactly when it is needed.
 */
export async function listReferenceOptions(resourceKey: string): Promise<ReferenceOption[]> {
  await requireAdmin();

  if (!isResourceKey(resourceKey)) throw new Error(`Unknown resource: ${resourceKey}`);
  const def = RESOURCES[resourceKey];

  await connectDB();

  const docs = await def.model
    .find()
    .select(`${def.titleField} logo`)
    .sort(def.sort)
    .limit(200)
    .lean();

  return docs.map((doc: Record<string, unknown>) => {
    const title = doc[def.titleField];
    const logo = doc.logo as { url?: string } | undefined;

    return {
      id: String(doc._id),
      // Title fields are either plain strings or `{ en, id }` — admin shows EN.
      label:
        typeof title === "string"
          ? title
          : String((title as { en?: string } | undefined)?.en ?? "(untitled)"),
      logoUrl: logo?.url,
    };
  });
}
