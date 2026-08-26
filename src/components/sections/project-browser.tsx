"use client";

import { ListFilter, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";

import { ListingPage } from "@/components/lab/page-shell";
import { EmptyState } from "@/components/lab/section";
import { ProjectCard } from "@/components/sections/project-grid";
import { BadgeButton } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import type { Locale } from "@/i18n/routing";
import { LIFECYCLES, PLATFORMS, type Lifecycle, type Platform } from "@/lib/content-enums";
import { CATEGORY_ICONS, categoryFacets } from "@/lib/project-category";
import { pick } from "@/lib/utils";
import type { Project, ProjectCategory } from "@/types/content";

const SORTS = ["featured", "newest", "oldest", "az", "za"] as const;
type Sort = (typeof SORTS)[number];

const ALL = "all";

/**
 * When a project happened, for sorting.
 *
 * `year` is the primary key because every project has one and it is the figure
 * printed on the card — sorting by a date that disagrees with the visible year
 * looks like a bug even when it is more precise. The dates only break ties,
 * which is what separates two projects from the same year.
 */
function ordinal(project: Project): [number, number] {
  const date = project.startDate ?? project.endDate;
  return [project.year, date ? Date.parse(date) : 0];
}

/**
 * The listing page, with its own controls.
 *
 * This owns the page frame rather than being handed to `ListingPage` by the
 * route, because the filter button lives at the end of the *title row* and the
 * results live below it — one piece of state, two places on the page, either
 * side of a Server Component boundary if the route kept the frame. Rendering
 * the frame from in here is what lets both read the same `useState`.
 *
 * The controls collapse into a dialog rather than sitting in a toolbar: four
 * of them on a page with thirteen results is more chrome than content. What
 * stays visible is one button, its active-filter count, and — only when
 * something is actually narrowed — a reset.
 *
 * Filtering runs client-side over the full list. That is a decision the data
 * size earns: there are fourteen projects and the page is statically
 * prerendered, so every one of them is already in the payload. Filtering them
 * in the browser costs nothing and works instantly; a server round trip would
 * have to give up the prerender to buy nothing. It is also why there is no
 * pagination and no search — both are answers to a list too long to look at,
 * and this one is not. When it is, the filter state moves into the URL and the
 * sort moves back into Mongo, where `PROJECT_SORT` already lives.
 */
export function ProjectBrowser({ items, locale }: { items: Project[]; locale: Locale }) {
  const t = useTranslations("sections.projects");

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ProjectCategory | typeof ALL>(ALL);
  const [platform, setPlatform] = useState<Platform | typeof ALL>(ALL);
  const [lifecycle, setLifecycle] = useState<Lifecycle | typeof ALL>(ALL);
  const [sort, setSort] = useState<Sort>("featured");

  // Facets come from the projects on the page, so a category, platform or
  // status nobody has used never renders a control that filters down to nothing.
  const categories = useMemo(() => categoryFacets(items), [items]);

  const platforms = useMemo(
    () => PLATFORMS.filter((value) => items.some((item) => item.platforms.includes(value))),
    [items],
  );

  const lifecycles = useMemo(
    () => LIFECYCLES.filter((value) => items.some((item) => item.lifecycle === value)),
    [items],
  );

  const shown = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        (category === ALL || item.category === category) &&
        (platform === ALL || item.platforms.includes(platform)) &&
        (lifecycle === ALL || item.lifecycle === lifecycle),
    );

    // `featured` is the order the query layer already returned — featured, then
    // manual order, then year. Re-sorting for it would only risk disagreeing
    // with `PROJECT_SORT`, which the detail page's "other projects" also uses.
    if (sort === "featured") return filtered;

    const sorted = [...filtered];

    if (sort === "az" || sort === "za") {
      const direction = sort === "az" ? 1 : -1;
      sorted.sort(
        (a, b) => direction * pick(a.title, locale).localeCompare(pick(b.title, locale), locale),
      );
      return sorted;
    }

    const direction = sort === "newest" ? -1 : 1;
    sorted.sort((a, b) => {
      const [yearA, dateA] = ordinal(a);
      const [yearB, dateB] = ordinal(b);
      return direction * (yearA - yearB || dateA - dateB);
    });
    return sorted;
  }, [items, category, platform, lifecycle, sort, locale]);

  // Counted, not just flagged: the number is the whole point of the marker —
  // "something is filtered" sends you into the dialog to find out what, and
  // "2" tells you how much to expect to undo.
  const activeFilters =
    Number(category !== ALL) + Number(platform !== ALL) + Number(lifecycle !== ALL);

  // Sort is deliberately outside that count — it is always set to something, so
  // it can never be "active". It still counts as a change worth offering to
  // undo, which is why reset watches it too.
  const isDirty = activeFilters > 0 || sort !== "featured";

  const reset = () => {
    setCategory(ALL);
    setPlatform(ALL);
    setLifecycle(ALL);
    setSort("featured");
  };

  return (
    <ListingPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      isEmpty={items.length === 0}
      emptyMessage={t("empty")}
      action={
        <>
          {isDirty && (
            <Button variant="ghost" size="lg" onClick={reset}>
              <RotateCcw />
              {t("browse.reset")}
            </Button>
          )}

          <Button variant="glass" size="lg" onClick={() => setOpen(true)}>
            <ListFilter />
            {t("browse.filters")}
            {activeFilters > 0 && (
              <>
                {/* The numeral is decoration as far as the accessibility tree
                    is concerned, and the sentence beside it is the real label.
                    An `aria-label` on the badge itself would not have worked:
                    ARIA does not name a bare `span`, so it would have been
                    dropped and read into the button as "Filter 2". */}
                <span
                  aria-hidden
                  className="bg-signal text-background tabular ml-0.5 inline-flex size-4.5 items-center justify-center rounded-full text-[0.6875rem] font-semibold"
                >
                  {activeFilters}
                </span>
                <span className="sr-only">
                  {t("browse.activeFilters", { count: activeFilters })}
                </span>
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="lab-label text-muted-foreground" aria-live="polite">
          {t("browse.results", { count: shown.length })}
        </p>

        {shown.length === 0 ? (
          <EmptyState message={t("browse.noMatch")} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((project) => (
              <ProjectCard key={project.id} project={project} locale={locale} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            {t("browse.dialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1.5 pr-8 text-sm text-pretty">
            {t("browse.dialogDescription")}
          </DialogDescription>

          {/* Domain first, and as chips rather than a fourth dropdown: it is the
              filter people actually reach for, and the icons make the vocabulary
              legible before anyone has read a single label. */}
          <Group label={t("browse.category")} className="mt-6">
            <div className="flex flex-wrap gap-2">
              <BadgeButton
                aria-pressed={category === ALL}
                tone={category === ALL ? "signal" : "neutral"}
                onClick={() => setCategory(ALL)}
              >
                {t("browse.categoryAll")}
                <span className="tabular opacity-60">{items.length}</span>
              </BadgeButton>

              {categories.map(({ category: value, count }) => {
                const Icon = CATEGORY_ICONS[value];
                const active = category === value;

                return (
                  <BadgeButton
                    key={value}
                    aria-pressed={active}
                    tone={active ? "signal" : "neutral"}
                    onClick={() => setCategory(active ? ALL : value)}
                  >
                    <Icon aria-hidden className="size-3.5" />
                    {t(`category.${value}`)}
                    <span className="tabular opacity-60">{count}</span>
                  </BadgeButton>
                );
              })}
            </div>
          </Group>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Group label={t("browse.platform")} inline>
              <NativeSelect
                value={platform}
                onChange={(event) => setPlatform(event.target.value as Platform | typeof ALL)}
              >
                <option value={ALL}>{t("browse.platformAll")}</option>
                {platforms.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </NativeSelect>
            </Group>

            <Group label={t("browse.lifecycleLabel")} inline>
              <NativeSelect
                value={lifecycle}
                onChange={(event) => setLifecycle(event.target.value as Lifecycle | typeof ALL)}
              >
                <option value={ALL}>{t("browse.lifecycleAll")}</option>
                {lifecycles.map((value) => (
                  <option key={value} value={value}>
                    {t(`lifecycle.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </Group>

            <Group label={t("browse.sort")} inline className="sm:col-span-2">
              <NativeSelect
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
              >
                {SORTS.map((value) => (
                  <option key={value} value={value}>
                    {t(`sort.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </Group>
          </div>

          <div className="border-hairline/60 mt-6 flex items-center justify-between gap-3 border-t pt-4">
            {/* The count is repeated in here because the results are behind the
                dialog: filtering applies as you click, and without this the only
                feedback would be a number you cannot see. */}
            <p className="lab-label text-muted-foreground" aria-live="polite">
              {t("browse.results", { count: shown.length })}
            </p>

            <div className="flex items-center gap-2">
              {isDirty && (
                <Button variant="ghost" size="lg" onClick={reset}>
                  <RotateCcw />
                  {t("browse.reset")}
                </Button>
              )}
              <DialogClose
                render={
                  <Button variant="glassProminent" size="lg">
                    {t("browse.done")}
                  </Button>
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ListingPage>
  );
}

/** One labelled block of controls in the dialog. */
function Group({
  label,
  children,
  inline = false,
  className,
}: {
  label: string;
  children: ReactNode;
  /** Wraps the label around the control, for a single input. */
  inline?: boolean;
  className?: string;
}) {
  const Tag = inline ? "label" : "div";

  return (
    <Tag className={className}>
      <span className="lab-label text-muted-foreground mb-2 block">{label}</span>
      {children}
    </Tag>
  );
}
