import { Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityRow } from "@/components/admin/entity-row";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";
import { isResourceKey, RESOURCE_KEYS, RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

type Params = Promise<{ resource: string }>;

export function generateStaticParams() {
  return RESOURCE_KEYS.map((resource) => ({ resource }));
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
  const items = JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];

  return (
    <AdminShell email={session.user.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{def.label}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {items.length} {items.length === 1 ? "entry" : "entries"}
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
        <ul className="border-hairline divide-hairline mt-8 divide-y overflow-hidden rounded-xl border">
          {items.map((item) => (
            <EntityRow
              key={String(item._id)}
              resource={resource}
              id={String(item._id)}
              title={titleOf(item, def.titleField)}
              status={String(item.status ?? "draft")}
              columns={(def.listColumns ?? []).map((column) => ({
                label: column.label,
                value: String(item[column.name] ?? "—"),
              }))}
            />
          ))}
        </ul>
      )}
    </AdminShell>
  );
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
