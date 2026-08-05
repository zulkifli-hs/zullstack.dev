import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Next.js 16 renamed Middleware to Proxy. This file MUST be named `proxy.ts`
 * with a `proxy` export — keeping the old `middleware.ts` name silently stops
 * next-intl from resolving a locale ("Unable to find next-intl locale").
 */
const intl = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    // Optimistic check only: this reads cookie *presence*, not validity, and
    // deliberately does not hit the database — proxy runs on every request.
    // The real authorization boundary is `requireAdmin()` inside each page and
    // Server Action, because a Server Action can be POSTed directly.
    const hasSession = getSessionCookie(request);

    if (!hasSession && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (hasSession && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Admin is not localized, so it never goes through the intl middleware.
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  /**
   * Everything except framework routes and static files. `/admin` IS matched
   * here (unlike the public-only pattern) so the session check above runs.
   */
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
