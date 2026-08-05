import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { Tag } from "@/components/lab/section";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/resolve-locale";
import { routing } from "@/i18n/routing";
import { getProjectBySlug, getProjectSlugs } from "@/lib/queries";
import { pick } from "@/lib/utils";

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
    openGraph: project.coverImage?.url ? { images: [project.coverImage.url] } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Params }) {
  const locale = await resolveLocale(params);
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [t, tCommon] = await Promise.all([
    getTranslations("sections.projects"),
    getTranslations("common"),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 pt-16 pb-8 sm:pt-20">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        {tCommon("backTo", { section: t("title") })}
      </Link>

      <p className="lab-label text-signal mt-8">{`{ ${project.category} }`}</p>

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
            alt={pick(project.title, locale)}
            fill
            // Above the fold on a detail page, so it should not lazy-load.
            priority
            quality={90}
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <dl className="border-hairline/60 text-muted-foreground mt-8 grid grid-cols-2 gap-4 border-y py-5 font-mono text-xs sm:grid-cols-3">
        <div>
          <dt className="lab-label">year</dt>
          <dd className="tabular mt-1">{project.year}</dd>
        </div>
        {pick(project.role, locale) && (
          <div>
            <dt className="lab-label">role</dt>
            <dd className="mt-1">{pick(project.role, locale)}</dd>
          </div>
        )}
        <div>
          <dt className="lab-label">stack</dt>
          <dd className="mt-1">{project.techStack.length}</dd>
        </div>
      </dl>

      <div className="mt-8 leading-relaxed text-pretty">{pick(project.description, locale)}</div>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {project.techStack.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>

      {(project.repoUrl || project.liveUrl) && (
        <div className="mt-10 flex flex-wrap gap-3">
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-brand-700 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <ExternalLink className="size-4" />
              {tCommon("liveDemo")}
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-hairline hover:bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
            >
              <GitBranch className="size-4" />
              {tCommon("sourceCode")}
            </a>
          )}
        </div>
      )}
    </main>
  );
}
