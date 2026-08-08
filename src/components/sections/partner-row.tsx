import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { partnerHref } from "@/lib/project";
import { cn } from "@/lib/utils";
import type { ProjectPartnerResolved } from "@/types/content";

/**
 * A labelled row of partner logos.
 *
 * The link is the interesting part: agencies routinely publish the same work as
 * their own portfolio, so a project can override the destination to point at
 * that specific page rather than the partner's homepage.
 */
export function PartnerRow({
  label,
  entries,
  locale,
  size = "default",
}: {
  label: string;
  entries: ProjectPartnerResolved[];
  locale: Locale;
  size?: "default" | "compact";
}) {
  if (entries.length === 0) return null;

  const compact = size === "compact";

  return (
    <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
      <p className="lab-label text-muted-foreground">{label}</p>

      <ul className={cn("flex flex-wrap items-center", compact ? "gap-3" : "gap-4")}>
        {entries.map((entry) => {
          const partner = entry.partner;
          if (!partner) return null;

          const href = partnerHref(entry);

          const content = (
            <>
              {partner.logo?.url ? (
                <Image
                  src={partner.logo.url}
                  alt={partner.logo.alt?.[locale] || partner.name}
                  width={partner.logo.width ?? 96}
                  height={partner.logo.height ?? 96}
                  // Logos arrive at wildly different intrinsic sizes; constrain
                  // the height and let width follow so none of them dominate.
                  className={cn(
                    "w-auto object-contain",
                    compact ? "max-h-5" : "max-h-7",
                  )}
                />
              ) : null}
              <span className={cn(compact ? "text-xs" : "text-sm")}>{partner.name}</span>
            </>
          );

          return (
            <li key={partner.id}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
                >
                  {content}
                </a>
              ) : (
                <span className="text-muted-foreground inline-flex items-center gap-2">
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
