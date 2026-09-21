import { z } from "zod";

import { NAV_ITEMS } from "@/lib/navigation";

/**
 * The wire contract between the browser tracker and the ingest route.
 *
 * Shared rather than duplicated: the tracker builds this object and the route
 * parses it, and two copies of the shape is how a field silently stops being
 * recorded. Client-safe on purpose — no `server-only`, no Mongoose.
 */

/**
 * Custom event names, as a closed set.
 *
 * Plausible allows arbitrary names; this does not, because the ingest endpoint
 * is public and unauthenticated. An open vocabulary means anyone can invent a
 * million distinct event names and make the goals table useless — a closed one
 * makes that impossible rather than merely rate-limited.
 *
 * Every name here is wired to an interaction that already exists. Two that were
 * planned are absent: `project-link`, because a project's live/repo/demo links
 * are outbound anchors and the automatic `outbound` event already records both
 * the destination and the project page it was clicked from — a second event
 * would double-count one click; and `not-found`, because this site has no
 * `not-found.tsx` to fire it from.
 */
export const ANALYTICS_EVENTS = [
  "outbound",
  "download",
  "search",
  "filter",
  "contact",
  "gallery",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

const STATIC_PATHS = new Set<string>(["/", ...NAV_ITEMS.map((item) => item.href)]);

/** The two routes with a slug. Slug shape matches the model's `lowercase` slugs. */
const DETAIL_PATH = /^\/(?:projects|articles)\/[a-z0-9][a-z0-9-]{0,79}$/;

/**
 * Whether a path is one this site actually serves.
 *
 * The endpoint is public, so without this the top-pages table is writable by
 * anyone with `curl`. Built from `NAV_ITEMS` rather than a hand-kept list, so a
 * new section stays trackable without anyone remembering to update this file.
 */
export function isTrackablePath(path: string): boolean {
  return STATIC_PATHS.has(path) || DETAIL_PATH.test(path);
}

/**
 * Property bags are capped in every dimension — count, key length and value
 * length. Attacker-controlled strings reach the database from here, and the
 * only real defence against a wide one is refusing to store it.
 */
const props = z
  .record(z.string().trim().min(1).max(40), z.union([z.string(), z.number(), z.boolean()]))
  .refine((value) => Object.keys(value).length <= 10, "Too many properties")
  .transform((value) =>
    Object.entries(value).map(([key, raw]) => ({ key, value: String(raw).slice(0, 200) })),
  );

export const analyticsPayloadSchema = z.object({
  /**
   * `leave` is not a stored event type — it updates the pageview it belongs to
   * with the engagement figures that are only known once the visitor has gone.
   */
  type: z.enum(["pageview", "event", "leave"]),
  path: z.string().trim().max(200).refine(isTrackablePath, "Unknown path"),
  locale: z.string().trim().max(8),
  title: z.string().trim().max(200).optional(),
  /** `document.referrer`, parsed and reduced to a host on the server. */
  referrer: z.string().trim().max(500).optional(),
  /** `location.search`, the only source of UTM tags. */
  query: z.string().trim().max(500).optional(),
  viewportW: z.number().int().min(0).max(20000).optional(),
  viewportH: z.number().int().min(0).max(20000).optional(),
  name: z.enum(ANALYTICS_EVENTS).optional(),
  props: props.optional(),
  /** `leave` only. Visible time, and the scroll high-water mark. */
  durationMs: z.number().int().min(0).max(6 * 60 * 60 * 1000).optional(),
  scrollDepth: z.number().int().min(0).max(100).optional(),
});

export type AnalyticsPayload = z.input<typeof analyticsPayloadSchema>;

/** Where the tracker posts. One constant so the two ends cannot disagree. */
export const ANALYTICS_ENDPOINT = "/api/analytics";
