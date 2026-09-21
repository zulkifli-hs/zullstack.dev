/**
 * The dashboard's time windows.
 *
 * Split out of `queries.ts` because the range picker is a Client Component and
 * needs `RANGES` as a *value*. `queries.ts` is `server-only` and imports
 * Mongoose, so importing it from the picker pulled the driver toward the
 * browser bundle — which is precisely the build error `server-only` exists to
 * produce. None of this needs a server: it is date arithmetic.
 */

export type Range = { from: Date; to: Date };

/** Named windows the dashboard offers, in days. */
export const RANGES = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12mo": 365,
} as const;

export type RangeKey = keyof typeof RANGES;

export function resolveRange(key: string | undefined): {
  key: RangeKey;
  range: Range;
  previous: Range;
} {
  const resolved: RangeKey = key && key in RANGES ? (key as RangeKey) : "30d";
  const days = RANGES[resolved];
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  // Same length, immediately before — so "vs previous" compares like with like
  // rather than against a calendar month of a different number of days.
  const previous = { from: new Date(from.getTime() - days * 24 * 60 * 60 * 1000), to: from };
  return { key: resolved, range: { from, to }, previous };
}
