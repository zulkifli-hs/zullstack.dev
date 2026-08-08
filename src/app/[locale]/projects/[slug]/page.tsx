import { ArrowLeft, ExternalLink, GitBranch, Lock, Mail } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { PartnerRow } from "@/components/sections/partner-row";
import { ProjectGallery } from "@/components/sections/project-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/resolve-locale";
import { routing } from "@/i18n/routing";
import {
  demoRequestHref,
  formatRange,
  internalLinks,
  monthsBetween,
  partnersByRole,
  publicLinks,
  requestableLinks,
} from "@/lib/project";
import { getProjectBySlug, getProjectSlugs, getSiteConfig } from "@/lib/queries";
import { localeAlternates } from "@/lib/site";
import { pick, pickList } from "@/lib/utils";
import type { LinkKind } from "@/types/content";

type Params = Promise<{ locale: string; slug: string }>;

/**
 * Prerenders every published project in both locales. Without this the route
 * falls back to on-demand rendering, which would hit the database per request.
 */
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const validLocale = routing.locales.includes(locale as never) ? locale : routing.defaultLocale;
  return {
    title: pick(project.title, validLocale as never),
    description: pick(project.summary, validLocale as never),
    // The sitemap already emits hreflang for these URLs; without the same
    // declaration on the page, the two locales of one project read as duplicate
    // content to a crawler that arrives directly.
    alternates: {
      canonical: `/${validLocale}/projects/${slug}`,
      languages: localeAlternates(`/projects/${slug}`),
    },
    openGraph: project.coverImage?.url ? { images: [project.coverImage.url] } : undefined,
  };
}

const LINK_ICONS: Partial<Record<LinkKind, typeof ExternalLink>> = {
  repo: GitBranch,
};

