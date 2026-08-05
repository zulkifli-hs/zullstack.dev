import { ImageResponse } from "next/og";

import { routing, type Locale } from "@/i18n/routing";
import { getArticleBySlug } from "@/lib/queries";
import { pick } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Article preview";

/**
 * Social preview card, rendered per article.
 *
 * Deliberately reuses the site's own visual language — deep ink ground, the
 * blueprint grid, the brand flask, mono metadata — so a shared link looks like
 * it came from this site rather than from a generic template.
 *
 * `next/og` runs a minimal CSS subset: flex only, no grid, no gap shorthand
 * quirks, and every element with multiple children needs an explicit display.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = (
    routing.locales.includes(rawLocale as Locale) ? rawLocale : routing.defaultLocale
  ) as Locale;

  const article = await getArticleBySlug(slug);

  const title = article ? pick(article.title, locale) : "zullstack.dev";
  const excerpt = article ? pick(article.excerpt, locale) : "Your Software Lab Partner";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0b0d12",
          // The blueprint grid, drawn as two repeating gradients.
          backgroundImage:
            "linear-gradient(rgba(74,127,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(74,127,255,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#f5f7fa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="44" height="38" viewBox="0 0 460 400" fill="none" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
            <path d="M262 22 H330 M282 22 V96 L438 366 H42 L86 290" stroke="#326afd" />
            <path d="M126 22 H228 L96 244 H258" stroke="#92ec47" />
            <circle cx="310" cy="244" r="19" fill="#92ec47" />
          </svg>
          {/* Two children (a text node and a span), so Satori requires an
              explicit display — it has no default block layout. */}
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            zullstack<span style={{ color: "#92ec47" }}>.dev</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              color: "#92ec47",
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            {article ? "// notes" : "// zullstack.dev"}
          </div>

          <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1.5 }}>
            {/* Long headlines would overflow the fixed canvas. */}
            {title.length > 82 ? `${title.slice(0, 82)}…` : title}
          </div>

          <div style={{ marginTop: 24, fontSize: 26, color: "#a8afc0", lineHeight: 1.4 }}>
            {excerpt.length > 120 ? `${excerpt.slice(0, 120)}…` : excerpt}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 20, color: "#5c6478" }}>
          Zulkifli — Fullstack Engineer &amp; Coding Mentor
        </div>
      </div>
    ),
    size,
  );
}
