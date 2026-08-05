"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-guard";
import { connectDB } from "@/lib/db";
import { Article, Comment } from "@/lib/models";

type Status = "pending" | "approved" | "spam";

/** Keeps the denormalised counter on the article in step with reality. */
async function syncCommentCount(articleId: unknown) {
  const count = await Comment.countDocuments({ articleId, status: "approved" });
  await Article.updateOne({ _id: articleId }, { commentCount: count });
}

export async function setCommentStatus(id: string, status: Status) {
  await requireAdmin();
  await connectDB();

  const comment = await Comment.findById(id).select("articleId status");
  if (!comment) return;

  comment.status = status;
  await comment.save();
  await syncCommentCount(comment.articleId);

  const article = await Article.findById(comment.articleId).select("slug");
  // The article page is statically generated, so approving a comment has to
  // invalidate the rendered HTML or the comment never appears publicly.
  if (article?.slug) revalidatePath(`/[locale]/articles/${article.slug}`, "page");
  revalidatePath("/admin/comments");
}

export async function deleteComment(id: string) {
  await requireAdmin();
  await connectDB();

  const comment = await Comment.findById(id).select("articleId");
  if (!comment) return;

  const articleId = comment.articleId;
  await comment.deleteOne();
  await syncCommentCount(articleId);

  const article = await Article.findById(articleId).select("slug");
  if (article?.slug) revalidatePath(`/[locale]/articles/${article.slug}`, "page");
  revalidatePath("/admin/comments");
}
