import { AdminShell } from "@/components/admin/admin-shell";
import { LensFilter } from "@/components/glass/lens-filter";
import { requireAdmin } from "@/lib/auth-guard";

import { DesignShowcase } from "./showcase";

export const metadata = { title: "Liquid Glass" };

/**
 * Visual reference for the Liquid Glass system.
 *
 * Unlike `/dev/glass` — which is a bare token harness — this page shows the
 * material the way Apple demonstrates it: over real, busy content, where the
 * refraction has something to bend. Glass over a flat colour is indistinguishable
 * from a tinted box; glass over structure is where the lens becomes visible.
 */
export default async function DesignPage() {
  const session = await requireAdmin();

  return (
    <AdminShell email={session.user.email}>
      {/* Every tier is mounted here because the page demonstrates all of them.
          Real pages mount only what they use — each filter reserves its own GPU
          and compositing resources. */}
      <LensFilter />
      <DesignShowcase />
    </AdminShell>
  );
}
