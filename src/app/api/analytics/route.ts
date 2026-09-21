import { after, userAgentFromString, type NextRequest } from "next/server";

import { analyticsEnabled } from "@/lib/analytics/env";
import { parseClient, parseGeo, parseReferrer, parseUtm } from "@/lib/analytics/enrich";
import { computeVisitorId, dailySalt, sessionFor } from "@/lib/analytics/identity";
import { analyticsPayloadSchema } from "@/lib/analytics/types";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { AnalyticsEvent, Article } from "@/lib/models";
import { rawIp } from "@/lib/visitor";

/**
 * Analytics ingest.
 *
 * Every public page is statically prerendered, so there is no per-visit server
 * render to hook into — collection has to come from the browser, which means a
 * public, unauthenticated endpoint. Most of what follows is the cost of that:
 * the guards exist because anyone can `curl` this.
 *
 * Route Handlers are not cached for POST, so no cache directive is needed.
 */

const SESSION_COOKIE_HINT = /(^|;\s*)(__Secure-)?better-auth\.session_token=/;

/** Beacons are small. Anything larger is not one of ours. */
const MAX_BODY_BYTES = 4096;

/**
 * Per-visitor ceiling, matching the shape of the comment rate limit.
 *
 * Keyed on the salted `visitorId` rather than on a hash of the IP. An IP digest
 * would have been the obvious choice — the comment limiter uses one — but an
 * *unsalted* hash stored on every event is a stable identifier that survives
 * the daily salt rotation, and grouping by it would re-link a visitor across
 * days. That is exactly the capability this design gives up. `visitorId`
 * already folds in the IP, rotates daily, and has the index this query needs.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 60 };

/** 204 with no body: the client never reads this, and says nothing either way. */
const ACCEPTED = new Response(null, { status: 204 });

export async function POST(request: NextRequest) {
  // Off outside production. First check, before parsing anything — see
  // `analytics/env.ts` for why this is not `NODE_ENV`.
  if (!analyticsEnabled() || !isDatabaseConfigured()) return ACCEPTED;

  // Same-origin only. The endpoint's failure mode is a poisoned top-pages
  // table, and an Origin check is the cheapest thing that stops a script
  // somewhere else from writing into it.
  const origin = request.headers.get("origin");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || !site || new URL(site).origin !== origin) return ACCEPTED;

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || userAgentFromString(userAgent).isBot) return ACCEPTED;

  // Owner traffic. You are signed into /admin, so your own browsing drops out
  // without a "disable analytics" flag stored on your device — which would be
  // device storage, and would need consent like everything else.
  if (SESSION_COOKIE_HINT.test(request.headers.get("cookie") ?? "")) return ACCEPTED;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return ACCEPTED;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return ACCEPTED;
  }

  const parsed = analyticsPayloadSchema.safeParse(json);
  if (!parsed.success) return ACCEPTED;
  const payload = parsed.data;

  // Read request state now, while the request is unambiguously in scope, and
  // hand plain values to the deferred write.
  const ip = await rawIp();
  const geo = parseGeo(request.headers);
  const selfHost = new URL(site).hostname;

  // `after` runs once the response has been sent, so none of the database work
  // below holds the connection open.
  after(async () => {
    try {
      await connectDB();

      const visitorId = computeVisitorId({
        salt: await dailySalt(),
        ip,
        userAgent,
        host: selfHost,
      });

      const recent = await AnalyticsEvent.countDocuments({
        visitorId,
        createdAt: { $gt: new Date(Date.now() - RATE_LIMIT.windowMs) },
      });
      if (recent >= RATE_LIMIT.max) return;

      // The engagement figures for a pageview are only known once the visitor
      // has left it, so they arrive as a second message and update the first.
      // `$max` on scroll depth because a late beacon must never lower a mark
      // an earlier one already reached.
      if (payload.type === "leave") {
        await AnalyticsEvent.findOneAndUpdate(
          { visitorId, path: payload.path, type: "pageview" },
          {
            $set: { durationMs: payload.durationMs ?? 0 },
            $max: { scrollDepth: payload.scrollDepth ?? 0 },
          },
          { sort: { createdAt: -1 } },
        );
        return;
      }

      const { sessionId, isEntry } = await sessionFor(visitorId);
      const client = parseClient(userAgent);

      await AnalyticsEvent.create({
        visitorId,
        sessionId,
        type: payload.type,
        name: payload.type === "event" ? (payload.name ?? "") : "",
        path: payload.path,
        locale: payload.locale,
        title: payload.title ?? "",
        ...parseReferrer(payload.referrer, selfHost),
        utm: parseUtm(payload.query),
        ...geo,
        browser: client.browser,
        browserVersion: client.browserVersion,
        os: client.os,
        deviceType: client.deviceType,
        viewportW: payload.viewportW ?? 0,
        viewportH: payload.viewportH ?? 0,
        isEntry,
        props: payload.props ?? [],
      });

      // `Article.viewCount` has been in the schema since it was written and
      // nothing has ever incremented it. This is its first writer.
      if (payload.type === "pageview") {
        const slug = payload.path.match(/^\/articles\/([a-z0-9-]+)$/)?.[1];
        if (slug) {
          await Article.updateOne({ slug, status: "published" }, { $inc: { viewCount: 1 } });
        }
      }
    } catch (error) {
      // A dropped analytics event is not worth a 500 the client will never see,
      // but it is worth a log — silence here looks identical to no traffic.
      console.error("[analytics] ingest failed", error);
    }
  });

  return ACCEPTED;
}
