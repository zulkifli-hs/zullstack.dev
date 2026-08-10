import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/auth-guard";
import { RESOURCES } from "@/lib/admin/resources";
import { connectDB } from "@/lib/db";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  return { title: `${id === "new" ? "New" : "Edit"} project` };
}

/**
 * A literal segment, so it shadows `admin/[resource]/[id]` for projects only.
 * The split has to reach this depth — with just `admin/projects/page.tsx`,
 * `/admin/projects/new` would still resolve to the generic form.
 */
export default async function ProjectEditPage({ params }: { params: Params }) {
  const session = await requireAdmin();
  const { id } = await params;

  // "new" is a sentinel rather than a separate route: the create and edit forms
  // are identical apart from whether they start populated.
  const isNew = id === "new";

  let values: Record<string, unknown> = {};

  if (!isNew) {
    await connectDB();
    const doc = await RESOURCES.projects.model.findById(id).lean();
    if (!doc) notFound();
    values = JSON.parse(JSON.stringify(doc));
  }

  return (
    <AdminShell email={session.user.email}>
      {/* Fields still come from the descriptor: this screen owns the layout, not
          the definition of what a project is. */}
      <ProjectForm id={isNew ? null : id} fields={RESOURCES.projects.fields} values={values} />
    </AdminShell>
  );
}
