"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { isResourceKey, RESOURCES, type ResourceKey } from "@/lib/admin/resources";
import { parseFormData, schemaFor } from "@/lib/admin/schema";

export type ActionState = {
  ok?: boolean;
  message?: string;
  /** Field name → first error, keyed the same way the form names inputs. */
  errors?: Record<string, string>;
};

/**
 * Every public page is statically generated, so a save has to invalidate the
 * rendered HTML rather than just a data cache. Revalidating the `[locale]`
 * layout cascades to every page beneath it in both locales — heavier than
 * per-path invalidation, but it cannot miss a page, which matters more on a
 * site this size than shaving a rebuild.
 */
function revalidatePublicSite() {
  revalidatePath("/[locale]", "layout");
}

function assertResource(key: string): ResourceKey {
  if (!isResourceKey(key)) throw new Error(`Unknown resource: ${key}`);
  return key;
}

export async function saveEntity(
  resourceKey: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Re-checked here, not just in proxy.ts: a Server Action is reachable by
  // direct POST regardless of which page rendered its form.
  await requireAdmin();

  const key = assertResource(resourceKey);
  const { model, fields } = RESOURCES[key];

  const parsed = schemaFor(fields).safeParse(parseFormData(fields, formData));

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      errors[path] ??= issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await connectDB();

  try {
    if (id) {
      await model.findByIdAndUpdate(id, parsed.data, { runValidators: true });
    } else {
      await model.create(parsed.data);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A duplicate slug is the common case and deserves a usable message
    // rather than the raw driver error.
    if (/duplicate key/i.test(message)) {
      return { ok: false, message: "That slug is already taken.", errors: { slug: "Already in use" } };
    }
    return { ok: false, message };
  }

  revalidatePublicSite();
  revalidatePath(`/admin/${key}`);
  redirect(`/admin/${key}`);
}

export async function deleteEntity(resourceKey: string, id: string) {
  await requireAdmin();

  const key = assertResource(resourceKey);
  await connectDB();
  await RESOURCES[key].model.findByIdAndDelete(id);

  revalidatePublicSite();
  revalidatePath(`/admin/${key}`);
}

/** Draft ⇄ published, from the list view without opening the form. */
export async function toggleStatus(resourceKey: string, id: string) {
  await requireAdmin();

  const key = assertResource(resourceKey);
  await connectDB();

  const doc = await RESOURCES[key].model.findById(id).select("status");
  if (!doc) return;

  doc.status = doc.status === "published" ? "draft" : "published";
  await doc.save();

  revalidatePublicSite();
  revalidatePath(`/admin/${key}`);
}

/**
 * Persists a dragged ordering as `order = position in the list`.
 *
 * Rewriting every position rather than nudging the moved row keeps `order`
 * dense and gap-free, so a later insert can never collide. One `bulkWrite`
 * instead of N updates because a drag can touch every row between the source
 * and the target.
 */
export async function reorderEntities(resourceKey: string, ids: string[]) {
  await requireAdmin();

  const key = assertResource(resourceKey);
  if (!RESOURCES[key].reorderable) throw new Error(`${key} is not reorderable`);
  if (ids.length === 0) return;

  await connectDB();

  await RESOURCES[key].model.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    })),
  );

  revalidatePublicSite();
  revalidatePath(`/admin/${key}`);
}

/**
 * Flips the resource's favorite flag, which is the leading sort key — so a
 * favorite stays above every other entry no matter how new the others are.
 */
export async function toggleFavorite(resourceKey: string, id: string) {
  await requireAdmin();

  const key = assertResource(resourceKey);
  const field = RESOURCES[key].favoriteField;
  if (!field) throw new Error(`${key} has no favorite field`);

  await connectDB();

  const doc = await RESOURCES[key].model.findById(id).select(field);
  if (!doc) return;

  doc.set(field, !doc.get(field));
  await doc.save();

  revalidatePublicSite();
  revalidatePath(`/admin/${key}`);
}
