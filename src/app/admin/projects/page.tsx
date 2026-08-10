import { Images, Plus } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityList, type EntityListItem } from "@/components/admin/entity-list";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";
import { RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

export const metadata = { title: "Projects" };

/**
 * The projects list.
 *
 * Reuses `EntityList` — drag ordering and the favourites split are not
 * project-specific and were already right. What this screen adds over the
 * generic one is the columns that matter for projects: how many gallery images
 * exist, and which platforms the work covered.
 */
export default async function ProjectListPage() {
  const session = await requireAdmin();
  const def = RESOURCES.projects;

  await connectDB();

  const docs = await def.model.find().sort(def.sort).lean();
  // `.lean()` skips schema transforms, so `_id` never becomes `id` on its own.
  const docsJson = JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];

  const items: EntityListItem[] = docsJson.map((doc) => {
    const gallery = Array.isArray(doc.gallery) ? doc.gallery.length : 0;
    const platforms = Array.isArray(doc.platforms) ? doc.platforms : [];
    const title = doc.title as { en?: string } | undefined;

    return {
      id: String(doc._id),
      title: String(title?.en ?? "(untitled)"),
      status: String(doc.status ?? "draft"),
      favorite: Boolean(doc.featured),
      columns: [
        { label: "Year", value: String(doc.year ?? "—") },
        { label: "Lifecycle", value: String(doc.lifecycle ?? "live") },
        { label: "Platforms", value: platforms.length ? platforms.join(", ") : "—" },
        { label: "Images", value: String(gallery) },
      ],
    };
  });

  const withGallery = items.filter((item) => item.columns.at(-1)?.value !== "0").length;

  return (
    <AdminShell email={session.user.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-3 font-mono text-xs">
            <span>
              {items.length} {items.length === 1 ? "entry" : "entries"}
              {items.length > 1 && " · drag to reorder"}
            </span>
            {withGallery > 0 && (
              <span className="inline-flex items-center gap-1">
                <Images className="size-3.5" />
                {withGallery} with a gallery
              </span>
            )}
          </p>
        </div>

        <Button size="lg" render={<Link href="/admin/projects/new" />}>
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="border-hairline text-muted-foreground mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">
          Nothing here yet.
        </p>
      ) : (
        <EntityList resource="projects" items={items} reorderable hasFavorites />
      )}
    </AdminShell>
  );
}
