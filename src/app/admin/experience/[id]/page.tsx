import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ExperienceForm } from "@/components/admin/experience-form";
import { requireAdmin } from "@/lib/auth-guard";
import { RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  return { title: `${id === "new" ? "New" : "Edit"} company` };
}

/**
 * A literal segment, so it shadows `admin/[resource]/[id]` for experience only.
 * The split has to reach this depth — with just `admin/experience/page.tsx`,
 * `/admin/experience/new` would still resolve to the generic form.
 */
export default async function ExperienceEditPage({ params }: { params: Params }) {
  const session = await requireAdmin();
  const { id } = await params;

  const isNew = id === "new";
  let values: Record<string, unknown> = {};

  if (!isNew) {
    await connectDB();
    const doc = await RESOURCES.experience.model.findById(id).lean();
    if (!doc) notFound();
    values = JSON.parse(JSON.stringify(doc));
  }

  return (
    <AdminShell email={session.user.email}>
      <ExperienceForm
        id={isNew ? null : id}
        fields={RESOURCES.experience.fields}
        values={values}
      />
    </AdminShell>
  );
}
