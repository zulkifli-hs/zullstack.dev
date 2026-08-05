import { getTranslations } from "next-intl/server";

import { Tag } from "@/components/lab/section";
import type { Locale } from "@/i18n/routing";
import { formatDate, pick, pickList } from "@/lib/utils";
import type { Experience } from "@/types/content";

export async function ExperienceTimeline({
  items,
  locale,
  limit,
}: {
  items: Experience[];
  locale: Locale;
  limit?: number;
}) {
  const t = await getTranslations("sections.experience");
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <ol className="relative">
      {shown.map((role) => (
        <li
          key={role.id}
          // The rail is drawn with a left border on each item rather than one
          // absolutely-positioned line, so it can never drift out of sync with
          // the content height.
          className="border-hairline relative border-l pb-10 pl-8 last:border-transparent last:pb-0"
        >
          <span
            aria-hidden
            className="bg-background absolute top-1.5 -left-[5px] size-2.5 rounded-full ring-2"
            style={{ boxShadow: "0 0 0 2px var(--signal)" }}
          />

          <p className="lab-label text-muted-foreground tabular">
            {formatDate(role.startDate, locale)} —{" "}
            {role.current ? t("present") : formatDate(role.endDate, locale)}
          </p>

          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            {pick(role.position, locale)}
          </h3>
          <p className="text-link text-sm font-medium">
            {role.companyUrl ? (
              <a href={role.companyUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {role.company}
              </a>
            ) : (
              role.company
            )}
          </p>
          <p className="text-muted-foreground mt-0.5 font-mono text-xs">
            {role.location} · {role.locationType} · {role.employmentType}
          </p>

          <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
            {pickList(role.highlights, locale).map((highlight) => (
              <li key={highlight} className="flex gap-2.5">
                <span aria-hidden className="text-signal mt-px font-mono text-xs">
                  ▸
                </span>
                <span className="text-pretty">{highlight}</span>
              </li>
            ))}
          </ul>

          {role.techStack.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.techStack.map((tech) => (
                <Tag key={tech}>{tech}</Tag>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
