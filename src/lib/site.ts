import { routing } from "@/i18n/routing";

/** Canonical origin, without a trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zullstack.dev").replace(
  /\/$/,
  "",
);

/** Routes that exist in both locales and belong in the sitemap. */
export const STATIC_ROUTES = [
  "",
  "/projects",
  "/experience",
  "/mentoring",
  "/articles",
  "/testimonials",
  "/resources",
  "/open-source",
  "/playground",
] as const;

/**
 * `hreflang` alternates for a path.
 *
 * Search engines need every locale of a page to point at every other locale,
 * including itself, or the cluster is ignored.
 */
export function localeAlternates(path: string): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
}
