import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import {
  Article,
  Comment,
  Experience,
  MentoringTrack,
  OpenSource,
  Project,
  Resource,
  Snippet,
  Testimonial,
} from "@/lib/models";

export const metadata = { title: "Dashboard" };

const CARDS = [
  { model: Project, label: "Projects", href: "/admin/projects" },
  { model: Experience, label: "Experience", href: "/admin/experience" },
  { model: MentoringTrack, label: "Mentoring", href: "/admin/mentoring" },
  { model: Article, label: "Articles", href: "/admin/articles" },
  { model: Testimonial, label: "Testimonials", href: "/admin/testimonials" },
  { model: Resource, label: "Resources", href: "/admin/resources" },
  { model: OpenSource, label: "Open Source", href: "/admin/open-source" },
  { model: Snippet, label: "Snippets", href: "/admin/snippets" },
] as const;

export default async function AdminDashboard() {
  const session = await requireAdmin();
  await connectDB();

  const [counts, pendingComments] = await Promise.all([
    Promise.all(
      CARDS.map(async ({ model, label, href }) => ({
        label,
        href,
        total: await model.countDocuments(),
        published: await model.countDocuments({ status: "published" }),
      })),
    ),
    Comment.countDocuments({ status: "pending" }),
  ]);

  return (
    <AdminShell email={session.user.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Signed in as {session.user.name || session.user.email}.
      </p>

      {pendingComments > 0 && (
        <Link
          href="/admin/comments"
          className="border-signal/40 bg-signal/5 mt-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm"
        >
          <span className="lab-label text-signal">pending</span>
          {pendingComments} comment{pendingComments === 1 ? "" : "s"} awaiting moderation
        </Link>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(({ label, href, total, published }) => (
          <Link
            key={label}
            href={href}
            className="border-hairline bg-card/40 hover:border-ring rounded-xl border p-5 transition-colors"
          >
            <p className="lab-label text-muted-foreground">{label}</p>
            <p className="tabular mt-3 text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {published} published
              {total - published > 0 && ` · ${total - published} draft`}
            </p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
