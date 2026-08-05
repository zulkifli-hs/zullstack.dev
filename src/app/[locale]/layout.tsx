import { Geist, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { LensFilter } from "@/components/glass/lens-filter";
import { LensProvider } from "@/components/glass/lens-provider";
import { LabBackground } from "@/components/lab/lab-background";
import { ContactFab } from "@/components/layout/contact-fab";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TabBar } from "@/components/layout/tab-bar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TransparencyScript } from "@/components/providers/transparency-script";
import { resolveLocale } from "@/i18n/resolve-locale";
import { routing } from "@/i18n/routing";
import { ICONS } from "@/lib/brand";
import { contactChannels } from "@/lib/contact";
import { getSiteConfig } from "@/lib/queries";
import { localeAlternates, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

import "../globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** Pre-renders both locales at build time instead of on first request. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // Async in Next 16 — synchronous `params` access was removed, not deprecated.
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    // metadataBase makes every relative URL below (canonical, OG images)
    // resolve to an absolute one, which OG and Twitter cards require.
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: t("titleTemplate", { page: "%s" }) },
    description: t("description"),
    icons: ICONS,
    manifest: "/favicon/site.webmanifest",
    alternates: {
      canonical: `/${locale}`,
      languages: localeAlternates(""),
    },
    openGraph: {
      type: "website",
      siteName: "zullstack.dev",
      locale: locale === "id" ? "id_ID" : "en_US",
      url: `${SITE_URL}/${locale}`,
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Validates the segment and enables static rendering.
  const locale = await resolveLocale(params);
  const config = await getSiteConfig();

  // Schema.org Person, so search engines can attribute the work to a named
  // individual rather than inferring it from page copy.
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config?.name ?? "Zulkifli",
    url: `${SITE_URL}/${locale}`,
    jobTitle: "Fullstack Engineer & Coding Mentor",
    email: config?.email || undefined,
    sameAs: (config?.socials ?? []).map((s) => s.url).filter(Boolean),
  };

  return (
    <html
      lang={locale}
      // next-themes writes data-theme on <html> before React hydrates, so the
      // server and client markup legitimately differ on this element.
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(geistSans.variable, jetbrainsMono.variable)}
    >
      <head>
        <TransparencyScript />
        <script
          type="application/ld+json"
          // Serialised JSON-LD, not user input — but the </script> escape still
          // matters if any CMS field ever contains one.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <ThemeProvider>
            <LabBackground />
            {/* Static tiers: what every surface paints with until — and if —
                its own runtime map arrives. `card` joins the list now that
                content cards are lensed. */}
            <LensFilter tiers={["lg", "card", "pill", "switch", "thumb", "md"]} />
            <LensProvider />
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            {/* Bottom navigation floats over the page, so the footer needs room
                to clear it — otherwise the last row of links sits underneath
                the capsule and cannot be tapped. */}
            <div aria-hidden className="h-24 lg:hidden" />
            <TabBar />
            <ContactFab channels={contactChannels(config)} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
