"use client";

import { useMemo, useRef, useState } from "react";

import type { Point } from "@/lib/analytics/queries";

/**
 * Visitors and pageviews over time.
 *
 * **One axis, deliberately.** Both series are counts of the same kind, so they
 * share a scale — and a second y-axis is the single most misleading thing a
 * chart can do, because the crossing point where one line overtakes the other
 * becomes an artefact of two arbitrary scales rather than a fact about the
 * data. Pageviews are always ≥ visitors, and on a shared axis you can see that.
 *
 * Plain SVG rather than a charting library: two lines, a grid and a crosshair
 * is less code than the adapter would be, and it adds nothing to the bundle.
 */

const W = 840;
const H = 220;
const PAD = { top: 12, right: 12, bottom: 22, left: 34 };

export function TrendChart({
  points,
  labels,
}: {
  points: Point[];
  labels: { visitors: string; pageviews: string };
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const { x, y, paths, ticks } = useMemo(() => {
    const peak = Math.max(1, ...points.map((p) => Math.max(p.visitors, p.pageviews)));
    // Round the ceiling up to something a person would choose, so gridline
    // labels read 40/30/20/10 rather than 37/27.75/18.5.
    const step = Math.pow(10, Math.floor(Math.log10(peak)));
    const max = Math.ceil(peak / step) * step || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

    const line = (key: "visitors" | "pageviews") =>
      points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");

    return {
      max,
      x,
      y,
      paths: { visitors: line("visitors"), pageviews: line("pageviews") },
      ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)),
    };
  }, [points]);

  const active = hover === null ? null : points[hover];

  const onMove = (event: React.PointerEvent) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box || points.length === 0) return;
    // Map the pointer back through the viewBox rather than using pixel offsets,
    // because the SVG is scaled to whatever width the column happens to be.
    const svgX = ((event.clientX - box.left) / box.width) * W;
    const ratio = (svgX - PAD.left) / (W - PAD.left - PAD.right);
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };

  return (
    <div className="relative" ref={frame}>
      {/* Two series, so a legend is mandatory — identity is never colour alone. */}
      <div className="text-muted-foreground mb-3 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-chart-1 size-2.5 rounded-full" />
          {labels.visitors}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-chart-2 size-2.5 rounded-full" />
          {labels.pageviews}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`${labels.visitors} and ${labels.pageviews} over time`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {/* Recessive grid: it orients, it does not compete. */}
        {ticks.map((value) => (
          <g key={value}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(value)}
              y2={y(value)}
              className="stroke-hairline"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={PAD.left - 6}
              y={y(value) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px] tabular"
            >
              {value}
            </text>
          </g>
        ))}

        {active && (
          <line
            x1={x(hover!)}
            x2={x(hover!)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            className="stroke-muted-foreground/40"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* 2px strokes, held at 2px whatever the SVG is scaled to. */}
        <path d={paths.pageviews} fill="none" className="stroke-chart-2" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={paths.visitors} fill="none" className="stroke-chart-1" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {active && (
          <>
            {/* A 2px surface ring keeps the marker readable where the two
                lines overlap. */}
            <circle cx={x(hover!)} cy={y(active.pageviews)} r={4.5} className="fill-chart-2 stroke-background" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover!)} cy={y(active.visitors)} r={4.5} className="fill-chart-1 stroke-background" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </>
        )}

        {/* First and last date only — a label under every point is noise. */}
        {points.length > 0 && (
          <>
            <text x={PAD.left} y={H - 6} className="fill-muted-foreground text-[9px]">
              {points[0].date.slice(5)}
            </text>
            <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-muted-foreground text-[9px]">
              {points[points.length - 1].date.slice(5)}
            </text>
          </>
        )}
      </svg>

      {active && (
        <div
          className="border-hairline bg-popover pointer-events-none absolute top-8 rounded-lg border px-3 py-2 text-xs shadow-lg"
          style={{
            // Flip to the left of the crosshair past the midpoint so the
            // tooltip never runs off the right edge.
            left: `${(x(hover!) / W) * 100}%`,
            transform: hover! > points.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
        >
          <p className="font-mono text-[0.6875rem]">{active.date}</p>
          <p className="mt-1.5 flex items-center gap-1.5">
            <span className="bg-chart-1 size-2 rounded-full" />
            <span className="tabular font-medium">{active.visitors}</span>
            <span className="text-muted-foreground">{labels.visitors}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1.5">
            <span className="bg-chart-2 size-2 rounded-full" />
            <span className="tabular font-medium">{active.pageviews}</span>
            <span className="text-muted-foreground">{labels.pageviews}</span>
          </p>
        </div>
      )}
    </div>
  );
}
