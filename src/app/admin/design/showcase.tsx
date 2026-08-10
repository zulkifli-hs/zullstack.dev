"use client";

import { Bell, Heart, Play, Search, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * The busy substrate the glass sits on.
 *
 * This matters more than it looks: refraction is only visible when there is
 * structure behind it to bend. Apple demos Liquid Glass over photographs and
 * dense UI for exactly this reason — over a flat fill, a lens and a tinted box
 * are the same picture.
 */
function Backdrop({ variant }: { variant: "grid" | "photo" | "type" }) {
  if (variant === "grid") {
    return (
      <div className="absolute inset-0 [background-size:16px_16px] [background-image:linear-gradient(oklch(1_0_0/0.16)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.16)_1px,transparent_1px)]" />
    );
  }
  if (variant === "type") {
    return (
      <div className="absolute inset-0 overflow-hidden p-4 font-mono text-[11px] leading-[1.35] text-white/45">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="whitespace-nowrap">
            {"const refract = (n1, n2, θ) => Math.asin(Math.sin(θ) * n1 / n2);  "}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="absolute inset-0">
      <div className="absolute -top-10 left-10 size-56 rounded-full bg-[oklch(0.72_0.19_25)] blur-xl" />
      <div className="absolute top-20 left-1/2 size-64 rounded-full bg-[oklch(0.78_0.2_140)] blur-xl" />
      <div className="absolute -bottom-10 right-8 size-56 rounded-full bg-[oklch(0.7_0.22_265)] blur-xl" />
      <div className="absolute top-8 right-1/3 size-40 rounded-full bg-[oklch(0.85_0.19_85)] blur-xl" />
    </div>
  );
}

function Stage({
  title,
  note,
  variant = "grid",
  className,
  children,
}: {
  title: string;
  note?: string;
  variant?: "grid" | "photo" | "type";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {note && <p className="text-muted-foreground mt-1 max-w-prose text-xs">{note}</p>}
      </div>
      <div
        className={cn(
          "border-hairline relative overflow-hidden rounded-2xl border bg-[oklch(0.28_0.05_265)] p-8",
          className,
        )}
      >
        <Backdrop variant={variant} />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}

export function DesignShowcase() {
  const [volume, setVolume] = useState(38);
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-4xl space-y-10 pb-16">
      <header>
        <p className="lab-label text-signal">{"// liquid glass"}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Liquid Glass</h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Each surface below is a real lens, not a blur: a generated displacement map bends the
          backdrop at the rim following Snell&rsquo;s law, and a separate specular map adds a rim
          light whose brightness depends on the angle between the surface normal and a fixed
          light. Look at the <em>edges</em> — straight lines behind the glass should visibly bow.
        </p>
        <p className="text-muted-foreground mt-2 max-w-prose text-xs">
          Refraction is Chromium-only. In Safari and Firefox every panel here falls back to blur
          plus rim and sheen, which is intentional — it should look plainer, never broken.
        </p>
      </header>

      <Stage
        title="Bevel profiles"
        note="The profile is the whole character of the material. Convex reads as a dome, squircle softens the flat→curve transition, lip is convex outside and concave in the middle — a groove rather than a bump."
      >
        <div className="flex flex-wrap items-center gap-6">
          {[
            ["squircle", "glass-lens", "card"],
            ["convex (thumb)", "glass-lens lens-thumb", "thumb"],
            ["lip (switch)", "glass-lens lens-switch", "switch"],
          ].map(([label, cls]) => (
            <div key={label} className="space-y-2">
              <div
                data-surface="lens"
                className={cn("glass surface-md size-28", cls)}
                style={{ ["--tier-blur" as string]: "0.6" }}
              />
              <p className="lab-label text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        title="Card"
        variant="photo"
        note="Over colour, the rim bends the boundaries between the blobs. This is the clearest demonstration that the edge is a lens: the shapes behind it are displaced, not merely softened."
      >
        <div className="flex flex-wrap gap-6">
          <GlassPanel
            variant="lens"
            tier="md"
            padding="md"
            interactive
            grain
            className="lens-card w-[360px]"
          >
            <p className="lab-label text-signal">{"// builds"}</p>
            <h3 className="mt-3 text-lg font-semibold">SAMAN</h3>
            <p className="mt-2 text-sm font-medium">
              Anti-fraud monitoring for the Ministry of Culture.
            </p>
            <div className="mt-4 flex gap-1.5">
              <Badge shape="tag">Next.js</Badge>
              <Badge shape="tag">SSE</Badge>
            </div>
          </GlassPanel>

          <Card tier="md" padding="md" className="w-[280px]">
            <p className="lab-label text-muted-foreground">flat — content layer</p>
            <p className="mt-3 text-sm">
              No backdrop-filter. Apple is explicit that glass does not belong on content, and a
              grid of blurred cards is the documented cause of dropped frames.
            </p>
          </Card>
        </div>
      </Stage>

      <Stage
        title="Buttons"
        variant="type"
        note="Over text, refraction is unmistakable — glyphs behind the rim shift and stretch. Hover and press to see the lift: tint drops, the rim brightens, the shadow deepens. The blur itself never animates."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="glassProminent" size="pill" className="glass-lens lens-pill">
            Primary action
          </Button>
          <Button variant="glass" size="pill" className="glass-lens lens-pill">
            <Heart className="size-4" />
            Secondary
          </Button>
          <Button variant="glass" size="icon-lg" className="glass-lens">
            <Bell className="size-4" />
          </Button>
        </div>
      </Stage>

      <Stage
        title="Search field"
        variant="type"
        note="A pill-shaped lens. The map is authored at the pill's own geometry — stretching a square map across a wide element distorts the bevel, which is why each shape gets its own."
      >
        <div
          data-surface="lens"
          className="glass glass-lens lens-pill surface-md flex h-11 w-full max-w-md items-center gap-3 px-4 [--surface-radius:9999px]"
        >
          <Search className="size-4 shrink-0 text-white/70" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects and articles…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/50"
          />
        </div>
      </Stage>

      <Stage
        title="Switch and slider"
        note="Which part carries the material is a decision, not a default. The switch track is glass and the thumb stays solid — a blurred 24px circle is invisible. The slider inverts it: the thumb is glass so the track can stay crisp, because blurring the track would destroy the value indication that is its entire job."
      >
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <Switch defaultChecked className="glass-lens lens-switch" />
            <Switch className="glass-lens lens-switch" />
          </div>

          <div className="w-64">
            <Slider
              value={volume}
              onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
            />
            <p className="lab-label mt-2 text-white/60">volume {volume}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-white">
            <Checkbox defaultChecked /> Checkbox
          </label>
        </div>
      </Stage>

      <Stage
        title="Grouped controls"
        variant="photo"
        note="One backdrop-filter on the container, flat items inside. Apple's GlassEffectContainer exists because glass cannot sample other glass; here the cascade guard enforces the same rule — nest a glass surface and its blur is stripped automatically."
      >
        <div className="flex flex-wrap items-center gap-6">
          <div
            data-surface="lens"
            className="glass glass-lens lens-pill surface-md flex items-center gap-1 p-1.5 [--surface-radius:9999px]"
          >
            <Button variant="ghost" size="icon" className="text-white [--surface-radius:9999px]">
              <SkipBack className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-lg" className="text-white [--surface-radius:9999px]">
              <Play className="size-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white [--surface-radius:9999px]">
              <SkipForward className="size-4" />
            </Button>
          </div>

          <Segmented defaultValue={["week"]} className="glass-lens">
            <SegmentedItem value="day">Day</SegmentedItem>
            <SegmentedItem value="week">Week</SegmentedItem>
            <SegmentedItem value="month">Month</SegmentedItem>
          </Segmented>
        </div>
      </Stage>

      <Stage
        title="Legibility limit"
        variant="photo"
        note="The honest boundary. Light text on glass over bright content needs roughly 0.6 tint alpha to clear WCAG AA — at which point it is a smoked panel, not glass. This is why Apple ships an opacity control, and why body copy on this site never sits on glass."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[0.15, 0.35, 0.6].map((alpha) => (
            <div
              key={alpha}
              data-surface="glass"
              className="glass surface-md p-4"
              style={{ ["--glass-tint-base" as string]: `${alpha * 100}%` }}
            >
              <p className="text-sm font-medium text-white">tint {alpha}</p>
              <p className="mt-1 text-xs text-white/80">
                {alpha < 0.6 ? "fails AA on bright" : "passes AA"}
              </p>
            </div>
          ))}
        </div>
      </Stage>
    </div>
  );
}
