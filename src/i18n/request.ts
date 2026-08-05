import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // `requestLocale` is the segment value; it can be undefined or unknown when a
  // request slips past the proxy (e.g. a hand-typed /xx/ URL), so validate
  // rather than trusting it.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Fixed zone keeps server and client formatting identical, which is what
    // causes most next-intl hydration mismatches when left unset.
    timeZone: "Asia/Jakarta",
  };
});
