import { defineRouting } from "next-intl/routing";

export const locales = ["en", "id"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Human-readable names for the locale switcher, written in their own language. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Always prefix so every URL is unambiguous and `hreflang` alternates stay
  // symmetrical — /en/projects and /id/projects, never a bare /projects.
  localePrefix: "always",
});
