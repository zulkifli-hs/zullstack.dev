import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { Article, Project } from "@/lib/models";
import { pick } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";

export type SearchHit = {
  type: "project" | "article";
  slug: string;
  title: string;
  summary: string;
};

/** Escapes user input before it reaches a RegExp — otherwise `(` throws. */
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const localeParam = request.nextUrl.searchParams.get("locale") ?? routing.defaultLocale;
  const locale = (routing.locales.includes(localeParam as Locale) ? localeParam : routing.defaultLocale) as Locale;

  if (query.length < 2 || !isDatabaseConfigured()) {
    return NextResponse.json({ hits: [] satisfies SearchHit[] });
  }

  await connectDB();

  /**
   * Case-insensitive regex rather than a `$text` index.
   *
   * Atlas Search is unavailable on the free tier, and `$text` allows only one
   * index per collection and no partial-word matching. At this content volume
   * (tens of documents) a regex scan is instant and matches substrings, which
   * is what people actually expect from a ⌘K palette.
   */
  const pattern = new RegExp(escapeRegex(query), "i");
  const match = (fields: string[]) => ({
    status: "published",
    $or: fields.map((field) => ({ [field]: pattern })),
  });

  const [projects, articles] = await Promise.all([
    Project.find(match(["title.en", "title.id", "summary.en", "summary.id", "techStack"]))
      .limit(6)
      .lean(),
    Article.find(match(["title.en", "title.id", "excerpt.en", "excerpt.id", "tags"]))
      .limit(6)
      .lean(),
  ]);

  const hits: SearchHit[] = [
    ...projects.map((doc) => ({
      type: "project" as const,
      slug: String(doc.slug),
      title: pick(doc.title as { en: string; id: string }, locale),
      summary: pick(doc.summary as { en: string; id: string }, locale),
    })),
    ...articles.map((doc) => ({
      type: "article" as const,
      slug: String(doc.slug),
      title: pick(doc.title as { en: string; id: string }, locale),
      summary: pick(doc.excerpt as { en: string; id: string }, locale),
    })),
  ];

  return NextResponse.json({ hits });
}
