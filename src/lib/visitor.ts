import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * Per-visitor primitives shared by every feature that needs to tell one browser
 * from another without knowing who is holding it.
 *
 * These lived in `actions/engagement.ts` until analytics needed them too. That
 * file carries `"use server"`, which makes every one of its exports a Server
 * Action — a Route Handler cannot import a helper from it, and exporting these
 * as actions would publish `ipHash()` as a callable endpoint. So they moved
 * here, to a plain server module, and `engagement.ts` imports them back.
 *
 * `server-only` rather than nothing: an accidental client import becomes a
 * build error instead of a bundled `node:crypto`.
 */

export const VISITOR_COOKIE = "zullstack-visitor";

/**
 * A stable per-visitor identifier, used to make likes idempotent.
 *
 * Deliberately not tied to any personal data — it is a random UUID this browser
 * happens to hold, so it identifies a browser, not a person. Hashed before
 * storage so the raw cookie value never sits in the database.
 *
 * Writes the cookie when absent, so it may only be called from a Server Action
 * or a Route Handler. `readVisitorHash` is the read-only half.
 */
export async function visitorHash(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(VISITOR_COOKIE)?.value;

  if (!id) {
    id = randomUUID();
    jar.set(VISITOR_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return createHash("sha256").update(id).digest("hex");
}

/**
 * The same hash, without minting a cookie for a visitor who has none.
 *
 * Separate from `visitorHash` because a read path must not have a write's
 * side effect: asking "has this visitor liked the article" should not brand a
 * browser that has never interacted with anything.
 */
export async function readVisitorHash(): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(VISITOR_COOKIE)?.value;
  return id ? createHash("sha256").update(id).digest("hex") : null;
}

/** IP is hashed, never stored raw — it is only needed to rate-limit. */
export async function ipHash(): Promise<string> {
  return createHash("sha256").update(await rawIp()).digest("hex");
}

/**
 * The client address, as the platform reports it.
 *
 * Exported because analytics needs the address itself as one ingredient of a
 * salted daily hash, not the unsalted digest `ipHash` produces — reusing that
 * would make the analytics identifier stable forever, which is exactly what
 * rotating a salt is meant to prevent. The raw value is never persisted by
 * either caller.
 */
export async function rawIp(): Promise<string> {
  const head = await headers();
  return (
    head.get("x-forwarded-for")?.split(",")[0]?.trim() || head.get("x-real-ip") || "unknown"
  );
}
