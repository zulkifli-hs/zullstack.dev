import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Tag } from "@/components/lab/section";
import { ProjectGallery } from "@/components/sections/project-gallery";
import type { Locale } from "@/i18n/routing";
import {
  companyLogo,
  companyName,
  companyUrl,
  formatTenure,
  monthsBetween,
  sortedPositions,
  tenureMonths,
} from "@/lib/experience";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { formatDate, pick, pickList } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Experience, ExperiencePosition } from "@/types/content";

/**
 * Companies, each with the titles held there.
 *
 * Grouped rather than flat because a flat list cannot state the one thing a
 * career of overlapping work is made of: two employers at once. Sorted by start
 * date, three roles at one company and three at another interleave into six
 * fragments, and the reader has to reassemble both histories from the dates.
 */
export async function ExperienceTimeline({
  items,
  locale,
  limit,
}: {
  items: Experience[];
  locale: Locale;
  /** Companies, not positions — the home page shows the three most recent. */
  limit?: number;
}) {
  // `gallery` is its own namespace rather than a corner of `projects`, because
  // the same component now labels images in two unrelated places.
  const [t, tGallery] = await Promise.all([
    getTranslations("sections.experience"),
    getTranslations("gallery"),
  ]);
  const shown = limit ? items.slice(0, limit) : items;

  const tenureLabels = {
    years: (count: number) => t("years", { count }),
    months: (count: number) => t("months", { count }),
  };

  return (
    <ol className="space-y-10">
      {shown.map((entry) => {
        const positions = sortedPositions(entry);
        const name = companyName(entry);
        const url = companyUrl(entry);
        const logo = companyLogo(entry);
        const tenure = formatTenure(tenureMonths(positions), tenureLabels);
        // The company's own line carries where it was based; each position adds
        // only what differs from it, which is usually just onsite/remote.
        const location = positions.find((position) => position.location)?.location;

        return (
          <li key={entry.id}>
            <div className="flex items-start gap-3">
              {/* Glass rather than a bordered box: a hairline square sat flat
                  against the page and read as a placeholder. The tile is small
                  and repeats down the page, so it takes the cheap `glass` tier
                  rather than the lens — refraction is budgeted for the hero. */}
              <GlassPanel
                variant="glass"
                tier="sm"
                padding="none"
                className="grid size-12 shrink-0 place-items-center overflow-hidden"
              >
                {logo ? (
                  <Image
                    src={cloudinarySrc(logo)}
                    alt=""
                    width={logo.width ?? 96}
                    height={logo.height ?? 96}
                    className="size-full object-contain p-1.5"
                  />
                ) : (
                  // An initial keeps every company on the same left edge, so a
                  // missing logo does not shunt one block out of alignment.
                  <span aria-hidden className="text-muted-foreground/70 font-mono text-sm">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </GlassPanel>

              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-link transition-colors"
                    >
                      {name}
                    </a>
                  ) : (
                    name
                  )}
                </h3>

                <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                  {[tenure, location].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>

            {/* Indented to sit under the company name, not the logo — the same
                hanging alignment LinkedIn uses, which is what makes a block of
                positions read as belonging to the company above it. */}
            <ol className="mt-4 ml-5 space-y-6 sm:ml-14">
              {positions.map((position, index) => (
                <Position
                  key={`${pick(position.position, locale)}-${index}`}
                  position={position}
                  locale={locale}
                  last={index === positions.length - 1}
                  labels={{
                    present: t("present"),
                    skills: t("skills"),
                    long: tGallery("long"),
                    ungrouped: tGallery("other"),
                  }}
                  duration={formatTenure(
                    monthsBetween(position.startDate, position.endDate),
                    tenureLabels,
                  )}
                />
              ))}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}

function Position({
  position,
  locale,
  last,
  duration,
  labels,
}: {
  position: ExperiencePosition;
  locale: Locale;
  last: boolean;
  duration: string;
  labels: { present: string; skills: string; long: string; ungrouped: string };
}) {
  const highlights = pickList(position.highlights, locale);

  const range = position.startDate
    ? `${formatDate(position.startDate, locale)} — ${
        position.endDate ? formatDate(position.endDate, locale) : labels.present
      }`
    : "";

  return (
    // The rail is a left border on each item rather than one absolutely
    // positioned line, so it can never drift out of sync with the content it is
    // measuring. The last position stops the line instead of trailing past it.
    //
    // `border-signal/30` rather than the hairline: the page substrate is a
    // blueprint grid of 1px blue lines, and a neutral hairline of the same
    // weight simply disappeared into it. Borrowing the accent gives the rail a
    // hue the grid does not have, so it reads as structure rather than as one
    // more grid line.
    <li className={cn("relative border-l pl-6", last ? "border-transparent" : "border-signal/30")}>
      <span
        aria-hidden
        className="bg-background absolute top-1.5 -left-1.25 size-2.5 rounded-full"
        style={{ boxShadow: "0 0 0 2px var(--signal)" }}
      />

      <h4 className="font-medium tracking-tight">{pick(position.position, locale)}</h4>

      <p className="text-muted-foreground mt-0.5 font-mono text-xs">
        {[range, duration].filter(Boolean).join(" · ")}
      </p>
      <p className="text-muted-foreground font-mono text-xs">
        {[position.employmentType, position.locationType].filter(Boolean).join(" · ")}
      </p>

      {highlights.length > 0 && (
        <ul className="text-muted-foreground mt-3 space-y-1.5 text-sm">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2.5">
              <span aria-hidden className="text-signal mt-px font-mono text-xs">
                ▸
              </span>
              <span className="text-pretty">{highlight}</span>
            </li>
          ))}
        </ul>
      )}

      {position.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {position.skills.map((skill) => (
            <Tag key={skill}>{skill}</Tag>
          ))}
        </div>
      )}

      {/* The same gallery the project pages use — bento grid, lightbox and all.
          A second gallery built for this one place would be a second thing to
          keep working. */}
      {position.media.length > 0 && (
        <div className="mt-4">
          <ProjectGallery
            images={position.media}
            locale={locale}
            title={pick(position.position, locale)}
            labels={{ long: labels.long, ungrouped: labels.ungrouped }}
          />
        </div>
      )}
    </li>
  );
}
