import { routing, type Locale } from "@/i18n/routing";
import { getArticles, getSiteConfig } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { pick } from "@/lib/utils";

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** XML has five reserved characters; unescaped content breaks every reader. */
function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (routing.locales.includes(raw as Locale) ? raw : routing.defaultLocale) as Locale;

  const [articles, config] = await Promise.all([getArticles(), getSiteConfig()]);
  const home = `${SITE_URL}/${locale}`;

  const items = articles
    .map((article) => {
      const url = `${home}/articles/${article.slug}`;
      return `    <item>
      <title>${escapeXml(pick(article.title, locale))}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(pick(article.excerpt, locale))}</description>
      ${article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config?.name ?? "Zulkifli")} — zullstack.dev</title>
    <link>${home}</link>
    <description>${escapeXml(pick(config?.tagline, locale) || "Your Software Lab Partner")}</description>
    <language>${locale}</language>
    <atom:link href="${home}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