export default async function ProjectPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;

  const [project, config] = await Promise.all([getProjectBySlug(slug), getSiteConfig()]);
  if (!project) notFound();

  const [t, tCommon] = await Promise.all([
    getTranslations("sections.projects"),
    getTranslations("common"),
  ]);

  const { collaboration, client } = partnersByRole(project.partners);
  const links = publicLinks(project.links);
  const requestable = requestableLinks(project.links);
  const internal = internalLinks(project.links);

  const responsibilities = pickList(project.responsibilities, locale);
  const outcomes = pickList(project.outcomes, locale);

  const range = formatRange(project.startDate, project.endDate, locale, t("present"));
  const months = monthsBetween(project.startDate, project.endDate);

  const requestHref = demoRequestHref(config, pick(project.title, locale), t("requestDemo"));

  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-20">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {tCommon("backTo", { section: t("title") })}
      </Link>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <p className="lab-label text-signal">{`{ ${project.platforms.join(" · ")} }`}</p>
        {project.lifecycle !== "live" && (
          <Badge tone="neutral">{t(`lifecycle.${project.lifecycle}`)}</Badge>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {pick(project.title, locale)}
      </h1>

      <p className="text-muted-foreground mt-4 text-base text-pretty">
        {pick(project.summary, locale)}
      </p>

      {project.coverImage?.url && (
        <div className="border-hairline/60 relative mt-8 aspect-16/9 overflow-hidden rounded-xl border">
          <Image
            src={project.coverImage.url}
            alt={project.coverImage.alt?.[locale] || pick(project.title, locale)}
            fill
            // Above the fold on a detail page, so it should not lazy-load.
            priority
            quality={90}
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <GlassPanel
        as="dl"
        variant="lens"
        tier="card"
        padding="sm"
        className="text-muted-foreground mt-8 grid grid-cols-2 gap-4 font-mono text-xs sm:grid-cols-3"
      >
        <div>
          <dt className="lab-label">{range ? t("duration") : "year"}</dt>
          <dd className="tabular mt-1">{range ?? project.year}</dd>
        </div>
        {months && (
          <div>
            <dt className="lab-label">months</dt>
            <dd className="tabular mt-1">{t("months", { count: months })}</dd>
          </div>
        )}
        {pick(project.role, locale) && (
          <div>
            <dt className="lab-label">role</dt>
            <dd className="mt-1">{pick(project.role, locale)}</dd>
          </div>
        )}
        {project.teamSize ? (
          <div>
            <dt className="lab-label">{t("team")}</dt>
            <dd className="mt-1">{t("teamSize", { count: project.teamSize })}</dd>
          </div>
        ) : null}
        <div>
          <dt className="lab-label">stack</dt>
          <dd className="tabular mt-1">{project.techStack.length}</dd>
        </div>
      </GlassPanel>

      {(collaboration.length > 0 || client.length > 0) && (
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:gap-12">
          <PartnerRow label={t("collaboration")} entries={collaboration} locale={locale} />
          <PartnerRow label={t("client")} entries={client} locale={locale} />
        </div>
      )}

      {pick(project.problem, locale) && (
        <section className="mt-10">
          <h2 className="lab-label text-muted-foreground">{t("problem")}</h2>
          <p className="mt-3 leading-relaxed text-pretty">{pick(project.problem, locale)}</p>
        </section>
      )}

      <div className="mt-8 leading-relaxed text-pretty">{pick(project.description, locale)}</div>

      {responsibilities.length > 0 && (
        <section className="mt-10">
          <h2 className="lab-label text-muted-foreground">{t("responsibilities")}</h2>
          <ul className="marker:text-signal mt-3 list-disc space-y-2 pl-5 leading-relaxed">
            {responsibilities.map((entry) => (
              <li key={entry} className="text-pretty">
                {entry}
              </li>
            ))}
          </ul>
        </section>
      )}

      {outcomes.length > 0 && (
        <section className="mt-10">
          <h2 className="lab-label text-muted-foreground">{t("outcomes")}</h2>
          <ul className="marker:text-signal mt-3 list-disc space-y-2 pl-5 leading-relaxed">
            {outcomes.map((entry) => (
              <li key={entry} className="text-pretty">
                {entry}
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="lab-label text-muted-foreground">{t("gallery")}</h2>
          <p className="text-muted-foreground mt-1 text-xs">{t("galleryHint")}</p>
          <div className="mt-4">
            <ProjectGallery
              images={project.gallery}
              locale={locale}
              title={pick(project.title, locale)}
            />
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-1.5">
        {project.techStack.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>

      {(links.length > 0 || requestable.length > 0 || internal.length > 0) && (
        <section className="mt-10">
          <h2 className="lab-label text-muted-foreground">{t("links")}</h2>

          <div className="mt-4 flex flex-wrap gap-3">
            {links.map((link, index) => {
              const Icon = LINK_ICONS[link.kind] ?? ExternalLink;
              return (
                <Button
                  key={`${link.kind}-${index}`}
                  size="pill"
                  // The first public link is the primary action; the rest are
                  // supporting, so only one prominent surface competes.
                  variant={index === 0 ? "glassProminent" : "glass"}
                  render={<a href={link.url} target="_blank" rel="noopener noreferrer" />}
                >
                  <Icon className="size-4" />
                  {pick(link.label, locale) || t(`linkKinds.${link.kind}`)}
                </Button>
              );
            })}

            {/* Requestable links never carry a URL past the query layer, so this
                asks rather than links. */}
            {requestable.length > 0 &&
              (requestHref ? (
                <Button size="pill" variant="glass" render={<a href={requestHref} />}>
                  <Mail className="size-4" />
                  {t("requestDemo")}
                </Button>
              ) : (
                <Badge tone="neutral">{t("requestDemo")}</Badge>
              ))}
          </div>

          {requestable.length > 0 && (
            <p className="text-muted-foreground mt-3 text-xs">{t("requestDemoHint")}</p>
          )}

          {internal.length > 0 && (
            <p className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
              <Lock className="size-3.5" />
              {t("internalAccess")}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
