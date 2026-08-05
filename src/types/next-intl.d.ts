import type messages from "@/messages/en.json";
import type { routing } from "@/i18n/routing";

/**
 * Makes `useTranslations()` key paths and `Locale` type-checked, so a renamed or
 * missing message key fails at compile time instead of rendering the raw key.
 * `en.json` is the source of truth — `id.json` must mirror its shape.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
