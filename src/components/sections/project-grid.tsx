import { ArrowUpRight, GitBranch, Images, Lock, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { internalLinks, publicLinks } from "@/lib/project";
import { pick } from "@/lib/utils";
import type { Project } from "@/types/content";

export function ProjectGrid({
  items,
  locale,
  limit,
}: {
  items: Project[];
  locale: Locale;
  limit?: number;
}) {
  const t = useTranslations("sections.projects");
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((project) => {
        const links = publicLinks(project.links);
        const hasRepo = links.some((link) => link.kind === "repo");
        const isPrivate =
          links.length === 0 && (internalLinks(project.links).length > 0 || project.links.length > 0);

        return (
          <GlassPanel
            key={project.id}
            variant="lens"
            tier="card"
            padding="none"
            className="group flex flex-col overflow-hidden"
          >
            {/* The cover is a child, so it paints *on top of* the glass rather
                than through it — the card reads as a photo above a frosted body,
                which is the shape Apple uses for media cards. */}
            {project.coverImage?.url && (
              <div className="border-hairline/60 relative aspect-16/9 border-b">
                <Image
                  src={cloudinarySrc(project.coverImage)}
                  alt={project.coverImage.alt?.[locale] ?? ""}
                  fill
                  // Three columns at lg, two at md, one below — telling the
                  // browser this avoids it downloading a full-width image for a
                  // card that renders at a third of the viewport.
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="lab-label text-signal">{`{ ${project.platforms.join(" · ")} }`}</p>
                <span className="lab-label text-muted-foreground tabular">{project.year}</span>
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
              <ArrowUpRight className="text-link ml-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </GlassPanel>
        );
      })}
    </div>
  );
}
