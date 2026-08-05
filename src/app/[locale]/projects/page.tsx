import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingPage } from "@/components/lab/page-shell";
import { resolveLocale } from "@/i18n/resolve-locale";
import { ProjectGrid } from "@/components/sections/project-grid";
import { getProjects } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "sections.projects" });
  return { title: t("title"), description: t("description") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const items = await getProjects();
  const t = await getTranslations("sections.projects");

  return (
    <ListingPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      isEmpty={items.length === 0}
      emptyMessage={t("empty")}
    >
      <ProjectGrid items={items} locale={locale} />
    </ListingPage>
  );
}
