import "server-only";

import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AnalyticsEvent } from "@/lib/models";

import type { Range } from "./range";

// Re-exported so the page keeps one import for its range needs; the picker
// imports from `./range` directly, because this module is server-only.
export { RANGES, resolveRange, type Range, type RangeKey } from "./range";

/**
 * Read layer for the analytics dashboard.
 *
 * `server-only`, mirroring `lib/queries.ts` — these run raw aggregations and
 * must never be reachable from a browser bundle.
 *
 * Every pipeline runs against raw events. There is no rollup table yet, and at
 * this volume there does not need to be: the indexes on `createdAt`, `path` and
 * `sessionId` make each of these an index scan over a few thousand documents.
 * The `$addToSet` used to count unique visitors is the thing that will give out
 * first — it materialises the set in memory, against a 100 MB aggregation
 * limit — so the trigger for introducing a rollup is roughly a million events
 * in a single range, not a storage figure.
 */

/** Matches `formatDate` in `lib/utils.ts`, so the dashboard and the site agree. */
const TZ = "Asia/Jakarta";

const within = (range: Range) => ({ createdAt: { $gte: range.from, $lt: range.to } });

async function ready() {
  if (!isDatabaseConfigured()) return false;
  await connectDB();
  return true;
}

export type Kpis = {
  visitors: number;
  pageviews: number;
  sessions: number;
  viewsPerVisit: number;
  bounceRate: number;
  avgDurationMs: number;
};

const EMPTY_KPIS: Kpis = {
  visitors: 0,
  pageviews: 0,
  sessions: 0,
  viewsPerVisit: 0,
  bounceRate: 0,
  avgDurationMs: 0,
};

/**
 * The five headline numbers.
 *
 * Two passes: one over events for the totals, one grouped by session for the
 * session-shaped metrics. A bounce is a session with exactly one pageview —
 * the standard definition, and the reason `sessionId` exists at all.
 */
export async function getKpis(range: Range): Promise<Kpis> {
  if (!(await ready())) return EMPTY_KPIS;

  const [totals, sessions] = await Promise.all([
    AnalyticsEvent.aggregate<{ pageviews: number; visitors: number; sessions: number }>([
      { $match: { ...within(range), type: "pageview" } },
      {
        $group: {
          _id: null,
          pageviews: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
          sessions: { $addToSet: "$sessionId" },
        },
      },
      {
        $project: {
          pageviews: 1,
          visitors: { $size: "$visitors" },
          sessions: { $size: "$sessions" },
        },
      },
    ]),
    AnalyticsEvent.aggregate<{ sessions: number; bounced: number; duration: number }>([
      { $match: { ...within(range), type: "pageview" } },
      { $group: { _id: "$sessionId", views: { $sum: 1 }, duration: { $sum: "$durationMs" } } },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          bounced: { $sum: { $cond: [{ $eq: ["$views", 1] }, 1, 0] } },
          duration: { $sum: "$duration" },
        },
      },
    ]),
  ]);

  const t = totals[0];
  const s = sessions[0];
  if (!t || !s) return EMPTY_KPIS;

  return {
    visitors: t.visitors,
    pageviews: t.pageviews,
    sessions: t.sessions,
    viewsPerVisit: s.sessions ? t.pageviews / s.sessions : 0,
    bounceRate: s.sessions ? (s.bounced / s.sessions) * 100 : 0,
    avgDurationMs: s.sessions ? s.duration / s.sessions : 0,
  };
}

export type Point = { date: string; visitors: number; pageviews: number };

/** Daily series, gap-filled so a quiet day is a zero rather than a missing point. */
export async function getSeries(range: Range): Promise<Point[]> {
  if (!(await ready())) return [];

  const rows = await AnalyticsEvent.aggregate<{ _id: string; pageviews: number; visitors: number }>([
    { $match: { ...within(range), type: "pageview" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ } },
        pageviews: { $sum: 1 },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    { $project: { pageviews: 1, visitors: { $size: "$visitors" } } },
    { $sort: { _id: 1 } },
  ]);

  const byDate = new Map(rows.map((row) => [row._id, row]));
  const out: Point[] = [];
  const seen = new Set<string>();

  const key = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: TZ });
  const add = (date: string) => {
    if (seen.has(date)) return;
    seen.add(date);
    const row = byDate.get(date);
    out.push({ date, visitors: row?.visitors ?? 0, pageviews: row?.pageviews ?? 0 });
  };

  // A line chart that silently omits empty days compresses the x-axis and draws
  // a rise that never happened, so every date in the window gets a bucket.
  //
  // `<=`, and the explicit final `add` below, because the obvious `day <
  // range.to` stops one step short: the window ends at *now*, so the last
  // iteration lands on yesterday and today never gets a bucket at all. Today's
  // traffic was being aggregated correctly and then dropped on the floor —
  // invisible unless you count the points.
  for (const day = new Date(range.from); day.getTime() <= range.to.getTime(); day.setDate(day.getDate() + 1)) {
    add(key(day));
  }
  add(key(range.to));

  return out;
}

