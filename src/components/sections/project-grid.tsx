import { ArrowUpRight, GitBranch, Images, Lock, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { ProjectCoverFallback } from "@/components/sections/project-cover-fallback";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { internalLinks, publicLinks } from "@/lib/project";
import { CATEGORY_ICONS } from "@/lib/project-category";
import { cn, pick } from "@/lib/utils";
import type { Project } from "@/types/content";

/** Three columns at lg, two below — including on a phone. */
const GRID_SIZES = "(min-width: 1024px) 33vw, 50vw";

/**
 * Mono metadata, one step down on a narrow card.
 *
 * `lab-label` fixes its own size, and this overrides it: arbitrary `text-*`
 * utilities sort after custom ones in the cascade, so the smaller value wins
 * without an `!important`. Two points of type is the difference between a
 * 173px card that reads as a small card and one that reads as a desktop card
 * that has been squeezed.
 */
const META_SIZE = "text-[0.625rem] @2xs:text-[0.6875rem]";

/**
 * One project, as a card.
 *
 * Extracted from the grid because the home page now scrolls these sideways
 * rather than stacking them into rows: the layout is the only thing that
 * differs between the two, and a second copy of the card is how a rail and a
 * grid start disagreeing about what a project looks like.
 *
 * `sizes` is a prop for the same reason — it describes the *rendered* width,
 * which is a third of the viewport in the grid and a fixed card width in the
 * rail. Leaving the grid's value hard-coded would have the rail downloading
 * images for a column it never renders.
 *
 * Everything that changes with size is a **container** query, not a media
 * query, because on one phone this card renders at two very different widths
 * at once: ~166px in the two-column grid on /projects, and ~307px in the home
 * rail. A `sm:` breakpoint cannot tell those apart — it would either cramp the
 * rail or overflow the grid. `@container` asks the only question that matters:
 * how wide is *this* card. The 18rem threshold falls between the two.
 */
export function ProjectCard({
  project,
  locale,
  className,
  sizes = GRID_SIZES,
  duplicate = false,
}: {
  project: Project;
  locale: Locale;
  className?: string;
  sizes?: string;
  /**
   * This card is a second copy of one already on the page — the rail's looping
   * lap. Takes it out of the tab order; the caller marks it `aria-hidden`.
   * Clicking still works, which is the whole reason it is not `inert`.
   */
  duplicate?: boolean;
}) {
  const t = useTranslations("sections.projects");

  const links = publicLinks(project.links);
  const hasRepo = links.some((link) => link.kind === "repo");
  const isPrivate =
    links.length === 0 && (internalLinks(project.links).length > 0 || project.links.length > 0);

  const CategoryIcon = CATEGORY_ICONS[project.category];

  return (
    <GlassPanel
      variant="lens"
      tier="card"
      padding="none"
      className={cn("group @container flex h-full flex-col overflow-hidden", className)}
    >
      {/* The cover is a child, so it paints *on top of* the glass rather
          than through it — the card reads as a photo above a frosted body,
          which is the shape Apple uses for media cards.

          Always rendered, even with no image: a grid where some cards open
          on media and others on a heading reads as broken rather than as
          varied, and most of this work has no public screenshot to show. */}
      <div className="border-hairline/60 relative aspect-16/9 shrink-0 border-b">
        {project.coverImage?.url ? (
          <Image
            src={cloudinarySrc(project.coverImage)}
            alt={project.coverImage.alt?.[locale] ?? ""}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <ProjectCoverFallback
            title={pick(project.title, locale)}
            seed={project.slug}
            className="absolute inset-0"
          />
        )}

        {/* Over the cover rather than in the body, for two reasons: the meta
            row above the title is already carrying platforms and the year, and
            the domain is the one fact a visitor scans a wall of cards for.

            An opaque scrim rather than another pane of glass. A cover can be
            any colour, so the chip needs a ground of its own — but a
            `backdrop-blur` here would be a nested backdrop-filter inside a
            lens, which is exactly what the no-glass-on-glass guard exists to
            stop, and it would slip past that guard by being a utility class
            rather than a `data-surface`. Thirteen of them on the listing page
            is thirteen compositor snapshots bought for one chip each. */}
        <span
          className={cn(
            "lab-label text-foreground bg-background/90 border-hairline/60 absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full border px-2 py-0.5 @2xs:top-3 @2xs:left-3 @2xs:max-w-[calc(100%-1.5rem)] @2xs:gap-1.5 @2xs:px-2.5 @2xs:py-1",
            META_SIZE,
          )}
        >
          <CategoryIcon aria-hidden className="text-signal size-3 shrink-0 @2xs:size-3.5" />
          <span className="truncate">{t(`category.${project.category}`)}</span>
        </span>
      </div>

      <div className="flex-1 p-4 @2xs:p-6">
        <div className="flex items-start justify-between gap-3">
          {/* Guarded: a project with no platforms rendered a bare `{  }`,
              which reads as a template that failed rather than as a
              project that has not been categorised.

              Dropped entirely on a narrow card: `{ web · cms · api · devops }`
              is wider than the card itself, and it is the least load-bearing
              line here — the category chip above already says what the project
              is, and the full list is one tap away on the detail page. */}
          {project.platforms.length > 0 && (
            <p className="lab-label text-signal hidden @2xs:block">{`{ ${project.platforms.join(" · ")} }`}</p>
          )}
          <span className={cn("lab-label text-muted-foreground tabular ml-auto", META_SIZE)}>
            {project.year}
          </span>
        </div>

        <h3 className="mt-2 flex items-start gap-1.5 text-sm leading-snug font-semibold tracking-tight @2xs:mt-3 @2xs:gap-2 @2xs:text-lg @2xs:leading-tight">
          <Link
            href={`/projects/${project.slug}`}
            tabIndex={duplicate ? -1 : undefined}
            className="after:absolute after:inset-0"
          >
            {pick(project.title, locale)}
          </Link>
          {project.featured && (
            <Star
              aria-label={t("favorite")}
              className="fill-signal text-signal mt-0.5 size-3 shrink-0 @2xs:mt-1 @2xs:size-3.5"
            />
          )}
        </h3>

        <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[0.6875rem] leading-relaxed text-pretty @2xs:mt-2 @2xs:line-clamp-3 @2xs:text-sm">
          {pick(project.summary, locale)}
        </p>

        {/* Anything other than a live project earns a word, so a shut-down
            service is never mistaken for a broken link. */}
        {project.lifecycle !== "live" && (
          <Badge tone="neutral" className={cn("mt-2.5 @2xs:mt-3", META_SIZE)}>
            {t(`lifecycle.${project.lifecycle}`)}
          </Badge>
        )}

        {/* Two chips on a narrow card, four when there is room. Rendered as one
            list with the extras hidden, and both "+N" counts present with one
            hidden, because a container query cannot be read in JS without
            measuring — and measuring would cost this card its server render. */}
        <div className="mt-3 flex flex-wrap gap-1.5 @2xs:mt-4">
          {project.techStack.slice(0, 4).map((tech, index) => (
            <Tag key={tech} className={cn(META_SIZE, index >= 2 && "hidden @2xs:inline-flex")}>
              {tech}
            </Tag>
          ))}
          {project.techStack.length > 2 && (
            <Tag className={cn(META_SIZE, "@2xs:hidden")}>{`+${project.techStack.length - 2}`}</Tag>
          )}
          {project.techStack.length > 4 && (
            <Tag className={cn(META_SIZE, "hidden @2xs:inline-flex")}>
              {`+${project.techStack.length - 4}`}
            </Tag>
          )}
        </div>
      </div>

      <div className="border-hairline/60 text-muted-foreground flex items-center gap-2 border-t px-4 py-2 text-[0.625rem] @2xs:gap-3 @2xs:px-6 @2xs:py-3 @2xs:text-xs">
        {hasRepo && (
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3 @2xs:size-3.5" /> repo
          </span>
        )}
        {project.gallery.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Images className="size-3 @2xs:size-3.5" /> {project.gallery.length}
          </span>
        )}
        {isPrivate && !hasRepo && (
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3 @2xs:size-3.5" /> private
          </span>
        )}
        <ArrowUpRight className="text-signal ml-auto size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 @2xs:size-4" />
      </div>
    </GlassPanel>
  );
}

export function ProjectGrid({
  items,
  locale,
  limit,
}: {
  items: Project[];
  locale: Locale;
  limit?: number;
}) {
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
      {shown.map((project) => (
        <ProjectCard key={project.id} project={project} locale={locale} />
      ))}
    </div>
  );
}
