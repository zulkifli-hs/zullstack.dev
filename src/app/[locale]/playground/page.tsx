import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingPage } from "@/components/lab/page-shell";
import { resolveLocale } from "@/i18n/resolve-locale";
import { NOINDEX } from "@/lib/navigation";
import { SnippetShowcase } from "@/components/sections/content-grids";
import { getSnippets } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "sections.playground" });
  // Hidden from public navigation while experimental, so it should not be
  // indexed either — the route stays reachable for development.
  return { title: t("title"), description: t("description"), ...NOINDEX };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const items = await getSnippets();
  const t = await getTranslations("sections.playground");

  return (
    <ListingPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      isEmpty={items.length === 0}
      emptyMessage={t("empty")}
    >
      <SnippetShowcase items={items} locale={locale} />
    </ListingPage>
  );
}
