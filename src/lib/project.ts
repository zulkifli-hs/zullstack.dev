import type { Locale } from "@/i18n/routing";
import { contactChannels } from "@/lib/contact";
import type { ProjectLink, ProjectPartnerResolved, SiteConfig } from "@/types/content";

import { formatDate } from "./utils";

/**
 * Presentation rules for a project, kept out of the components.
 *
 * The card and the detail page have to agree on which links are shown and how a
 * duration reads — two answers to that would drift the first time one of them
 * gained a field.
 */

/**
 * Drops the address of every link that is not publicly reachable.
 *
 * Called by the query layer on every project read, so a page cannot render an
 * unstripped one. This is a real boundary, not tidiness: public pages are
 * prerendered to static HTML, so any URL left on the document is printed into
 * the payload and served to everyone — a `request` link would be openable
 * without asking, and an `internal` one would publish a hostname that was never
 * meant to leave the client's network.
 *
 * The link itself survives, so the page can still say the work exists and offer
 * the right call to action.
 */
export function stripPrivateLinkUrls(links: ProjectLink[]): ProjectLink[] {
  return links.map((link) =>
    link?.access === "public" ? link : { ...link, url: undefined },
  );
}

/** Links whose address actually survived stripping. */
export function publicLinks(links: ProjectLink[]): ProjectLink[] {
  return links.filter((link) => link.access === "public" && Boolean(link.url));
}

/** Links that render as a call to action rather than a destination. */
export function requestableLinks(links: ProjectLink[]): ProjectLink[] {
  return links.filter((link) => link.access === "request");
}

export function internalLinks(links: ProjectLink[]): ProjectLink[] {
  return links.filter((link) => link.access === "internal");
}

/**
 * Where a "request demo" button goes.
 *
 * There is no contact form on this site — `contactChannels` derives email and
 * WhatsApp from site config — so the button is a prefilled `mailto:` with the
 * project already named. Falls back to WhatsApp, then to nothing, in which case
 * the caller renders a plain note instead of a dead button.
 */
export function demoRequestHref(
  config: SiteConfig | null,
  projectTitle: string,
  subjectPrefix: string,
): string | null {
  const channels = contactChannels(config);

  const email = channels.find((channel) => channel.id === "email");
  if (email) {
    return `mailto:${email.detail}?subject=${encodeURIComponent(`${subjectPrefix}: ${projectTitle}`)}`;
  }

  const whatsapp = channels.find((channel) => channel.id === "whatsapp");
  if (whatsapp) {
    const separator = whatsapp.href.includes("?") ? "&" : "?";
    return `${whatsapp.href}${separator}text=${encodeURIComponent(`${subjectPrefix}: ${projectTitle}`)}`;
  }

  return null;
}

/**
 * "Mar 2023 — Aug 2023" or "Mar 2023 — Present".
 *
 * Returns null when there is no start date, so callers can fall back to the
 * year, which every project has.
 */
export function formatRange(
  startDate: string | null,
  endDate: string | null,
  locale: Locale,
  presentLabel: string,
): string | null {
  if (!startDate) return null;
  const start = formatDate(startDate, locale);
  return `${start} — ${endDate ? formatDate(endDate, locale) : presentLabel}`;
}

/**
 * Whole months between two dates, inclusive of the starting month.
 *
 * Rounded to months rather than days because that is the unit the work was
 * actually scoped in, and a "4 months 12 days" figure implies a precision the
 * data does not have.
 */
export function monthsBetween(startDate: string | null, endDate: string | null): number | null {
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;

  return months > 0 ? months : null;
}

/** Partner rows whose reference survived population, split by role. */
export function partnersByRole(partners: ProjectPartnerResolved[]) {
  const resolved = partners.filter((entry) => entry.partner);

  return {
    collaboration: resolved.filter((entry) => entry.role === "collaboration"),
    client: resolved.filter((entry) => entry.role === "client"),
  };
}

/** A per-project override wins over the partner's own site. */
export function partnerHref(entry: ProjectPartnerResolved): string | undefined {
  return entry.url || entry.partner?.url || undefined;
}
