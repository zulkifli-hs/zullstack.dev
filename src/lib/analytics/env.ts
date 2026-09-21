/**
 * Whether visitor analytics should actually record anything.
 *
 * The rule is stated once, here, because it is enforced in two places that fail
 * differently — the ingest route (the real boundary, reachable by direct POST)
 * and the client tracker (so a dev build sends nothing at all).
 *
 * **Deliberately not `NODE_ENV`.** `next build && next start` is how this
 * project gets verified locally, and it sets `NODE_ENV=production`. A
 * `NODE_ENV` gate would look right and would still write local traffic straight
 * into the live database, because `.env.local` points at the same Atlas
 * cluster. Preview deployments have the same problem: they are production
 * builds serving non-production traffic.
 *
 * `VERCEL_ENV` is the signal that actually distinguishes them — `production`
 * only on a production deployment, `preview` on preview builds, and unset
 * everywhere local. `ANALYTICS_ENABLED` overrides it in either direction so a
 * developer can switch collection on against a scratch database.
 *
 * The failure mode of all this is silence, so the admin dashboard surfaces the
 * result rather than rendering an empty chart and letting you guess.
 */
export function analyticsEnabled(): boolean {
  const flag = process.env.ANALYTICS_ENABLED;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.VERCEL_ENV === "production";
}

/** Why collection is off, for the dashboard banner. Null when it is on. */
export function analyticsDisabledReason(): string | null {
  if (analyticsEnabled()) return null;
  if (process.env.ANALYTICS_ENABLED === "false") {
    return "ANALYTICS_ENABLED is set to \"false\".";
  }
  const env = process.env.VERCEL_ENV;
  if (!env) {
    return "Not running on Vercel (VERCEL_ENV is unset) — this is a local build. Set ANALYTICS_ENABLED=true to collect anyway.";
  }
  return `This is a ${env} deployment, not production. Set ANALYTICS_ENABLED=true to collect anyway.`;
}
