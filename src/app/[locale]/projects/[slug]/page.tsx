import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  GitBranch,
  Images,
  Lock,
  Mail,
  Star,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { PartnerRow } from "@/components/sections/partner-row";
import { ProjectGallery } from "@/components/sections/project-gallery";
import { ProjectGrid } from "@/components/sections/project-grid";
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
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { getOtherProjects, getProjectBySlug, getProjectSlugs, getSiteConfig } from "@/lib/queries";
import { localeAlternates } from "@/lib/site";
import { cn, pick, pickList } from "@/lib/utils";
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

/**
 * The body's two columns: the story on the left, the project sheet on the right.
 *
 * Written out in full rather than composed at runtime — Tailwind matches
 * complete class names in source text, so an interpolated one compiles to
 * nothing at all.
 */
const COLUMNS = "lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12";

export default async function ProjectPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;

  const [project, config, others] = await Promise.all([
    getProjectBySlug(slug),
    getSiteConfig(),
    getOtherProjects(slug),
  ]);
  if (!project) notFound();

  const [t, tCommon, tGallery] = await Promise.all([
    getTranslations("sections.projects"),
    getTranslations("common"),
    getTranslations("gallery"),
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

  const hasCover = Boolean(project.coverImage?.url);
  const hasLinks = links.length > 0 || requestable.length > 0 || internal.length > 0;
  const hasPartners = collaboration.length > 0 || client.length > 0;

  // Summed rather than stored: a total that can be edited independently of the
  // groups is a total that will eventually disagree with them.
  //
  // One person can hold two roles, and they are counted inside both groups —
  // so the groups add up to more heads than there were. The only overlap the
  // data actually knows about is mine, so mine is the one that is corrected:
  // ticking Me on frontend *and* backend adds one person to the team, not two.
  const team = project.team.filter((member) => member.role && member.count > 0);
  const teamSelf = team.filter((member) => member.self).length;
  const teamTotal =
    team.reduce((total, member) => total + member.count, 0) - Math.max(0, teamSelf - 1);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-20">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {tCommon("backTo", { section: t("title") })}
      </Link>

      {/* Title band, full width. Everything that identifies the project reads
          across the page; everything that describes it happens below, in two
          columns. */}
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          {/* Guarded: an uncategorised project rendered a bare `{  }`. */}
          {project.platforms.length > 0 && (
            <p className="lab-label text-signal">{`{ ${project.platforms.join(" · ")} }`}</p>
          )}
          {project.lifecycle !== "live" && (
            <Badge tone="neutral">{t(`lifecycle.${project.lifecycle}`)}</Badge>
          )}
          {project.featured && (
            <Badge tone="signal" className="inline-flex items-center gap-1">
              <Star className="size-3 fill-current" />
              {t("favorite")}
            </Badge>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {pick(project.title, locale)}
        </h1>
      </div>

      {/* Cover, sheet and narrative in one grid.
          Explicit placement rather than source order: the cover takes the left
          column's full width above the story, the sheet spans both rows on the
          right, and on a phone — where the grid does not apply — they fall in
          DOM order, which is cover, sheet, story. */}
      <div className={cn("mt-8", COLUMNS)}>
        {project.coverImage?.url && (
          <div className="border-hairline/60 relative aspect-16/9 overflow-hidden rounded-xl border lg:col-start-1 lg:row-start-1">
            <Image
              src={cloudinarySrc(project.coverImage)}
              alt={project.coverImage.alt?.[locale] || pick(project.title, locale)}
              fill
              // Above the fold on a detail page, so it should not lazy-load.
              priority
              quality={90}
              sizes="(min-width: 1024px) 672px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <aside
          className={cn(
            "mt-8 lg:col-start-2 lg:row-start-1 lg:mt-0",
            // Only spans a second row when there is a second row to span;
            // otherwise the grid invents an empty one and leaves a gap.
            hasCover && "lg:row-span-2",
          )}
        >
          {/* Sticky against the story's full height, so the sheet stays in view
              through a long case study and simply sits still on a short one. */}
          <div className="lg:sticky lg:top-24">
            <GlassPanel variant="lens" tier="card" padding="md" className="space-y-5">
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {pick(project.summary, locale)}
              </p>

              {/* The story can run long, and the pictures are at the very bottom
                  of it. A plain hash link rather than a scripted scroll: it
                  works before hydration and it can be opened in a new tab. */}
              {project.gallery.length > 0 && (
                <Button
                  size="pill"
                  variant="glass"
                  className="w-full justify-between"
                  render={<a href="#gallery" />}
                >
                  <span className="inline-flex items-center gap-2">
                    <Images className="size-4" />
                    {t("jumpToGallery")}
                  </span>
                  <span className="tabular font-mono text-xs">{project.gallery.length}</span>
                </Button>
              )}

              <dl className="border-hairline/60 text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-5 font-mono text-xs">
                <Fact label="year" value={String(project.year)} tabular />
                {range && <Fact label={t("duration")} value={range} tabular />}
                {months && <Fact label="months" value={t("months", { count: months })} tabular />}
                {pick(project.role, locale) && (
                  <Fact label="role" value={pick(project.role, locale)} wide />
                )}

                {/* A bare headcount could not say whether it meant the whole
                    engagement or only the engineers on this build, so the groups
                    are listed and the total is their sum. */}
                {team.length > 0 ? (
                  <div className="col-span-2">
                    <dt className="lab-label">{t("team")}</dt>
                    <dd className="mt-1.5">
                      <span className="text-foreground tabular">
                        {t("teamSize", { count: teamTotal })}
                      </span>
                      <ul className="mt-1.5 space-y-1">
                        {team.map((member, index) => (
                          <li key={`${member.role}-${index}`} className="flex items-baseline gap-2">
                            <span className="text-foreground tabular w-4 shrink-0 text-right">
                              {member.count}
                            </span>
                            <span className="min-w-0">{member.role}</span>
                            {member.self && (
                              <span className="text-signal lab-label shrink-0">
                                {t("teamMe")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : (
                  // Documents written before `team` existed only have a number.
                  project.teamSize ? (
                    <Fact label={t("team")} value={t("teamSize", { count: project.teamSize })} />
                  ) : null
                )}
              </dl>

              {project.techStack.length > 0 && (
                <div className="border-hairline/60 border-t pt-5">
                  <p className="lab-label text-muted-foreground">{t("stack")}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                </div>
              )}

              {hasPartners && (
                <div className="border-hairline/60 space-y-4 border-t pt-5">
                  <PartnerRow
                    label={t("collaboration")}
                    entries={collaboration}
                    locale={locale}
                    size="compact"
                  />
                  <PartnerRow
                    label={t("client")}
                    entries={client}
                    locale={locale}
                    size="compact"
                  />
                </div>
              )}

              {hasLinks && (
                <div className="border-hairline/60 border-t pt-5">
                  <p className="lab-label text-muted-foreground">{t("links")}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {links.map((link, index) => {
                      const Icon = LINK_ICONS[link.kind] ?? ExternalLink;
                      return (
                        <Button
                          key={`${link.kind}-${index}`}
                          size="pill"
                          // The first public link is the primary action; the
                          // rest support it, so only one surface competes.
                          variant={index === 0 ? "glassProminent" : "glass"}
                          render={<a href={link.url} target="_blank" rel="noopener noreferrer" />}
                        >
                          <Icon className="size-4" />
                          {pick(link.label, locale) || t(`linkKinds.${link.kind}`)}
                        </Button>
                      );
                    })}

                    {/* Requestable links never carry a URL past the query layer,
                        so this asks rather than links. */}
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
                </div>
              )}
            </GlassPanel>
          </div>
        </aside>

        <div
          className={cn(
            "mt-10 lg:col-start-1",
            hasCover ? "lg:row-start-2 lg:mt-8" : "lg:row-start-1 lg:mt-0",
          )}
        >
          {pick(project.problem, locale) && (
            <section className="max-w-[68ch]">
              <h2 className="lab-label text-muted-foreground">{t("problem")}</h2>
              <p className="mt-3 leading-relaxed text-pretty">{pick(project.problem, locale)}</p>
            </section>
          )}

          <div className="mt-8 max-w-[68ch] leading-relaxed text-pretty">
            {pick(project.description, locale)}
          </div>

          {responsibilities.length > 0 && (
            <section className="mt-10 max-w-[68ch]">
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
            <section className="mt-10 max-w-[68ch]">
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
        </div>
      </div>

      {/* Last on the page, deliberately. A case study can carry twenty
          screenshots, and anything rendered after them is effectively unread —
          so every fact about the project appears above this point.

          No heading: the images are not all captures of private screens, and
          grouped galleries print their own section headings anyway. */}
      {project.gallery.length > 0 && (
        // `scroll-mt` clears the sticky header, which would otherwise land on
        // top of the first row of images when the jump link fires.
        <section id="gallery" className="border-hairline/60 mt-12 scroll-mt-24 border-t pt-10">
          <ProjectGallery
            images={project.gallery}
            locale={locale}
            title={pick(project.title, locale)}
            display={project.galleryDisplay}
            groups={project.galleryGroups}
            labels={{ long: tGallery("long"), ungrouped: tGallery("other") }}
          />
        </section>
      )}

      {/* Somewhere to go next. Cards rather than a prev/next pair: at the end of
          a case study the question is "which one should I look at", and a title
          with a cover answers that where an arrow does not. */}
      {others.length > 0 && (
        <section className="border-hairline/60 mt-16 border-t pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">{t("other")}</h2>
            <Link
              href="/projects"
              className="text-link group inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t("cta")}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="mt-6">
            <ProjectGrid items={others} locale={locale} />
          </div>
        </section>
      )}
    </main>
  );
}

/**
 * One labelled value in the project sheet.
 *
 * A `div` wrapping `dt`/`dd` is valid inside a `dl`, and is what keeps a pair
 * together as one grid cell instead of letting the label and the value land in
 * different columns.
 */
function Fact({
  label,
  value,
  tabular,
  wide,
}: {
  label: string;
  value: string;
  tabular?: boolean;
  /** Spans both columns, for values too long to sit in half a card. */
  wide?: boolean;
}) {
  return (
    <div className={cn(wide && "col-span-2")}>
      <dt className="lab-label">{label}</dt>
      <dd className={cn("text-foreground mt-1.5", tabular && "tabular")}>{value}</dd>
    </div>
  );
}
