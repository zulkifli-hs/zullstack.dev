import { AdminShell } from "@/components/admin/admin-shell";
import { BreakdownCard } from "@/components/admin/analytics/breakdown-card";
import { RangePicker } from "@/components/admin/analytics/range-picker";
import { StatTile } from "@/components/admin/analytics/stat-tile";
import { TrendChart } from "@/components/admin/analytics/trend-chart";
import { analyticsDisabledReason } from "@/lib/analytics/env";
import { compact } from "@/lib/analytics/format";
import {
  getBreakdown,
  getEvents,
  getExitPages,
  getKpis,
  getRealtime,
  getSeries,
  resolveRange,
} from "@/lib/analytics/queries";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata = { title: "Analytics" };

/** "1m 42s" — an average visit is a duration, not a count of milliseconds. */
function duration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  return minutes > 0 ? `${minutes}m ${total % 60}s` : `${total}s`;
}

/** Percentage-point change against the previous period of equal length. */
function delta(now: number, before: number): string | undefined {
  if (!before) return undefined;
  const change = ((now - before) / before) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(0)}% vs previous`;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireAdmin();
  const { range: key } = await searchParams;
  const { key: active, range, previous } = resolveRange(key);

  // One round of parallel reads. Each is an independent aggregation, so
  // awaiting them in sequence would just add their latencies together.
  const [kpis, prior, series, realtime, pages, entries, exits, sources, countries, browsers, systems, devices, utm, events] =
    await Promise.all([
      getKpis(range),
      getKpis(previous),
      getSeries(range),
      getRealtime(),
      getBreakdown(range, "path"),
      getBreakdown(range, "path", { match: { isEntry: true } }),
      getExitPages(range),
      getBreakdown(range, "source", { match: { isEntry: true } }),
      getBreakdown(range, "country"),
      getBreakdown(range, "browser"),
      getBreakdown(range, "os"),
      getBreakdown(range, "deviceType"),
      getBreakdown(range, "utm.source"),
      getEvents(range),
    ]);

  const disabled = analyticsDisabledReason();

  return (
    <AdminShell email={session.user.email}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Cookieless, self-hosted. {realtime} visitor{realtime === 1 ? "" : "s"} in the last 5
            minutes.
          </p>
        </div>
        <RangePicker value={active} />
      </div>

      {/* Collection failing is indistinguishable from an empty site unless the
          page says which one it is looking at. */}
      {disabled && (
        <div className="border-signal/40 bg-signal/5 mt-6 rounded-lg border px-4 py-3 text-sm">
          <span className="lab-label text-signal">collection off</span>
          <p className="mt-1.5">
            Nothing is being recorded — the figures below are historical. {disabled}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Unique visitors"
          value={compact(kpis.visitors)}
          hint={delta(kpis.visitors, prior.visitors)}
        />
        <StatTile
          label="Pageviews"
          value={compact(kpis.pageviews)}
          hint={delta(kpis.pageviews, prior.pageviews)}
        />
        <StatTile label="Sessions" value={compact(kpis.sessions)} hint={delta(kpis.sessions, prior.sessions)} />
        <StatTile label="Views / visit" value={kpis.viewsPerVisit.toFixed(1)} />
        <StatTile label="Bounce rate" value={`${kpis.bounceRate.toFixed(0)}%`} />
        <StatTile label="Avg. visit" value={duration(kpis.avgDurationMs)} />
      </div>

      <section className="border-hairline mt-6 rounded-xl border p-4">
        <TrendChart points={series} labels={{ visitors: "Visitors", pageviews: "Pageviews" }} />
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BreakdownCard title="Top pages" rows={pages} unit="visitors" empty="No pageviews yet." />
        <BreakdownCard title="Traffic sources" rows={sources} unit="visitors" empty="No referrals yet." />
        <BreakdownCard title="Entry pages" rows={entries} unit="visitors" empty="No sessions yet." />
        <BreakdownCard title="Exit pages" rows={exits} unit="sessions" empty="No sessions yet." />
        <BreakdownCard title="Countries" rows={countries} unit="visitors" empty="No geo data — Vercel sets these headers only on a deployment." />
        <BreakdownCard title="Devices" rows={devices} unit="visitors" empty="No visits yet." />
        <BreakdownCard title="Browsers" rows={browsers} unit="visitors" empty="No visits yet." />
        <BreakdownCard title="Operating systems" rows={systems} unit="visitors" empty="No visits yet." />
        <BreakdownCard title="UTM sources" rows={utm} unit="visitors" empty="No campaign traffic yet." />

        <section className="border-hairline rounded-xl border p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold tracking-tight">Events</h2>
            <span className="lab-label text-muted-foreground">count</span>
          </div>

          {events.length === 0 ? (
            <p className="text-muted-foreground mt-4 text-sm">No events yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {events.map((event) => (
                <li key={event.name}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm font-medium">{event.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {event.visitors} visitor{event.visitors === 1 ? "" : "s"}
                    </span>
                    <span className="tabular ml-auto text-sm font-medium">{event.count}</span>
                  </div>
                  {event.props.length > 0 && (
                    <ul className="border-hairline/60 mt-1.5 space-y-1 border-l pl-3">
                      {event.props.map((prop) => (
                        <li key={prop.label} className="flex items-baseline gap-3 text-xs">
                          <span className="text-muted-foreground min-w-0 truncate" title={prop.label}>
                            {prop.label}
                          </span>
                          <span className="tabular ml-auto">{prop.visitors}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
