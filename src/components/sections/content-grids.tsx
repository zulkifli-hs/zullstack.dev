import { ArrowUpRight, ExternalLink, GitBranch, Quote, Star } from "lucide-react";
import Image from "next/image";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatDate, pick, pickList } from "@/lib/utils";
import type {
  Article,
  MentoringTrack,
  OpenSourceProject,
  Resource,
  Snippet,
  Testimonial,
} from "@/types/content";

/**
 * Listing components for the remaining content types.
 *
 * They all follow the same contract — `{ items, locale, limit }` — so the same
 * component renders both the home-page preview and the full listing page, and
 * the two can never drift apart visually.
 *
 * Every card here is real glass — `variant="glass"`, one backdrop-filter each.
 * That is a deliberate reversal of the earlier "flat content layer" rule, and it
 * is worth being honest about what it costs: a listing page renders 6–9 live
 * blur surfaces instead of one, and each is a separate backdrop snapshot for the
 * compositor.
 *
 * Three things make it affordable:
 *   - the substrate is `LabBackground` — a fixed mesh gradient and a grid, the
 *     cheapest possible thing to re-sample, and static while the page scrolls;
 *   - cards keep `contain: paint`, so a card that scrolls out stops costing;
 *   - no card is lensed. Refraction is per-pixel SVG work and stays on the one
 *     or two hero surfaces per page.
 *
 * The blur itself never animates on hover — see the `lift` utility.
 */

function take<T>(items: T[], limit?: number) {
  return limit ? items.slice(0, limit) : items;
}

