import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives.
 *
 * Always import `Link` from here rather than `next/link`, and never hand-build
 * `/${locale}${href}` strings — that pattern silently drops the locale on any
 * href that already carries one, and it bypasses `localePrefix` entirely.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
