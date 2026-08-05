import { getTranslations } from "next-intl/server";

import { EmptyState, Section, SectionHeading } from "@/components/lab/section";
import { About } from "@/components/sections/about";
import {
  ArticleList,
  MentoringGrid,
  OpenSourceGrid,
  ResourceGrid,
  TestimonialGrid,
} from "@/components/sections/content-grids";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { Hero } from "@/components/sections/hero";
import { ProjectGrid } from "@/components/sections/project-grid";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/resolve-locale";
import {
  getArticles,
  getExperience,
  getMentoringTracks,
  getOpenSource,
  getProjects,
  getResources,
  getSiteConfig,
  getTestimonials,
} from "@/lib/queries";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);

  // One round of parallel reads rather than eight sequential awaits — this page
  // touches every collection, so waterfalling would dominate build time.
  const [config, projects, experience, mentoring, articles, testimonials, resources, openSource] =
    await Promise.all([
      getSiteConfig(),
      getProjects({ limit: 3 }),
      getExperience(),
      getMentoringTracks({ limit: 3 }),
      getArticles({ limit: 3 }),
      getTestimonials({ limit: 3 }),
      getResources({ limit: 4 }),
      getOpenSource({ limit: 3 }),
    ]);

  const t = await getTranslations("sections");
  const tCta = await getTranslations("cta");

  return (
    <>
      <Hero config={config} locale={locale} />
      <About config={config} locale={locale} />

      <Section id="projects">
        <SectionHeading
          eyebrow={t("projects.eyebrow")}
          title={t("projects.title")}
          description={t("projects.description")}
          href="/projects"
          cta={t("projects.cta")}
        />
        <div className="mt-10">
          {projects.length ? (
            <ProjectGrid items={projects} locale={locale} />
          ) : (
            <EmptyState message={t("projects.empty")} />
          )}
        </div>
      </Section>

      <Section id="experience">
        <SectionHeading
          eyebrow={t("experience.eyebrow")}
          title={t("experience.title")}
          description={t("experience.description")}
          href="/experience"
          cta={t("experience.cta")}
        />
        <div className="mt-10">
          {experience.length ? (
            <ExperienceTimeline items={experience} locale={locale} limit={3} />
          ) : (
            <EmptyState message={t("experience.empty")} />
          )}
        </div>
      </Section>

      <Section id="mentoring">
        <SectionHeading
          eyebrow={t("mentoring.eyebrow")}
          title={t("mentoring.title")}
          description={t("mentoring.description")}
          href="/mentoring"
          cta={t("mentoring.cta")}
        />
        <div className="mt-10">
          {mentoring.length ? (
            <MentoringGrid items={mentoring} locale={locale} />
          ) : (
            <EmptyState message={t("mentoring.empty")} />
          )}
        </div>
      </Section>

      <Section id="articles">
        <SectionHeading
          eyebrow={t("articles.eyebrow")}
          title={t("articles.title")}
          description={t("articles.description")}
          href="/articles"
          cta={t("articles.cta")}
        />
        <div className="mt-10">
          {articles.length ? (
            <ArticleList
              items={articles}
              locale={locale}
              readingTimeLabel={(minutes) => t("articles.readingTime", { minutes })}
            />
          ) : (
            <EmptyState message={t("articles.empty")} />
          )}
        </div>
      </Section>

      <Section id="testimonials">
        <SectionHeading
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          description={t("testimonials.description")}
          href="/testimonials"
          cta={t("testimonials.cta")}
        />
        <div className="mt-10">
          {testimonials.length ? (
            <TestimonialGrid items={testimonials} locale={locale} />
          ) : (
            <EmptyState message={t("testimonials.empty")} />
          )}
        </div>
      </Section>

      <Section id="resources">
        <SectionHeading
          eyebrow={t("resources.eyebrow")}
          title={t("resources.title")}
          description={t("resources.description")}
          href="/resources"
          cta={t("resources.cta")}
        />
        <div className="mt-10">
          {resources.length ? (
            <ResourceGrid items={resources} locale={locale} />
          ) : (
            <EmptyState message={t("resources.empty")} />
          )}
        </div>
      </Section>

      <Section id="open-source">
        <SectionHeading
          eyebrow={t("openSource.eyebrow")}
          title={t("openSource.title")}
          description={t("openSource.description")}
          href="/open-source"
          cta={t("openSource.cta")}
        />
        <div className="mt-10">
          {openSource.length ? (
            <OpenSourceGrid items={openSource} locale={locale} />
          ) : (
            <EmptyState message={t("openSource.empty")} />
          )}
        </div>
      </Section>

      <Section>
        <div className="border-hairline/70 rounded-2xl border border-dashed px-8 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {tCta("title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm text-pretty sm:text-base">
            {tCta("description")}
          </p>
          <Link
            href="/mentoring"
            className="bg-primary text-primary-foreground hover:bg-brand-700 mt-7 inline-flex rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
          >
            {tCta("action")}
          </Link>
        </div>
      </Section>
    </>
  );
}
