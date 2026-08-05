import { ArrowUpRight, GitBranch } from "lucide-react";
import Image from "next/image";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
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
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((project) => (
        // `flat` not `glass`: a grid of backdrop-filtered cards is exactly the
        // pattern that tanks frame rate on mid-range devices.
        <GlassPanel
          key={project.id}
          variant="flat" tier="md"
          padding="none"
          className="group flex flex-col overflow-hidden"
        >
          {project.coverImage?.url && (
            <div className="border-hairline/60 relative aspect-16/9 border-b">
              <Image
                src={project.coverImage.url}
                alt=""
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
              <p className="lab-label text-signal">{`{ ${project.category} }`}</p>
              <span className="lab-label text-muted-foreground tabular">{project.year}</span>
            </div>

            <h3 className="mt-3 text-lg font-semibold tracking-tight">
              <Link
                href={`/projects/${project.slug}`}
                className="after:absolute after:inset-0"
              >
                {pick(project.title, locale)}
              </Link>
            </h3>

            <p className="text-muted-foreground mt-2 line-clamp-3 text-sm text-pretty">
              {pick(project.summary, locale)}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.techStack.slice(0, 4).map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
              {project.techStack.length > 4 && <Tag>{`+${project.techStack.length - 4}`}</Tag>}
            </div>
          </div>

          <div className="border-hairline/60 text-muted-foreground flex items-center gap-3 border-t px-6 py-3 text-xs">
            {project.repoUrl && (
              <span className="inline-flex items-center gap-1">
                <GitBranch className="size-3.5" /> repo
              </span>
            )}
            <ArrowUpRight className="text-link ml-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
