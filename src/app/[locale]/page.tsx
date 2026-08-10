import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Section, SectionHeading } from "@/components/lab/section";
import { About } from "@/components/sections/about";
import {
  ArticleList,
  MentoringGrid,
  OpenSourceGrid,
  TestimonialGrid,
} from "@/components/sections/content-grids";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { Hero } from "@/components/sections/hero";
import { ProjectGrid } from "@/components/sections/project-grid";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/resolve-locale";
import {
  getArticles,
  getExperience,
  getMentoringTracks,
  getOpenSource,
  getProjects,
  getSiteConfig,
  getTestimonials,
} from "@/lib/queries";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);

  // One round of parallel reads rather than eight sequential awaits — this page
  // touches every collection, so waterfalling would dominate build time.
  const [config, projects, experience, mentoring, articles, testimonials, openSource] =
    await Promise.all([
      getSiteConfig(),
      getProjects({ limit: 3 }),
      getExperience(),
      getMentoringTracks({ limit: 3 }),
      getArticles({ limit: 3 }),
      getTestimonials({ limit: 3 }),
      getOpenSource({ limit: 3 }),
    ]);

  const t = await getTranslations("sections");
  const tCta = await getTranslations("cta");

  return (
    <>
      <Hero config={config} locale={locale} />
      <About config={config} locale={locale} />

      {/* Empty collections are left out entirely rather than rendered as an
          empty state. On a listing page "nothing published yet" is the honest
          answer to what the visitor asked for; on the home page it is a heading
          and a paragraph promising something that is not there. */}
      {projects.length > 0 && (
        <Section id="projects">
          <SectionHeading
            eyebrow={t("projects.eyebrow")}
            title={t("projects.title")}
            description={t("projects.description")}
            href="/projects"
            cta={t("projects.cta")}
          />
          <div className="mt-10">
            <ProjectGrid items={projects} locale={locale} />
          </div>
        </Section>
      )}

      {experience.length > 0 && (
        <Section id="experience">
          <SectionHeading
            eyebrow={t("experience.eyebrow")}
            title={t("experience.title")}
            description={t("experience.description")}
            href="/experience"
            cta={t("experience.cta")}
          />
          <div className="mt-10">
            <ExperienceTimeline items={experience} locale={locale} limit={3} />
          </div>
        </Section>
      )}

      {mentoring.length > 0 && (
        <Section id="mentoring">
          <SectionHeading
            eyebrow={t("mentoring.eyebrow")}
            title={t("mentoring.title")}
            description={t("mentoring.description")}
            href="/mentoring"
            cta={t("mentoring.cta")}
          />
          <div className="mt-10">
            <MentoringGrid items={mentoring} locale={locale} />
          </div>
        </Section>
      )}

      {articles.length > 0 && (
        <Section id="articles">
          <SectionHeading
            eyebrow={t("articles.eyebrow")}
            title={t("articles.title")}
            description={t("articles.description")}
            href="/articles"
            cta={t("articles.cta")}
          />
          <div className="mt-10">
            <ArticleList
              items={articles}
              locale={locale}
              readingTimeLabel={(minutes) => t("articles.readingTime", { minutes })}
            />
          </div>
        </Section>
      )}

      {testimonials.length > 0 && (
        <Section id="testimonials">
          <SectionHeading
            eyebrow={t("testimonials.eyebrow")}
            title={t("testimonials.title")}
            description={t("testimonials.description")}
            href="/testimonials"
            cta={t("testimonials.cta")}
          />
          <div className="mt-10">
            <TestimonialGrid items={testimonials} locale={locale} />
          </div>
        </Section>
      )}

      {openSource.length > 0 && (
        <Section id="open-source">
          <SectionHeading
            eyebrow={t("openSource.eyebrow")}
            title={t("openSource.title")}
            description={t("openSource.description")}
            href="/open-source"
            cta={t("openSource.cta")}
          />
          <div className="mt-10">
            <OpenSourceGrid items={openSource} locale={locale} />
          </div>
        </Section>
      )}

      <Section>
        {/* The page's closing surface, and the only lensed one besides the hero.
            Both are single, large and unrepeated — the two conditions under
            which refraction is worth what it costs. */}
        <GlassPanel variant="lens" tier="lg" padding="none" grain className="px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {tCta("title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm text-pretty sm:text-base">
            {tCta("description")}
          </p>
          <Button
            size="pill"
            variant="glassProminent"
            className="mt-7"
            render={<Link href="/mentoring" />}
          >
            {tCta("action")}
          </Button>
        </GlassPanel>
      </Section>
    </>
  );
}
