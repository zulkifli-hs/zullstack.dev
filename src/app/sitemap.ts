import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { getArticles, getProjectSlugs } from "@/lib/queries";
import { localeAlternates, SITE_URL, STATIC_ROUTES } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectSlugs, articles] = await Promise.all([getProjectSlugs(), getArticles()]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const route of STATIC_ROUTES) {
      entries.push({
        url: `${SITE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1 : 0.7,
        // Every entry declares all locales so the alternates cluster is
        // complete in both directions.
        alternates: { languages: localeAlternates(route) },
      });
    }

    for (const slug of projectSlugs) {
      entries.push({
        url: `${SITE_URL}/${locale}/projects/${slug}`,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: localeAlternates(`/projects/${slug}`) },
      });
    }

    for (const article of articles) {
      entries.push({
        url: `${SITE_URL}/${locale}/articles/${article.slug}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: localeAlternates(`/articles/${article.slug}`) },
      });
    }
  }

  return entries;
}
