import "server-only";

import { userAgentFromString } from "next/server";

/**
 * Turns a request into the dimensions worth keeping, and drops the rest.
 *
 * Everything here runs on data the browser sends anyway. What matters is what
 * comes *out*: a parsed browser/OS/device, a country, a grouped traffic source.
 * The raw user-agent string and the raw IP are inputs only — nothing in this
 * module returns them, so nothing downstream can store them by accident.
 */

/**
 * Hosts worth naming. Everything else keeps its bare host, which is more useful
 * than a catch-all "Other" bucket — a referral from one blog is a real fact.
 */
const SOURCES: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)baidu\.com$/, "Baidu"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)github\.com$/, "GitHub"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/^news\.ycombinator\.com$/, "Hacker News"],
  [/(^|\.)dev\.to$/, "DEV"],
  [/(^|\.)medium\.com$/, "Medium"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/^t\.me$|(^|\.)telegram\./, "Telegram"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "WhatsApp"],
];

export type Referral = { referrerHost: string; source: string };

/**
 * Where this visit came from.
 *
 * A referrer pointing at our own host is internal navigation, not a source, and
 * is flattened to Direct. This matters more than it looks: `document.referrer`
 * does not change across client-side route changes, so without this every
 * in-app navigation after a full page load would re-attribute itself to the
 * site's own domain.
 */
export function parseReferrer(referrer: string | undefined, selfHost: string): Referral {
  if (!referrer) return { referrerHost: "", source: "Direct" };

  let host: string;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return { referrerHost: "", source: "Direct" };
  }

  if (!host || host === selfHost.replace(/^www\./, "").toLowerCase()) {
    return { referrerHost: "", source: "Direct" };
  }

  const named = SOURCES.find(([pattern]) => pattern.test(host));
  return { referrerHost: host, source: named ? named[1] : host };
}

export type Utm = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

const EMPTY_UTM: Utm = { source: "", medium: "", campaign: "", content: "", term: "" };

/** UTM tags off the landing URL's query string. Capped, like every other input. */
export function parseUtm(query: string | undefined): Utm {
  if (!query) return EMPTY_UTM;

  const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
  const take = (key: string) => (params.get(key) ?? "").trim().slice(0, 120);

  return {
    source: take("utm_source"),
    medium: take("utm_medium"),
    campaign: take("utm_campaign"),
    content: take("utm_content"),
    term: take("utm_term"),
  };
}

export type Client = {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  isBot: boolean;
};

/**
 * Browser, OS and form factor, from Next's own parser.
 *
 * `userAgentFromString` ships with Next 16 and returns `isBot` alongside the
 * parsed fields, which is why this feature needs neither `ua-parser-js` nor
 * `isbot`. `device.type` is undefined for desktops — the parser only names the
 * exceptions.
 */
export function parseClient(userAgent: string): Client {
  const parsed = userAgentFromString(userAgent);

  return {
    browser: parsed.browser.name ?? "",
    browserVersion: parsed.browser.major ?? "",
    os: parsed.os.name ?? "",
    deviceType: parsed.device.type ?? "desktop",
    isBot: parsed.isBot,
  };
}

export type Geo = { country: string; region: string; city: string };

/**
 * Country, region and city from Vercel's edge headers.
 *
 * Free on every plan and already attached to the request, so there is no GeoIP
 * database to ship and no third-party lookup. City arrives percent-encoded —
 * "Kuala%20Lumpur" — which is the kind of thing that only shows up in the
 * dashboard weeks later if it is not handled at the boundary.
 */
export function parseGeo(headers: Headers): Geo {
  const read = (name: string) => {
    const raw = headers.get(name);
    if (!raw) return "";
    try {
      return decodeURIComponent(raw).trim().slice(0, 80);
    } catch {
      return raw.trim().slice(0, 80);
    }
  };

  return {
    country: read("x-vercel-ip-country"),
    region: read("x-vercel-ip-country-region"),
    city: read("x-vercel-ip-city"),
  };
}
