import { cn } from "@/lib/utils";

/**
 * One headline number.
 *
 * A Server Component: it has no state and no handlers, so it has no reason to
 * ship JavaScript. It used to be exported from `trend-chart.tsx`, which made it
 * a client component by association.
 */
export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-hairline rounded-xl border p-4", className)}>
      <p className="lab-label text-muted-foreground">{label}</p>
      <p className="tabular mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 font-mono text-xs">{hint}</p>}
    </div>
  );
}
