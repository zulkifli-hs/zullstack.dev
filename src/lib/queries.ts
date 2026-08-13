import "server-only";

import {
  DEFAULT_GALLERY_COLS,
  DEFAULT_GALLERY_ROWS,
  PUBLIC_PARTNER_KINDS,
  SPAN_TO_COLS,
  type GallerySpan,
} from "./content-enums";
import { connectDB, isDatabaseConfigured } from "./db";
import { stripPrivateLinkUrls } from "./project";
import {
  Article,
  Experience,
  MentoringTrack,
  OpenSource,
  Partner,
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
  Partner as TPartner,
  Project as TProject,
  ProjectDetail as TProjectDetail,
  ProjectLink,
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

const localizedOrEmpty = (value: unknown) => {
  const record = (value ?? {}) as Record<string, unknown>;
  return { en: String(record.en ?? ""), id: String(record.id ?? "") };
};

const listOrEmpty = (value: unknown) => {
  const record = (value ?? {}) as Record<string, unknown>;
  return {
    en: Array.isArray(record.en) ? record.en.map(String) : [],
    id: Array.isArray(record.id) ? record.id.map(String) : [],
  };
};

/**
 * A gallery image the public is allowed to see.
 *
 * The CMS reads its documents straight from the model rather than through this
 * module, so the editor still gets the whole list — hiding is a publishing
 * decision, not a deletion.
 */
const visible = (image: Record<string, unknown>) => image.hidden !== true;

/**
 * Brings one project document up to the current shape, and strips private URLs.
 *
 * Two jobs, deliberately in one place — every read goes through here, so
 * neither can be forgotten at a call site.
 *
 * **Defaults.** Mongoose applies schema defaults when a document is created or
 * saved, never when an existing one is read with `.lean()`. Documents written
 * before these fields existed therefore come back without them, and a page that
 * does `project.platforms.join(...)` crashes the prerender rather than
 * rendering an empty list. The migration script backfills the important ones,
 * but a read layer that only works on migrated data is a trap for the next
 * schema change.
 *
 * **Private links.** `stripPrivateLinkUrls` removes the address of anything not
 * publicly reachable. Doing it here means no read path can skip it.
 */
function normalizeProject(doc: Record<string, unknown>): Record<string, unknown> {
  const links = Array.isArray(doc.links) ? (doc.links as ProjectLink[]) : [];
  const gallery = Array.isArray(doc.gallery) ? (doc.gallery as Record<string, unknown>[]) : [];

  return {
    ...doc,
    platforms: Array.isArray(doc.platforms) ? doc.platforms : [],
    techStack: Array.isArray(doc.techStack) ? doc.techStack : [],
    // Images stored before the layout fields existed have no placement at all,
    // and the grid indexes straight into its span-class maps with them. `span`
    // is the pre-bento single-axis width, kept readable so those documents do
    // not silently lose the layout they were given.
    // Hidden images are dropped here rather than skipped by the component that
    // draws them: filtering at render would still have shipped their URLs in
    // the payload, and "not shown" is not what was asked for — a shot that is
    // not ready to be public should not be reachable from the page at all.
    gallery: gallery.filter(visible).map((image) => ({
      ...image,
      crop: image.crop ?? null,
      ratio: image.ratio ?? "original",
      cols: image.cols ?? SPAN_TO_COLS[image.span as GallerySpan] ?? DEFAULT_GALLERY_COLS,
      rows: image.rows ?? DEFAULT_GALLERY_ROWS,
      fit: image.fit ?? "cover",
      group: image.group ?? "",
    })),
    galleryDisplay: doc.galleryDisplay ?? "flat",
    galleryGroups: Array.isArray(doc.galleryGroups) ? doc.galleryGroups : [],
    partners: Array.isArray(doc.partners) ? doc.partners : [],
    lifecycle: doc.lifecycle ?? "live",
    problem: localizedOrEmpty(doc.problem),
    role: localizedOrEmpty(doc.role),
    responsibilities: listOrEmpty(doc.responsibilities),
    outcomes: listOrEmpty(doc.outcomes),
    startDate: doc.startDate ?? null,
    endDate: doc.endDate ?? null,
    team: Array.isArray(doc.team) ? doc.team : [],
    teamSize: doc.teamSize ?? null,
    links: stripPrivateLinkUrls(links),
  };
}

/**
 * The one order projects appear in, everywhere.
 *
 * Shared rather than repeated because "the next project" on a detail page has
 * to mean the same thing as the next card on `/projects` — two sort literals
 * that drift apart would be invisible until someone noticed the sequence
 * disagreeing with itself.
 */
const PROJECT_SORT = { featured: -1, order: 1, year: -1 } as const;

export async function getProjects({ limit }: { limit?: number } = {}): Promise<TProject[]> {
  if (!(await ready())) return [];
  const query = Project.find(PUBLISHED).sort(PROJECT_SORT);
  if (limit) query.limit(limit);
  const docs = (await query.lean()) as Record<string, unknown>[];
  return serialize<TProject[]>(docs.map(normalizeProject));
}

/**
 * Other projects to offer at the end of a case study.
 *
 * Picked by walking forward from the current project and wrapping around, so
 * the last project in the order still gets a full set and no two pages show the
 * same three cards. Selecting the first N instead would make every page a
 * billboard for whichever project happens to sort first.
 */
export async function getOtherProjects(slug: string, limit = 3): Promise<TProject[]> {
  if (!(await ready())) return [];

  const docs = (await Project.find(PUBLISHED).sort(PROJECT_SORT).lean()) as Record<
    string,
    unknown
  >[];

  const at = docs.findIndex((doc) => doc.slug === slug);
  if (at === -1) return serialize<TProject[]>(docs.slice(0, limit).map(normalizeProject));

  const picked: Record<string, unknown>[] = [];
  for (let step = 1; step < docs.length && picked.length < limit; step += 1) {
    picked.push(docs[(at + step) % docs.length]);
  }

  return serialize<TProject[]>(picked.map(normalizeProject));
}

export async function getProjectBySlug(slug: string): Promise<TProjectDetail | null> {
  if (!(await ready())) return null;
  // Partners are populated rather than fetched separately because every project
  // page is prerendered — this is build-time cost, not per-request cost. The
  // `match` matters: without it a draft partner would be published by proxy the
  // moment any project credited them. A non-match populates as null, which the
  // page already has to handle for a deleted partner anyway.
  const doc = (await Project.findOne({ slug, ...PUBLISHED })
    .populate({ path: "partners.partner", match: PUBLISHED })
    .lean()) as Record<string, unknown> | null;
  return doc ? serialize<TProjectDetail>(normalizeProject(doc)) : null;
}

export async function getProjectSlugs(): Promise<string[]> {
  if (!(await ready())) return [];
  const docs = await Project.find(PUBLISHED).select("slug").lean();
  return docs.map((d) => String(d.slug));
}

/**
 * Partners for the public partners page.
 *
 * Employers are excluded: the collection doubles as the company directory
 * behind the experience timeline, but this page is about agencies delivered
 * through and the clients the work was for. A former employer listed here would
 * read as a claim about the wrong kind of relationship.
 */
export async function getPartners(): Promise<TPartner[]> {
  if (!(await ready())) return [];
  return serialize<TPartner[]>(
    await Partner.find({ ...PUBLISHED, kind: { $in: PUBLIC_PARTNER_KINDS } })
      .sort({ order: 1 })
      .lean(),
  );
}

/**
 * How many published projects credit each partner, keyed by partner id.
 *
 * Aggregated in one round trip rather than a count per partner — and returned
 * as a plain record so the page can render a partner with zero visible projects
 * without a second query. That case is the point of the partners page: some
 * engagements can be credited but never shown.
 */
export async function getPartnerProjectCounts(): Promise<Record<string, number>> {
  if (!(await ready())) return {};

  const rows = await Project.aggregate<{ _id: unknown; count: number }>([
    { $match: PUBLISHED },
    { $unwind: "$partners" },
    { $group: { _id: "$partners.partner", count: { $sum: 1 } } },
  ]);

  return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
}

/**
 * Brings one experience document up to the company-and-positions shape.
 *
 * Documents written before the restructure are one position each, with the
 * company details inline. They are folded into a single-position company here
 * rather than left to the page, so the timeline keeps rendering in the window
 * between deploying this and running `pnpm migrate:experience` — the same
 * courtesy `normalizeProject` extends to pre-`team` projects.
 *
 * `skills` reads from `techStack` when absent: the field was renamed because
 * what a role taught is not always a technology.
 */
function normalizeExperience(doc: Record<string, unknown>): Record<string, unknown> {
  const positions = Array.isArray(doc.positions) ? (doc.positions as Record<string, unknown>[]) : [];

  const fill = (position: Record<string, unknown>) => ({
    ...position,
    highlights: listOrEmpty(position.highlights),
    skills: Array.isArray(position.skills)
      ? position.skills
      : Array.isArray(position.techStack)
        ? position.techStack
        : [],
    // Same rule as a project gallery: the studio is shared, so a position's
    // media can be held back the same way, and must be dropped just as early.
    media: Array.isArray(position.media)
      ? (position.media as Record<string, unknown>[]).filter(visible)
      : [],
    location: position.location ?? "",
    employmentType: position.employmentType ?? "full-time",
    locationType: position.locationType ?? "onsite",
    current: Boolean(position.current),
    startDate: position.startDate ?? null,
    endDate: position.endDate ?? null,
    position: localizedOrEmpty(position.position),
  });

  // Only a document that actually carries the old inline fields is folded. A
  // migrated company with no positions yet must stay empty rather than grow a
  // blank row synthesised from itself.
  const legacy = positions.length === 0 && Boolean(doc.position);

  return {
    ...doc,
    partner: doc.partner ?? null,
    positions: (positions.length > 0 ? positions : legacy ? [doc] : []).map(fill),
  };
}

/**
 * Companies worked at, each with its positions, most recent first.
 *
 * Ordered by the newest position rather than by a stored field: two employers
 * held at once interleave by date, and sorting the documents themselves would
 * put a company below one it overlapped with purely because its *oldest* role
 * started first.
 */
export async function getExperience(): Promise<TExperience[]> {
  if (!(await ready())) return [];

  // `match` is what stops an unpublished company record from being published by
  // proxy. A non-match populates as null, which the timeline already handles
  // for a deleted company.
  const docs = (await Experience.find(PUBLISHED)
    .populate({ path: "partner", match: PUBLISHED })
    .lean()) as Record<string, unknown>[];

  const latest = (doc: Record<string, unknown>) => {
    const positions = (doc.positions ?? []) as { startDate?: string | Date | null }[];
    const dates = [...positions.map((p) => p.startDate), doc.startDate as string | Date | null]
      .filter(Boolean)
      .map((value) => new Date(value as string).getTime());
    return dates.length > 0 ? Math.max(...dates) : 0;
  };

  return serialize<TExperience[]>(
    docs.sort((a, b) => latest(b) - latest(a)).map(normalizeExperience),
  );
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
