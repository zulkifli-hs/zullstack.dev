"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { SiteConfig } from "@/lib/models";

const localized = z.object({ en: z.string().trim(), id: z.string().trim() });

const configSchema = z.object({
  name: z.string().trim().min(1, "Required"),
  email: z.union([z.email("Must be a valid email"), z.literal("")]),
  location: z.string().trim(),
  resumeUrl: z.union([z.url("Must be a valid URL"), z.literal("")]),
  tagline: localized,
  bio: localized,
  socials: z.array(
    z.object({ platform: z.string().trim(), url: z.string().trim(), handle: z.string().trim() }),
  ),
  stats: z.array(z.object({ key: z.string().trim(), value: z.number(), suffix: z.string().trim() })),
});

export type ConfigState = { ok?: boolean; message?: string; errors?: Record<string, string> };

export async function saveSiteConfig(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  await requireAdmin();

  const text = (key: string) => String(formData.get(key) ?? "");

  /**
   * Socials and stats are repeating rows, submitted as `socials.0.platform`.
   * Rebuilt by index so rows can be added or removed client-side without the
   * server needing to know how many there are.
   */
  const rows = (prefix: string, keys: string[]) => {
    const out: Record<string, string>[] = [];
    for (let i = 0; formData.has(`${prefix}.${i}.${keys[0]}`); i++) {
      const row = Object.fromEntries(keys.map((key) => [key, text(`${prefix}.${i}.${key}`)]));
      // A row whose first column is blank is treated as deleted.
      if (row[keys[0]]) out.push(row);
    }
    return out;
  };

  const parsed = configSchema.safeParse({
    name: text("name"),
    email: text("email"),
    location: text("location"),
    resumeUrl: text("resumeUrl"),
    tagline: { en: text("tagline.en"), id: text("tagline.id") },
    bio: { en: text("bio.en"), id: text("bio.id") },
    socials: rows("socials", ["platform", "url", "handle"]),
    stats: rows("stats", ["key", "value", "suffix"]).map((row) => ({
      ...row,
      value: Number(row.value) || 0,
    })),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join(".")] ??= issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  await connectDB();
  // Upsert on the fixed key so the singleton is created on first save.
  await SiteConfig.findOneAndUpdate({ key: "site" }, parsed.data, { upsert: true, new: true });

  revalidatePath("/[locale]", "layout");
  revalidatePath("/admin/config");

  return { ok: true, message: "Saved." };
}
