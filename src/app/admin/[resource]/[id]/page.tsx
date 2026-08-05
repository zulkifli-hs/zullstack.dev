import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { EntityForm } from "@/components/admin/entity-form";
import { requireAdmin } from "@/lib/auth-guard";
import { isResourceKey, RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

type Params = Promise<{ resource: string; id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { resource, id } = await params;
  if (!isResourceKey(resource)) return { title: "Admin" };
  const def = RESOURCES[resource];
  return { title: `${id === "new" ? "New" : "Edit"} ${def.singular.toLowerCase()}` };
}

export default async function EntityEditPage({ params }: { params: Params }) {
  const session = await requireAdmin();
  const { resource, id } = await params;
  if (!isResourceKey(resource)) notFound();

  const def = RESOURCES[resource];
  // "new" is a sentinel rather than a separate route: the create and edit forms
  // are identical apart from whether they start populated.
  const isNew = id === "new";

  let values: Record<string, unknown> = {};

  if (!isNew) {
    await connectDB();
    const doc = await def.model.findById(id).lean();
    if (!doc) notFound();
    values = JSON.parse(JSON.stringify(doc));
  }

  return (
    <AdminShell email={session.user.email}>
      <EntityForm
        resource={resource}
        resourceLabel={def.label}
        id={isNew ? null : id}
        fields={def.fields}
        values={values}
      />
    </AdminShell>
  );
}
