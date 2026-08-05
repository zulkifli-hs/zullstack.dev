import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { Locale } from "@/i18n/routing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Reads one language out of a bilingual field.
 *
 * Falls back to the other language rather than rendering an empty string: a
 * half-translated document should show *something* real, and a visibly
 * untranslated string is a much better bug report than a blank space.
 */
export function pick(field: { en: string; id: string } | undefined, locale: Locale): string {
  if (!field) return "";
  return field[locale] || field.en || field.id || "";
}

/** Same fallback rule for bilingual lists. */
export function pickList(
  field: { en: string[]; id: string[] } | undefined,
  locale: Locale,
): string[] {
  if (!field) return [];
  const value = field[locale];
  if (value?.length) return value;
  return field.en?.length ? field.en : (field.id ?? []);
}

/** Locale-aware date formatting with a fixed zone, to match the server render. */
export function formatDate(
  value: string | Date | null | undefined,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" },
): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    ...options,
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}
