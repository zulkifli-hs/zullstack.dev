import type { SiteConfig } from "@/types/content";

export type ContactChannel = {
  id: "email" | "whatsapp";
  href: string;
  /** The address or number, shown under the label. */
  detail: string;
};

/** Anything a `platform` field might plausibly say for WhatsApp. */
const WHATSAPP = /^(whatsapp|wa)$/i;

/**
 * Contact channels, derived from existing CMS fields rather than new ones.
 *
 * WhatsApp rides on the existing `socials` array — adding a dedicated schema
 * field would mean a migration and a second admin input for something the CMS
 * can already express. `handle` carries the display number when present.
 */
export function contactChannels(config: SiteConfig | null): ContactChannel[] {
  const channels: ContactChannel[] = [];

  if (config?.email) {
    channels.push({ id: "email", href: `mailto:${config.email}`, detail: config.email });
  }

  const wa = config?.socials?.find((social) => WHATSAPP.test(social.platform.trim()));
  if (wa?.url) {
    channels.push({
      id: "whatsapp",
      // Stored URLs may already be wa.me links or bare numbers; normalise both.
      href: wa.url.startsWith("http")
        ? wa.url
        : `https://wa.me/${wa.url.replace(/[^\d]/g, "")}`,
      detail: wa.handle || wa.url,
    });
  }

  return channels;
}
