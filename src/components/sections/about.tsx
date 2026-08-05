import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Section, SectionHeading } from "@/components/lab/section";
import type { Locale } from "@/i18n/routing";
import { pick } from "@/lib/utils";
import type { SiteConfig } from "@/types/content";

/** Maps a stat key from the CMS onto its translated label. */
const STAT_LABELS = {
  years: "yearsLabel",
  projects: "projectsLabel",
  students: "studentsLabel",
  stack: "stackLabel",
} as const;

export async function About({ config, locale }: { config: SiteConfig | null; locale: Locale }) {
  const t = await getTranslations("about");
  const bio = pick(config?.bio, locale);
  const stats = (config?.stats ?? []).filter((s) => s.key in STAT_LABELS);

  return (
    <Section id="about">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {bio && <p className="text-base leading-relaxed text-pretty">{bio}</p>}
          {config?.location && (
            <p className="text-muted-foreground mt-4 font-mono text-xs">{config.location}</p>
          )}
        </div>

        {stats.length > 0 && (
          <GlassPanel variant="glass" tier="card" className="h-fit">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
              {stats.map((stat) => (
                <div key={stat.key}>
                  <dd className="text-signal tabular text-2xl font-semibold">
                    {stat.value}
                    {stat.suffix}
                  </dd>
                  <dt className="lab-label text-muted-foreground mt-1">
                    {t(STAT_LABELS[stat.key as keyof typeof STAT_LABELS])}
                  </dt>
                </div>
              ))}
            </dl>
          </GlassPanel>
        )}
      </div>
    </Section>
  );
}
