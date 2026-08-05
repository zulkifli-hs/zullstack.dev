import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "./routing";

/**
 * Validates the `[locale]` segment and enables static rendering for the caller.
 *
 * Every page and layout needs both steps, and forgetting `setRequestLocale`
 * silently opts the route into dynamic rendering — a slow failure that never
 * throws. Doing them together makes that impossible to get half-right.
 */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  return locale;
}
