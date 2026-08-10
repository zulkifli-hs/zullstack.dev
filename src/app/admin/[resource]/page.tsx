import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityList, type EntityListItem } from "@/components/admin/entity-list";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";
import { isResourceKey, RESOURCE_KEYS, RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

type Params = Promise<{ resource: string }>;

/**
 * `projects` is excluded: it has its own literal route, which shadows this one.
 * Listing it here would advertise a param that can never be reached.
 */
/** Resources with a screen of their own, which this route never serves. */
const BESPOKE = new Set(["projects", "experience"]);

export function generateStaticParams() {
  return RESOURCE_KEYS.filter((resource) => !BESPOKE.has(resource)).map((resource) => ({
    resource,
  }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? RESOURCES[resource].label : "Admin" };
}

export default async function ResourceListPage({ params }: { params: Params }) {
  const session = await requireAdmin();
  const { resource } = await params;
  if (!isResourceKey(resource)) notFound();

  const def = RESOURCES[resource];
  await connectDB();

  const docs = await def.model.find().sort(def.sort).lean();
  // Same normalisation the public query layer does: `.lean()` skips schema
  // transforms, so `_id` never becomes `id` on its own.
  const docsJson = JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];

  const items: EntityListItem[] = docsJson.map((doc) => ({
    id: String(doc._id),
    title: titleOf(doc, def.titleField),
    status: String(doc.status ?? "draft"),
    favorite: Boolean(def.favoriteField && doc[def.favoriteField]),
    columns: (def.listColumns ?? []).map((column) => ({
      label: column.label,
      value: formatCell(doc[column.name]),
    })),
  }));

  return (
    <AdminShell email={session.user.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{def.label}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {items.length} {items.length === 1 ? "entry" : "entries"}
            {def.reorderable && items.length > 1 && " · drag to reorder"}
          </p>
        </div>

        <Button size="lg" render={<Link href={`/admin/${resource}/new`} />}>
          <Plus className="size-4" />
          New {def.singular.toLowerCase()}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="border-hairline text-muted-foreground mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">
          Nothing here yet.
        </p>
      ) : (
        <EntityList
          resource={resource}
          items={items}
          reorderable={Boolean(def.reorderable)}
          hasFavorites={Boolean(def.favoriteField)}
        />
      )}
    </AdminShell>
  );
}

/** Array columns (platforms, tags) would otherwise stringify with no spaces. */
function formatCell(value: unknown): string {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value == null || value === "") return "—";
  return String(value);
}

/** Title fields may be plain strings or `{ en, id }` — show English in admin. */
function titleOf(item: Record<string, unknown>, field: string): string {
  const value = item[field];
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "en" in value) {
    return String((value as { en: string }).en);
  }
  return "(untitled)";
}
