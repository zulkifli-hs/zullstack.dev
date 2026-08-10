import type { Experience, ExperiencePosition, StoredImage } from "@/types/content";

/**
 * Reading helpers for the experience timeline.
 *
 * Everything here tolerates a document that has not been migrated yet: the read
 * layer folds a legacy single-position document into the new shape, but its
 * company still lives in a string rather than in a `Partner` reference.
 */

/** The company's name, whether it comes from the directory or the old field. */
export function companyName(entry: Experience): string {
  return entry.partner?.name || entry.company || "";
}

export function companyUrl(entry: Experience): string | undefined {
  return entry.partner?.url || entry.companyUrl || undefined;
}

export function companyLogo(entry: Experience): StoredImage | undefined {
  return entry.partner?.logo?.url ? entry.partner.logo : entry.logo?.url ? entry.logo : undefined;
}

/** Newest first — the order a CV is read in. */
export function sortedPositions(entry: Experience): ExperiencePosition[] {
  return [...entry.positions].sort(
    (a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime(),
  );
}

/**
 * Whole months from a start date to an end date (or today), counting the
 * starting month.
 */
export function monthsBetween(start: string | null, end: string | null): number {
  if (!start) return 0;

  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;

  return Math.max(0, months);
}

/**
 * Total time at a company, counting overlapping positions once.
 *
 * Summing each position would inflate exactly the case this restructure exists
 * for: a promotion that overlaps its predecessor by a month, or two titles held
 * at the same time, would report more time than was ever served. Intervals are
 * merged first, in months since epoch, which is the resolution the dates carry
 * anyway.
 */
export function tenureMonths(positions: ExperiencePosition[]): number {
  const now = new Date();
  const index = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const today = index(now);

  const spans = positions
    .filter((position) => position.startDate)
    .map((position) => {
      const from = index(new Date(position.startDate as string));
      const to = position.endDate ? index(new Date(position.endDate)) : today;
      return [from, Math.max(from, to)] as const;
    })
    .sort((a, b) => a[0] - b[0]);

  if (spans.length === 0) return 0;

  let total = 0;
  let [start, end] = spans[0];

  for (const [from, to] of spans.slice(1)) {
    // `from <= end + 1` treats "ended in March, started in April" as unbroken —
    // a promotion is continuous service, not a gap.
    if (from <= end + 1) end = Math.max(end, to);
    else {
      total += end - start + 1;
      [start, end] = [from, to];
    }
  }

  return total + end - start + 1;
}

/**
 * "6 yrs 1 mo", the way a CV states it.
 *
 * The labels are passed in rather than looked up here so this stays a pure
 * function that both server components and tests can call.
 */
export function formatTenure(
  months: number,
  labels: { years: (count: number) => string; months: (count: number) => string },
): string {
  if (months <= 0) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;

  return [years > 0 ? labels.years(years) : "", rest > 0 ? labels.months(rest) : ""]
    .filter(Boolean)
    .join(" ");
}
