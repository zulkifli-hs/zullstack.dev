import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "./auth";

/**
 * Returns the current session, or null.
 *
 * `headers()` is async in Next 16 — synchronous access was removed.
 */
export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Gate for every admin page and every Server Action that mutates content.
 *
 * `proxy.ts` also blocks `/admin`, but that is an optimistic cookie-presence
 * check only: proxy cannot be the authorization boundary, and Server Actions
 * are reachable by direct POST regardless of which page rendered them. So this
 * is called again inside each action — the proxy check is convenience, this is
 * the actual boundary.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
