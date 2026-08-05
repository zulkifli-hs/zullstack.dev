import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingPage } from "@/components/lab/page-shell";
import { ArticleList } from "@/components/sections/content-grids";
import { resolveLocale } from "@/i18n/resolve-locale";
import { getArticles } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "sections.articles" });
  return { title: t("title"), description: t("description") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const items = await getArticles();
  const t = await getTranslations("sections.articles");

  return (
    <ListingPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      isEmpty={items.length === 0}
      emptyMessage={t("empty")}
    >
      <ArticleList
        items={items}
        locale={locale}
        readingTimeLabel={(minutes) => t("readingTime", { minutes })}
      />
    </ListingPage>
  );
}
