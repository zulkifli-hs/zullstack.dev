import { AdminShell } from "@/components/admin/admin-shell";
import { CommentRow } from "@/components/admin/comment-row";
import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { Article, Comment } from "@/lib/models";

export const metadata = { title: "Comments" };

/**
 * Moderation queue.
 *
 * Comments default to `pending` and are only rendered publicly once approved,
 * so an unmoderated queue fails closed rather than publishing spam. The public
 * comment form itself lands in Phase 3; this page exists now so the queue is
 * never the thing holding that up.
 */
export default async function CommentsPage() {
  const session = await requireAdmin();
  await connectDB();

  const docs = await Comment.find().sort({ createdAt: -1 }).limit(200).lean();
  const comments = JSON.parse(JSON.stringify(docs)) as Record<string, unknown>[];

  const articles = await Article.find().select("slug title").lean();
  const titles = new Map(
    articles.map((article) => [
      String(article._id),
      String((article.title as { en?: string } | undefined)?.en ?? article.slug),
    ]),
  );

  return (
    <AdminShell email={session.user.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
      <p className="text-muted-foreground mt-1 font-mono text-xs">
        {comments.length} total · {comments.filter((c) => c.status === "pending").length} pending
      </p>

      {comments.length === 0 ? (
        <p className="border-hairline text-muted-foreground mt-8 rounded-xl border border-dashed px-6 py-14 text-center text-sm">
          No comments yet.
        </p>
      ) : (
        <ul className="border-hairline divide-hairline mt-8 divide-y overflow-hidden rounded-xl border">
          {comments.map((comment) => (
            <CommentRow
              key={String(comment._id)}
              id={String(comment._id)}
              authorName={String(comment.authorName)}
              body={String(comment.body)}
              status={String(comment.status)}
              articleTitle={titles.get(String(comment.articleId)) ?? "—"}
              createdAt={new Date(String(comment.createdAt)).toISOString().slice(0, 10)}
            />
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
