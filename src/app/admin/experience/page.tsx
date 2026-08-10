import { Plus } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityList, type EntityListItem } from "@/components/admin/entity-list";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-guard";
import { RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";
import { Partner } from "@/lib/models";

export const metadata = { title: "Experience" };

/**
 * One row per company, not per job title.
 *
 * The name comes from the referenced partner, so the list has to resolve it —
 * `titleField` would only find the legacy string on documents that predate the
 * restructure.
 */
export default async function ExperienceListPage() {
  const session = await requireAdmin();
  const def = RESOURCES.experience;

  await connectDB();

  const docs = await def.model.find().sort(def.sort).populate({ path: "partner" }).lean();
  const docsJson = JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];

  const items: EntityListItem[] = docsJson.map((doc) => {
    const partner = doc.partner as { name?: string } | null;
    const positions = Array.isArray(doc.positions) ? doc.positions : [];

    // A document that has not been migrated still carries one position inline.
    const count = positions.length || (doc.position ? 1 : 0);

    return {
      id: String(doc._id),
      title: String(partner?.name ?? doc.company ?? "(no company)"),
      status: String(doc.status ?? "draft"),
      favorite: false,
      columns: [
        { label: "Positions", value: String(count) },
        { label: "Company", value: partner ? "linked" : "not linked" },
      ],
    };
  });

  // The reason a company can be missing: it has to exist under Partners first.
  const partners = await Partner.countDocuments({ kind: "employer" });

  return (
    <AdminShell email={session.user.email}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Experience</h1>
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {items.length} {items.length === 1 ? "company" : "companies"}
            {items.length > 1 && " · drag to reorder"}
          </p>
        </div>

        <Button size="lg" render={<Link href="/admin/experience/new" />}>
          <Plus className="size-4" />
          New company
        </Button>
      </div>

      {partners === 0 && (
        <p className="border-hairline text-muted-foreground mt-6 rounded-xl border border-dashed px-5 py-4 text-sm">
          No companies registered yet. Add them under{" "}
          <Link href="/admin/partners" className="text-link hover:underline">
            Partners
          </Link>{" "}
          with kind <span className="font-mono">employer</span> — that is where the name, logo and
          website come from, and employers stay off the public partners page.
        </p>
      )}

      {items.length === 0 ? (
        <p className="border-hairline text-muted-foreground mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">
          Nothing here yet.
        </p>
      ) : (
        <EntityList resource="experience" items={items} reorderable hasFavorites={false} />
      )}
    </AdminShell>
  );
}