export function MentoringGrid({
  items,
  locale,
  limit,
}: {
  items: MentoringTrack[];
  locale: Locale;
  limit?: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {take(items, limit).map((track) => (
        <GlassPanel key={track.id} variant="glass" tier="card">
          <p className="lab-label text-signal">{track.level}</p>
          <h3 className="mt-3 text-lg font-semibold tracking-tight">{pick(track.track, locale)}</h3>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {pick(track.description, locale)}
          </p>

          <dl className="text-muted-foreground mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
            <div>
              <dt className="sr-only">Format</dt>
              <dd>{track.format}</dd>
            </div>
            <div>
              <dt className="sr-only">Duration</dt>
              <dd>{pick(track.duration, locale)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {pickList(track.topics, locale)
              .slice(0, 5)
              .map((topic) => (
                <Tag key={topic}>{topic}</Tag>
              ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function ArticleList({
  items,
  locale,
  limit,
  readingTimeLabel,
}: {
  items: Article[];
  locale: Locale;
  limit?: number;
  readingTimeLabel: (minutes: number) => string;
}) {
  return (
    // Rows, not a grid — an article is a headline plus a paragraph, and three
    // columns of that reads as a wall. Each row is its own glass surface, so the
    // separators that used to divide them are now the gaps between panels.
    <div className="space-y-4">
      {take(items, limit).map((article) => (
        <GlassPanel
          key={article.id}
          as="article"
          variant="glass"
          tier="card"
          padding="sm"
          className="group flex gap-5"
        >
          {article.coverImage?.url && (
            <div className="rounded-concentric border-hairline/60 relative hidden aspect-4/3 w-32 shrink-0 overflow-hidden border sm:block">
              <Image
                src={article.coverImage.url}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs">
              <time dateTime={article.publishedAt ?? undefined}>
                {formatDate(article.publishedAt, locale, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
              <span aria-hidden>·</span>
              <span>{readingTimeLabel(article.readingTime)}</span>
            </div>

            <h3 className="mt-2 text-lg font-semibold tracking-tight">
              <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
                {pick(article.title, locale)}
              </Link>
            </h3>

            <p className="text-muted-foreground mt-2 max-w-2xl text-sm text-pretty">
              {pick(article.excerpt, locale)}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {article.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              <ArrowUpRight className="text-link ml-auto size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function TestimonialGrid({
  items,
  locale,
  limit,
}: {
  items: Testimonial[];
  locale: Locale;
  limit?: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {take(items, limit).map((testimonial) => (
        <GlassPanel key={testimonial.id} variant="glass" tier="card" className="flex flex-col">
          <Quote aria-hidden className="text-signal size-5" />
          <blockquote className="mt-3 flex-1 text-sm text-pretty">
            {pick(testimonial.quote, locale)}
          </blockquote>

          <div className="border-hairline/60 mt-5 flex items-center gap-3 border-t pt-4">
            {testimonial.avatar?.url && (
              <Image
                src={testimonial.avatar.url}
                alt=""
                width={36}
                height={36}
                className="border-hairline size-9 shrink-0 rounded-full border object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{testimonial.name}</p>
              <p className="text-muted-foreground truncate font-mono text-xs">
                {pick(testimonial.role, locale)}
                {testimonial.company && ` · ${testimonial.company}`}
              </p>
            </div>
            <div
              className="ml-auto flex shrink-0 gap-0.5"
              aria-label={`${testimonial.rating} / 5`}
            >
              {Array.from({ length: testimonial.rating }, (_, i) => (
                <Star key={i} aria-hidden className="fill-signal text-signal size-3" />
              ))}
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function ResourceGrid({
  items,
  locale,
  limit,
}: {
  items: Resource[];
  locale: Locale;
  limit?: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {take(items, limit).map((resource) => (
        <GlassPanel key={resource.id} variant="glass" tier="card" className="group relative">
          <div className="flex items-center gap-2">
            <p className="lab-label text-signal">{resource.type}</p>
            <span className="text-muted-foreground font-mono text-[0.6875rem]">
              {resource.level}
            </span>
            {resource.free && (
              <span className="lab-label text-muted-foreground ml-auto">free</span>
            )}
          </div>

          <h3 className="mt-3 text-base font-semibold tracking-tight">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0"
            >
              {pick(resource.title, locale)}
            </a>
          </h3>
          <p className="text-muted-foreground mt-2 text-sm text-pretty">
            {pick(resource.description, locale)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {resource.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            <ExternalLink className="text-link ml-auto size-4" />
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function OpenSourceGrid({
  items,
  locale,
  limit,
}: {
  items: OpenSourceProject[];
  locale: Locale;
  limit?: number;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {take(items, limit).map((repo) => (
        <GlassPanel key={repo.id} variant="glass" tier="card" className="group relative">
          <div className="flex items-center gap-2">
            <GitBranch aria-hidden className="size-4" />
            <p className="truncate font-mono text-sm font-semibold">
              <a
                href={repo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="after:absolute after:inset-0"
              >
                {repo.name}
              </a>
            </p>
          </div>

          <p className="text-muted-foreground mt-3 text-sm text-pretty">
            {pick(repo.description, locale)}
          </p>

          <div className="text-muted-foreground mt-4 flex items-center gap-3 font-mono text-xs">
            <span className="lab-label text-signal">{repo.role}</span>
            {repo.language && <span>{repo.language}</span>}
            {repo.stars > 0 && (
              <span className="tabular ml-auto inline-flex items-center gap-1">
                <Star aria-hidden className="size-3" />
                {repo.stars}
              </span>
            )}
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}

export function SnippetShowcase({
  items,
  locale,
  limit,
}: {
  items: Snippet[];
  locale: Locale;
  limit?: number;
}) {
  return (
    <div className="space-y-6">
      {take(items, limit).map((snippet) => (
        <GlassPanel key={snippet.id} variant="glass" tier="card" padding="none" className="overflow-hidden">
          <div className="border-hairline/60 flex items-center gap-3 border-b px-5 py-3">
            <span aria-hidden className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="bg-signal/70 size-2.5 rounded-full" />
            </span>
            <p className="font-mono text-sm font-medium">{pick(snippet.title, locale)}</p>
            <span className="lab-label text-muted-foreground ml-auto">{snippet.language}</span>
          </div>

          <div className="px-5 py-4">
            <p className="text-muted-foreground text-sm text-pretty">
              {pick(snippet.description, locale)}
            </p>
          </div>

          {snippet.embedProvider !== "none" && snippet.embedUrl ? (
            <iframe
              src={snippet.embedUrl}
              title={pick(snippet.title, locale)}
              loading="lazy"
              // Sandboxed: third-party embeds get scripts and same-origin for
              // their own frame but nothing that lets them reach this page.
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="h-[420px] w-full border-0"
              style={{ contentVisibility: "auto" }}
            />
          ) : (
            <pre className="border-hairline/60 overflow-x-auto border-t px-5 py-4 font-mono text-xs leading-relaxed">
              <code>{snippet.code}</code>
            </pre>
          )}
        </GlassPanel>
      ))}
    </div>
  );
}
