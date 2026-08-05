import { AdminShell } from "@/components/admin/admin-shell";
import { SiteConfigForm } from "@/components/admin/site-config-form";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { SiteConfig } from "@/lib/models";

export const metadata = { title: "Site config" };

export default async function SiteConfigPage() {
  const session = await requireAdmin();
  await connectDB();

  const doc = await SiteConfig.findOne({ key: "site" }).lean();
  const config = doc ? (JSON.parse(JSON.stringify(doc)) as Record<string, unknown>) : {};

  return (
    <AdminShell email={session.user.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Site config</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Name, bio, contact details and the stats shown on the About section.
      </p>

      <SiteConfigForm config={config} />
    </AdminShell>
  );
}
