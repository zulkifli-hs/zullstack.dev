"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { Article, Comment, Like } from "@/lib/models";
// Shared with the analytics ingest route. They cannot live in this file: it is
// `"use server"`, so every export here is a Server Action, and a Route Handler
// cannot import one. See `lib/visitor.ts`.
import { ipHash, readVisitorHash, visitorHash } from "@/lib/visitor";

const commentSchema = z.object({
  articleSlug: z.string().trim().min(1),
  authorName: z.string().trim().min(2, "Please enter your name").max(80),
  authorEmail: z.email("Please enter a valid email"),
  body: z.string().trim().min(4, "Comment is too short").max(4000),
  // Honeypot: a field hidden from humans. Bots fill every input they find, so
  // anything non-empty here is automated.
  website: z.string().max(0, "Rejected"),
});

export type CommentState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export async function submitComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const parsed = commentSchema.safeParse({
    articleSlug: formData.get("articleSlug"),
    authorName: formData.get("authorName"),
    authorEmail: formData.get("authorEmail"),
    body: formData.get("body"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[issue.path.join(".")] ??= issue.message;
    // The honeypot failure is reported as generic success-shaped noise rather
    // than a specific error, so a bot cannot learn which field trapped it.
    if (errors.website) return { ok: false, message: "Could not post that comment." };
    return { ok: false, errors };
  }

  const { articleSlug, authorName, authorEmail, body } = parsed.data;

  await connectDB();
  const article = await Article.findOne({ slug: articleSlug, status: "published" }).select("_id");
  if (!article) return { ok: false, message: "That article no longer exists." };

  const ip = await ipHash();

  // Crude rate limit: five comments per IP per ten minutes. Enough to stop
  // casual flooding without needing Redis for a personal site.
  const recent = await Comment.countDocuments({
    ipHash: ip,
    createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
  });
  if (recent >= 5) {
    return { ok: false, message: "Too many comments just now. Please try again shortly." };
  }

  await Comment.create({
    articleId: article._id,
    authorName,
    // Only ever a hash: enough for a gravatar, never enough to display or leak.
    authorEmailHash: createHash("sha256").update(authorEmail.trim().toLowerCase()).digest("hex"),
    body,
    ipHash: ip,
    // Defaults to pending — an unmoderated queue fails closed rather than
    // publishing whatever arrives.
    status: "pending",
  });

  return { ok: true, message: "Thanks — your comment will appear once approved." };
}

export async function toggleLike(articleSlug: string): Promise<{ liked: boolean; count: number }> {
  await connectDB();

  const article = await Article.findOne({ slug: articleSlug, status: "published" }).select("_id");
  if (!article) return { liked: false, count: 0 };

  const visitor = await visitorHash();
  const existing = await Like.findOne({ articleId: article._id, visitorHash: visitor });

  if (existing) {
    await existing.deleteOne();
  } else {
    try {
      await Like.create({ articleId: article._id, visitorHash: visitor });
    } catch (error) {
      // The unique compound index makes a double-like a database-level
      // impossibility; a racing duplicate is not an error worth surfacing.
      const message = error instanceof Error ? error.message : "";
      if (!/duplicate key/i.test(message)) throw error;
    }
  }

  const count = await Like.countDocuments({ articleId: article._id });
  await Article.updateOne({ _id: article._id }, { likeCount: count });

  revalidatePath(`/[locale]/articles/${articleSlug}`, "page");

  return { liked: !existing, count };
}

/** Current like state for this visitor, for the initial render. */
export async function getLikeState(articleSlug: string) {
  await connectDB();

  const article = await Article.findOne({ slug: articleSlug }).select("_id likeCount");
  if (!article) return { liked: false, count: 0 };

  // Read-only: a visitor who has never liked anything must not be handed a
  // cookie merely for rendering the button's initial state.
  const visitor = await readVisitorHash();
  const liked = visitor
    ? Boolean(await Like.exists({ articleId: article._id, visitorHash: visitor }))
    : false;

  return { liked, count: Number(article.likeCount ?? 0) };
}
