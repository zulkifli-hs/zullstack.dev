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

/** Three columns at lg, two at md, one below. */
const GRID_SIZES = "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw";

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
 */
export function ProjectCard({
  project,
  locale,
  className,
  sizes = GRID_SIZES,
}: {
  project: Project;
  locale: Locale;
  className?: string;
  sizes?: string;
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
      className={cn("group flex h-full flex-col overflow-hidden", className)}
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
        <span className="lab-label text-foreground bg-background/90 border-hairline/60 absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
          <CategoryIcon aria-hidden className="text-signal size-3.5" />
          {t(`category.${project.category}`)}
        </span>
      </div>

      <div className="flex-1 p-6">
        <div className="flex items-start justify-between gap-3">
          {/* Guarded: a project with no platforms rendered a bare `{  }`,
              which reads as a template that failed rather than as a
              project that has not been categorised. */}
          {project.platforms.length > 0 && (
            <p className="lab-label text-signal">{`{ ${project.platforms.join(" · ")} }`}</p>
          )}
          <span className="lab-label text-muted-foreground tabular ml-auto">{project.year}</span>
        </div>

        <h3 className="mt-3 flex items-start gap-2 text-lg font-semibold tracking-tight">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {pick(project.title, locale)}
          </Link>
          {project.featured && (
            <Star
              aria-label={t("favorite")}
              className="fill-signal text-signal mt-1 size-3.5 shrink-0"
            />
          )}
        </h3>

        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm text-pretty">
          {pick(project.summary, locale)}
        </p>

        {/* Anything other than a live project earns a word, so a shut-down
            service is never mistaken for a broken link. */}
        {project.lifecycle !== "live" && (
          <Badge tone="neutral" className="mt-3">
            {t(`lifecycle.${project.lifecycle}`)}
          </Badge>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 4).map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
          {project.techStack.length > 4 && <Tag>{`+${project.techStack.length - 4}`}</Tag>}
        </div>
      </div>

      <div className="border-hairline/60 text-muted-foreground flex items-center gap-3 border-t px-6 py-3 text-xs">
        {hasRepo && (
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-3.5" /> repo
          </span>
        )}
        {project.gallery.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Images className="size-3.5" /> {project.gallery.length}
          </span>
        )}
        {isPrivate && !hasRepo && (
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3.5" /> private
          </span>
        )}
        <ArrowUpRight className="text-signal ml-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((project) => (
        <ProjectCard key={project.id} project={project} locale={locale} />
      ))}
    </div>
  );
}
