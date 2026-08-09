import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { CommentForm } from "@/components/articles/comment-form";
import { CommentList } from "@/components/articles/comment-list";
import { LikeButton } from "@/components/articles/like-button";
import { Tag } from "@/components/lab/section";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/resolve-locale";
import { routing } from "@/i18n/routing";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { getArticleBySlug, getArticleSlugs } from "@/lib/queries";
import { formatDate, pick } from "@/lib/utils";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const validLocale = (
    routing.locales.includes(locale as never) ? locale : routing.defaultLocale
  ) as never;

  return {
    title: pick(article.title, validLocale),
    description: pick(article.excerpt, validLocale),
    openGraph: {
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      tags: article.tags,
    },
  };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [t, tCommon, tComments] = await Promise.all([
    getTranslations("sections.articles"),
    getTranslations("common"),
    getTranslations("comments"),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-20">
      <Link
        href="/articles"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {tCommon("backTo", { section: t("title") })}
      </Link>

      <article className="mt-8">
        <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs">
          <time dateTime={article.publishedAt ?? undefined}>
            {formatDate(article.publishedAt, locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span aria-hidden>·</span>
          <span>{t("readingTime", { minutes: article.readingTime })}</span>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {pick(article.title, locale)}
        </h1>

        <p className="text-muted-foreground mt-4 text-base text-pretty">
          {pick(article.excerpt, locale)}
        </p>

        {article.coverImage?.url && (
          <div className="border-hairline/60 relative mt-8 aspect-16/9 overflow-hidden rounded-xl border">
            <Image
              src={cloudinarySrc(article.coverImage)}
              alt={pick(article.title, locale)}
              fill
              priority
              quality={90}
              sizes="(min-width: 672px) 672px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {article.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}

        {/*
          Content is HTML rendered by the admin editor at save time, so reads
          never pay for markdown compilation. It is trusted because only the
          single authenticated admin can author it — the moment any other
          source can write here, this needs sanitising.
        */}
        <div
          className="prose prose-sm dark:prose-invert prose-headings:tracking-tight prose-a:text-link border-hairline/60 mt-10 max-w-none border-t pt-10"
          dangerouslySetInnerHTML={{ __html: pick(article.content, locale) }}
        />
      </article>

      <div className="border-hairline/60 mt-12 border-t pt-8">
        <LikeButton articleSlug={slug} initialCount={article.likeCount} />
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-semibold tracking-tight">{tComments("title")}</h2>

        <div className="mt-6">
          <CommentList articleSlug={slug} locale={locale} />
        </div>

        <div className="border-hairline/60 mt-10 border-t pt-8">
          <CommentForm articleSlug={slug} />
        </div>
      </section>
    </main>
  );
}
