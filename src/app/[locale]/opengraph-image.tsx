import { ImageResponse } from "next/og";

import { BRAND, brandDataUri } from "@/lib/brand";
import { routing, type Locale } from "@/i18n/routing";
import { getSiteConfig } from "@/lib/queries";
import { pick } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "zullstack.dev — Your Software Lab Partner";

/**
 * Default social card for every page that does not define its own.
 *
 * Same constraint as the article card: `next/og` runs a minimal CSS subset —
 * flex only, and any element with more than one child needs an explicit
 * `display`, or Satori throws at render time rather than at build.
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = (routing.locales.includes(raw as Locale) ? raw : routing.defaultLocale) as Locale;

  const [config, lockup] = await Promise.all([
    getSiteConfig(),
    // White wordmark, because this card is always on the dark ground.
    brandDataUri(BRAND.lockupOnDark),
  ]);
  const tagline =
    pick(config?.tagline, locale) ||
    (locale === "id" ? "Partner Lab Software Anda" : "Your Software Lab Partner");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "#0b0d12",
          backgroundImage:
            "linear-gradient(rgba(74,127,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(74,127,255,0.10) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#f5f7fa",
          fontFamily: "sans-serif",
        }}
      >
        {/* Raw <img>: next/image does not exist inside an ImageResponse. */}
        <img src={lockup} alt="" width={520} height={156} />

        {/*
          The lockup already carries "Your Software Lab Partner" in English, so
          repeating it below would just print the same words twice. It is only
          worth showing when the visitor's language differs from the one baked
          into the artwork.
        */}
        {locale !== "en" && (
          <div style={{ marginTop: 16, fontSize: 34, color: "#a8afc0" }}>{tagline}</div>
        )}

        <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: "#5c6478" }}>
          {config?.name ?? "Zulkifli"} — Fullstack Engineer &amp; Coding Mentor
        </div>
      </div>
    ),
    size,
  );
}
