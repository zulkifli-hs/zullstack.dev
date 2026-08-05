import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import { connectDB } from "@/lib/db";
import { Article, Comment } from "@/lib/models";
import { formatDate } from "@/lib/utils";

/**
 * Approved comments for an article.
 *
 * Only `status: "approved"` is ever selected, so an unmoderated queue cannot
 * leak onto the page. Email addresses are stored as hashes and never rendered —
 * the hash only drives the gravatar.
 */
export async function CommentList({
  articleSlug,
  locale,
}: {
  articleSlug: string;
  locale: Locale;
}) {
  const t = await getTranslations("comments");
  await connectDB();

  const article = await Article.findOne({ slug: articleSlug }).select("_id");
  if (!article) return null;

  const docs = await Comment.find({ articleId: article._id, status: "approved" })
    .sort({ createdAt: 1 })
    .lean();

  if (docs.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;
  }

  return (
    <ul className="divide-hairline/60 divide-y">
      {docs.map((comment) => (
        <li key={String(comment._id)} className="flex gap-3 py-5 first:pt-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- gravatar is
              an external avatar service; next/image would need it allowlisted
              for zero benefit at 40px. */}
          <img
            src={`https://www.gravatar.com/avatar/${comment.authorEmailHash}?s=80&d=identicon`}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            className="border-hairline size-10 shrink-0 rounded-full border"
          />

          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-medium">{String(comment.authorName)}</p>
              <time
                dateTime={new Date(String(comment.createdAt)).toISOString()}
                className="text-muted-foreground font-mono text-xs"
              >
                {formatDate(String(comment.createdAt), locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
            <p className="text-muted-foreground mt-1.5 text-sm whitespace-pre-line">
              {String(comment.body)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
