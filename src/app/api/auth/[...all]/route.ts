import type { NextRequest } from "next/server";

import { getAuth } from "@/lib/auth";

/**
 * Better Auth's own endpoints (sign-in, sign-out, session).
 * `proxy.ts` excludes /api, so these are never locale-prefixed.
 *
 * The handler is resolved per request rather than at module load because the
 * auth instance is built lazily around the shared Mongoose connection.
 */
async function handler(request: NextRequest) {
  const auth = await getAuth();
  return auth.handler(request);
}

export { handler as GET, handler as POST };
