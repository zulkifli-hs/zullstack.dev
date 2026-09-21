import type { Row } from "@/lib/analytics/queries";

/**
 * One dimension, as a ranked list with the bar drawn behind the label.
 *
 * The bar is a magnitude cue inside a table, not a chart — which is why it is
 * a single colour rather than a palette: nine tables each cycling five hues
 * would attach meaning to a colour that carries none. The number stays visible
 * beside every row, so the encoding is never length alone.
 */
export function BreakdownCard({
  title,
  rows,
  empty,
  unit,
}: {
  title: string;
  rows: Row[];
  empty: string;
  unit: string;
}) {
  const peak = Math.max(1, ...rows.map((row) => row.visitors));

  return (
    <section className="border-hairline rounded-xl border p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <span className="lab-label text-muted-foreground">{unit}</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-1">
          {rows.map((row) => (
            <li key={row.label} className="relative">
              <div className="hover:bg-secondary/40 relative flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors">
                {/* Anchored to the left baseline, with a 4px rounded data-end. */}
                <span
                  aria-hidden
                  className="bg-chart-1/18 absolute inset-y-0 left-0 rounded-r-[4px]"
                  style={{ width: `${Math.max(2, (row.visitors / peak) * 100)}%` }}
                />
                <span className="relative min-w-0 flex-1 truncate text-sm" title={row.label}>
                  {row.label}
                </span>
                <span className="tabular relative text-sm font-medium">{row.visitors}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
