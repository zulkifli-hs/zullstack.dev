import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { AnalyticsEvent, AnalyticsSalt } from "@/lib/models";

/** Inactivity gap that ends a session. Thirty minutes is the industry default. */
export const SESSION_WINDOW_MS = 30 * 60 * 1000;

/** UTC `YYYY-MM-DD`. String-compared, so no timezone can drift into it. */
function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Cached for this instance only.
 *
 * Serverless instances do not share memory, so this saves a read per warm
 * invocation and nothing more — correctness comes from the database, not here.
 */
let cached: { date: string; value: string } | null = null;

type SaltDoc = { date?: unknown; value?: unknown };

/**
 * Today's salt, rotating at UTC midnight and destroying the previous value.
 *
 * That destruction is the entire privacy mechanism: once yesterday's salt is
 * overwritten, yesterday's visitor hashes cannot be recomputed by anyone —
 * including us — so a visitor cannot be followed from one day to the next. It
 * is also why returning-visitor metrics do not exist here, and why the site
 * needs no consent banner.
 */
export async function dailySalt(): Promise<string> {
  const today = utcDay();
  if (cached?.date === today) return cached.value;

  const current = (await AnalyticsSalt.findById("salt").lean()) as SaltDoc | null;
  if (current?.date === today && typeof current.value === "string") {
    cached = { date: today, value: current.value };
    return current.value;
  }

  const fresh = randomBytes(32).toString("hex");

  // Guarded by `date: { $ne: today }` so two instances rotating at the same
  // midnight cannot mint two different salts: the first wins, the second's
  // filter no longer matches and its upsert collides on `_id`.
  try {
    const rotated = (await AnalyticsSalt.findOneAndUpdate(
      { _id: "salt", date: { $ne: today } },
      { $set: { date: today, value: fresh } },
      { upsert: true, new: true },
    ).lean()) as SaltDoc | null;

    const value = typeof rotated?.value === "string" ? rotated.value : fresh;
    cached = { date: today, value };
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/duplicate key/i.test(message)) throw error;

    // Lost the race. The winner's salt is the one that counts.
    const winner = (await AnalyticsSalt.findById("salt").lean()) as SaltDoc | null;
    const value = typeof winner?.value === "string" ? winner.value : fresh;
    cached = { date: today, value };
    return value;
  }
}

/**
 * The cookieless visitor identifier.
 *
 * Pure, and takes its ingredients as arguments rather than reading request
 * state, so the caller can read headers once before the response and hash
 * afterwards. None of the inputs is stored — only what comes out.
 */
export function computeVisitorId(input: {
  salt: string;
  ip: string;
  userAgent: string;
  host: string;
}): string {
  return createHash("sha256")
    .update(`${input.salt}|${input.ip}|${input.userAgent}|${input.host}`)
    .digest("hex");
}

/**
 * The session this event belongs to, stitched server-side.
 *
 * A session is normally kept in a cookie or `sessionStorage`. Both are device
 * storage under ePrivacy — `sessionStorage` is not a loophole — so either would
 * bring back the consent banner this design exists to avoid. Instead: find this
 * visitor's most recent event, and continue its session if it is inside the
 * window. One indexed read on `{ visitorId, createdAt }` per ingest.
 *
 * `isEntry` falls out for free — no recent event means this is a landing.
 */
export async function sessionFor(visitorId: string): Promise<{
  sessionId: string;
  isEntry: boolean;
}> {
  const recent = await AnalyticsEvent.findOne({
    visitorId,
    createdAt: { $gt: new Date(Date.now() - SESSION_WINDOW_MS) },
  })
    .sort({ createdAt: -1 })
    .select("sessionId")
    .lean();

  const sessionId = (recent as { sessionId?: unknown } | null)?.sessionId;
  if (typeof sessionId === "string" && sessionId) return { sessionId, isEntry: false };

  return { sessionId: randomBytes(16).toString("hex"), isEntry: true };
}
