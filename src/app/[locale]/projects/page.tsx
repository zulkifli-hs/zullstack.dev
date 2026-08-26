import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProjectBrowser } from "@/components/sections/project-browser";
import { resolveLocale } from "@/i18n/resolve-locale";
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

/**
 * Unlike the other listing pages, this one does not render `ListingPage`
 * itself — `ProjectBrowser` does. The filter button belongs at the end of the
 * title row and the results below it, and both are driven by the same state, so
 * the frame has to live on the same side of the boundary as that state.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const items = await getProjects();

  return <ProjectBrowser items={items} locale={locale} />;
}
