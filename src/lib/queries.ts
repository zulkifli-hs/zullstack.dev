import "server-only";

import { connectDB, isDatabaseConfigured } from "./db";
import {
  Article,
  Experience,
  MentoringTrack,
  OpenSource,
  Project,
  Resource,
  Snippet,
  SiteConfig,
  Testimonial,
} from "./models";
import type {
  Article as TArticle,
  Experience as TExperience,
  MentoringTrack as TMentoringTrack,
  OpenSourceProject as TOpenSource,
  Project as TProject,
  Resource as TResource,
  SiteConfig as TSiteConfig,
  Snippet as TSnippet,
  Testimonial as TTestimonial,
} from "@/types/content";

/**
 * Read layer. Server-only — `server-only` makes an accidental client import a
 * build error rather than a leaked connection string.
 *
 * These are deliberately plain async functions rather than `unstable_cache`
 * wrappers. Every public page is statically prerendered via
 * `generateStaticParams`, so these run at build time and a per-request cache
 * would buy nothing; `unstable_cache` is also documented as replaced in
 * Next 16. When Cache Components is enabled (Phase 3) each function takes a
 * `'use cache'` directive plus `cacheTag(...)` and nothing else changes —
 * which is why locale is always an argument here and never read from context.
 */

/**
 * Guarantees plain, serialisable objects across the Server Component boundary,
 * and normalises `_id` to a string `id`.
 *
 * The `_id` → `id` step has to happen here rather than in the schema's `toJSON`
 * transform: `.lean()` skips Mongoose document hydration entirely, so no schema
 * transform ever runs. Without this every `key={item.id}` is `undefined`, which
 * silently breaks React list reconciliation while the declared types still
 * claim `id: string`.
 */
function normalizeIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeIds);

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(source)) {
      if (key === "__v") continue;
      result[key === "_id" ? "id" : key] = normalizeIds(entry);
    }
    return result;
  }

  return value;
}

function serialize<T>(docs: unknown): T {
  // JSON round-trip first: it turns ObjectIds and Dates into strings, so what
  // reaches a Client Component is guaranteed serialisable.
  return normalizeIds(JSON.parse(JSON.stringify(docs))) as T;
}

const PUBLISHED = { status: "published" as const };

let warned = false;

/**
 * Lets a clone with no `.env.local` build and render empty states instead of
 * failing. Only covers the *unconfigured* case — a configured-but-unreachable
 * database still throws, so a broken production deploy stays loud.
 */
async function ready(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    if (!warned) {
      warned = true;
      console.warn("[queries] MONGODB_URI is not set — rendering empty content.");
    }
    return false;
  }
  await connectDB();
  return true;
}

export async function getSiteConfig(): Promise<TSiteConfig | null> {
  if (!(await ready())) return null;
  const doc = await SiteConfig.findOne({ key: "site" }).lean();
  return doc ? serialize<TSiteConfig>(doc) : null;
}

export async function getProjects({ limit }: { limit?: number } = {}): Promise<TProject[]> {
  if (!(await ready())) return [];
  const query = Project.find(PUBLISHED).sort({ featured: -1, order: 1, year: -1 });
  if (limit) query.limit(limit);
  return serialize<TProject[]>(await query.lean());
}

export async function getProjectBySlug(slug: string): Promise<TProject | null> {
  if (!(await ready())) return null;
  const doc = await Project.findOne({ slug, ...PUBLISHED }).lean();
  return doc ? serialize<TProject>(doc) : null;
}

export async function getProjectSlugs(): Promise<string[]> {
  if (!(await ready())) return [];
  const docs = await Project.find(PUBLISHED).select("slug").lean();
  return docs.map((d) => String(d.slug));
}

export async function getExperience(): Promise<TExperience[]> {
  if (!(await ready())) return [];
  // Most recent role first; an ongoing role has no endDate so startDate is the
  // only field that orders the timeline correctly.
  return serialize<TExperience[]>(await Experience.find(PUBLISHED).sort({ startDate: -1 }).lean());
}

export async function getMentoringTracks({ limit }: { limit?: number } = {}) {
  if (!(await ready())) return [];
  const query = MentoringTrack.find(PUBLISHED).sort({ order: 1 });
  if (limit) query.limit(limit);
  return serialize<TMentoringTrack[]>(await query.lean());
}

export async function getArticles({ limit }: { limit?: number } = {}): Promise<TArticle[]> {
  if (!(await ready())) return [];
  const query = Article.find(PUBLISHED).sort({ publishedAt: -1 });
  if (limit) query.limit(limit);
  return serialize<TArticle[]>(await query.lean());
}

export async function getArticleBySlug(slug: string): Promise<TArticle | null> {
  if (!(await ready())) return null;
  const doc = await Article.findOne({ slug, ...PUBLISHED }).lean();
  return doc ? serialize<TArticle>(doc) : null;
}

export async function getArticleSlugs(): Promise<string[]> {
  if (!(await ready())) return [];
  const docs = await Article.find(PUBLISHED).select("slug").lean();
  return docs.map((d) => String(d.slug));
}

export async function getTestimonials({ limit }: { limit?: number } = {}) {
  if (!(await ready())) return [];
  const query = Testimonial.find(PUBLISHED).sort({ featured: -1, order: 1 });
  if (limit) query.limit(limit);
  return serialize<TTestimonial[]>(await query.lean());
}

export async function getResources({ limit }: { limit?: number } = {}): Promise<TResource[]> {
  if (!(await ready())) return [];
  const query = Resource.find(PUBLISHED).sort({ order: 1 });
  if (limit) query.limit(limit);
  return serialize<TResource[]>(await query.lean());
}

export async function getOpenSource({ limit }: { limit?: number } = {}): Promise<TOpenSource[]> {
  if (!(await ready())) return [];
  const query = OpenSource.find(PUBLISHED).sort({ order: 1 });
  if (limit) query.limit(limit);
  return serialize<TOpenSource[]>(await query.lean());
}

export async function getSnippets({ limit }: { limit?: number } = {}): Promise<TSnippet[]> {
  if (!(await ready())) return [];
  const query = Snippet.find(PUBLISHED).sort({ order: 1 });
  if (limit) query.limit(limit);
  return serialize<TSnippet[]>(await query.lean());
}
