import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { ListingPage } from "@/components/lab/page-shell";
import { Badge } from "@/components/ui/badge";
import { resolveLocale } from "@/i18n/resolve-locale";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { getPartnerProjectCounts, getPartners } from "@/lib/queries";
import { pick } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "sections.partners" });
  return { title: t("title"), description: t("description") };
}

/**
 * Agencies and clients, listed on their own.
 *
 * The project count is deliberately allowed to be zero: some engagements can be
 * credited but never shown, and this page is the only place that work exists at
 * all. A partner with no public project is the point, not an edge case.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const [partners, counts, t] = await Promise.all([
    getPartners(),
    getPartnerProjectCounts(),
    getTranslations("sections.partners"),
  ]);

  return (
    <ListingPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      isEmpty={partners.length === 0}
      emptyMessage={t("empty")}
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => {
          const count = counts[partner.id] ?? 0;

          const body = (
            <>
              <div className="flex h-10 items-center">
                {partner.logo?.url ? (
                  <Image
                    src={cloudinarySrc(partner.logo)}
                    alt={partner.logo.alt?.[locale] || partner.name}
                    width={partner.logo.width ?? 160}
                    height={partner.logo.height ?? 80}
                    className="max-h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-lg font-semibold tracking-tight">{partner.name}</span>
                )}
              </div>

              {partner.logo?.url && (
                <h3 className="mt-4 text-base font-semibold tracking-tight">{partner.name}</h3>
              )}

              {pick(partner.description, locale) && (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm text-pretty">
                  {pick(partner.description, locale)}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{t(`kind.${partner.kind}`)}</Badge>
                <span className="text-muted-foreground font-mono text-xs">
                  {t("projectCount", { count })}
                </span>
              </div>
            </>
          );

          return (
            <GlassPanel
              key={partner.id}
              variant="lens"
              tier="card"
              padding="md"
              className="group flex flex-col"
            >
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="after:absolute after:inset-0"
                >
                  {body}
                </a>
              ) : (
                body
              )}
            </GlassPanel>
          );
        })}
      </div>
    </ListingPage>
  );
}