export type Row = { label: string; visitors: number; pageviews: number };

/**
 * Top values of one dimension.
 *
 * Generic because nine of the dashboard's tables are the same query with a
 * different `$group` key, and nine hand-written copies is nine places for the
 * unique-visitor count to be got subtly wrong.
 */
export async function getBreakdown(
  range: Range,
  field: string,
  options: { limit?: number; match?: Record<string, unknown> } = {},
): Promise<Row[]> {
  if (!(await ready())) return [];

  const rows = await AnalyticsEvent.aggregate<{ _id: string; pageviews: number; visitors: number }>([
    {
      $match: {
        ...within(range),
        type: "pageview",
        ...options.match,
        [field]: { $nin: ["", null] },
      },
    },
    {
      $group: {
        _id: `$${field}`,
        pageviews: { $sum: 1 },
        visitors: { $addToSet: "$visitorId" },
      },
    },
    { $project: { pageviews: 1, visitors: { $size: "$visitors" } } },
    { $sort: { visitors: -1, pageviews: -1 } },
    { $limit: options.limit ?? 10 },
  ]);

  return rows.map((row) => ({ label: row._id, visitors: row.visitors, pageviews: row.pageviews }));
}

/**
 * Where sessions ended.
 *
 * Derived, not flagged. The leave-beacon that would set an `isExit` field is
 * the least reliable message the client sends, so the exit page is computed as
 * the last pageview of each session — data that is always present.
 */
export async function getExitPages(range: Range, limit = 10): Promise<Row[]> {
  if (!(await ready())) return [];

  const rows = await AnalyticsEvent.aggregate<{ _id: string; sessions: number }>([
    { $match: { ...within(range), type: "pageview" } },
    { $sort: { sessionId: 1, createdAt: -1 } },
    { $group: { _id: "$sessionId", path: { $first: "$path" } } },
    { $group: { _id: "$path", sessions: { $sum: 1 } } },
    { $sort: { sessions: -1 } },
    { $limit: limit },
  ]);

  return rows.map((row) => ({ label: row._id, visitors: row.sessions, pageviews: row.sessions }));
}

export type EventRow = { name: string; count: number; visitors: number; props: Row[] };

/** Custom events, each with a breakdown of the properties it carried. */
export async function getEvents(range: Range): Promise<EventRow[]> {
  if (!(await ready())) return [];

  // Two plain pipelines rather than one clever one. The first attempt did the
  // property rollup inline with `$reduce`/`$setUnion`, which deduplicated the
  // pairs instead of counting them — every property showed a count of 1. This
  // is what `{ key, value }` pairs were chosen for in the schema: `$unwind`,
  // then `$group`.
  const [totals, props] = await Promise.all([
    AnalyticsEvent.aggregate<{ _id: string; count: number; visitors: number }>([
      { $match: { ...within(range), type: "event" } },
      { $group: { _id: "$name", count: { $sum: 1 }, visitors: { $addToSet: "$visitorId" } } },
      { $project: { count: 1, visitors: { $size: "$visitors" } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEvent.aggregate<{ _id: { name: string; key: string; value: string }; count: number }>([
      { $match: { ...within(range), type: "event" } },
      { $unwind: "$props" },
      {
        $group: {
          _id: { name: "$name", key: "$props.key", value: "$props.value" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 200 },
    ]),
  ]);

  return totals.map((row) => ({
    name: row._id,
    count: row.count,
    visitors: row.visitors,
    props: props
      .filter((p) => p._id.name === row._id)
      .slice(0, 8)
      .map((p) => ({
        label: `${p._id.key}: ${p._id.value}`,
        visitors: p.count,
        pageviews: p.count,
      })),
  }));
}

/** Distinct visitors in the last five minutes. */
export async function getRealtime(): Promise<number> {
  if (!(await ready())) return 0;

  const rows = await AnalyticsEvent.aggregate<{ visitors: number }>([
    { $match: { createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } } },
    { $group: { _id: null, visitors: { $addToSet: "$visitorId" } } },
    { $project: { visitors: { $size: "$visitors" } } },
  ]);

  return rows[0]?.visitors ?? 0;
}
