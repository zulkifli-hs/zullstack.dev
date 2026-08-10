"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { useGlassParams } from "@/hooks/use-glass-params";
import { PRESETS, RANGES, type GlassParams } from "@/lib/glass/lens-params";
import { PROFILES, type Profile } from "@/lib/glass/lens-math";

/** Applies instantly — a custom property and a repaint in the same frame. */
const CSS_KEYS = [
  "blur",
  "opacity",
  "saturation",
  "brightness",
  "rim",
  "shadow",
  "sheen",
  "grain",
] as const;

/** Rebuilds ray-traced displacement maps in a worker. Commits on release. */
const MAP_KEYS = [
  "bevel",
  "thickness",
  "ior",
  "specularAngle",
  "specularOpacity",
  "specularSaturation",
] as const;

type ParamKey = keyof typeof RANGES;

/**
 * The material inspector.
 *
 * Grouped by *cost*, not by topic, because that is the thing a reader has to
 * know. The first group is a CSS custom property: it repaints in the frame you
 * drag it. The second re-runs Snell's law over every pixel of a displacement
 * map in a worker, tens of milliseconds per distinct geometry — so those commit
 * on pointer release rather than per frame. Presenting both as one undifferen-
 * tiated list of sliders would make the second group feel broken.
 */
export function GlassControls() {
  const t = useTranslations("glass");
  const { params, setParams, reset } = useGlassParams();

  return (
    <div className="mt-4 space-y-5">
      <section className="space-y-2">
        <p className="lab-label text-muted-foreground">{t("presets")}</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => setParams(preset.params)}
            >
              {t(`preset.${preset.id}`)}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={reset} aria-label={t("reset")}>
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <p className="lab-label text-muted-foreground">{t("profile")}</p>
        <Segmented
          value={[params.profile]}
          onValueChange={(value) => {
            const next = (Array.isArray(value) ? value[0] : value) as Profile | undefined;
            if (next) setParams({ profile: next });
          }}
          className="flex w-full"
        >
          {PROFILES.map((profile) => (
            <SegmentedItem key={profile} value={profile} className="flex-1 px-2 text-xs">
              {t(`profileName.${profile}`)}
            </SegmentedItem>
          ))}
        </Segmented>
        <p className="text-muted-foreground text-xs">{t("profileHint")}</p>
      </section>

      <section className="space-y-3">
        <p className="lab-label text-muted-foreground">{t("light")}</p>
        {CSS_KEYS.map((key) => (
          <ParamSlider key={key} name={key} params={params} onChange={setParams} live label={t(`param.${key}`)} />
        ))}
      </section>

      <section className="space-y-3">
        <div>
          <p className="lab-label text-muted-foreground">{t("geometry")}</p>
          <p className="text-muted-foreground mt-1 text-xs">{t("geometryHint")}</p>
        </div>
        {MAP_KEYS.map((key) => (
          <ParamSlider key={key} name={key} params={params} onChange={setParams} label={t(`param.${key}`)} />
        ))}
      </section>
    </div>
  );
}

function ParamSlider({
  name,
  label,
  params,
  onChange,
  live = false,
}: {
  name: ParamKey;
  label: string;
  params: GlassParams;
  onChange: (next: Partial<GlassParams>) => void;
  /** Commit on every frame. Only for parameters that are just a repaint. */
  live?: boolean;
}) {
  const range = RANGES[name];
  const committed = params[name] as number;

  // Local value keeps the handle and the readout following the pointer even
  // when the expensive commit is deferred to release.
  const [draft, setDraft] = useState(committed);

  // Re-sync when the value changes from *outside* the slider — a preset, or
  // Reset. Adjusting state during render rather than in an effect: React
  // re-runs this component immediately without painting the stale value, where
  // an effect would paint the old handle position for a frame first.
  const [lastCommitted, setLastCommitted] = useState(committed);
  if (committed !== lastCommitted) {
    setLastCommitted(committed);
    setDraft(committed);
  }

  const value = live ? committed : draft;
  const single = (v: number | readonly number[]) => (Array.isArray(v) ? v[0] : (v as number));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-muted-foreground tabular font-mono text-[0.6875rem]">
          {Number(value.toFixed(2))}
        </span>
      </div>
      <Slider
        aria-label={label}
        value={value}
        min={range.min}
        max={range.max}
        step={range.step}
        onValueChange={(next) => {
          const v = single(next);
          if (live) onChange({ [name]: v } as Partial<GlassParams>);
          else setDraft(v);
        }}
        onValueCommitted={
          live ? undefined : (next) => onChange({ [name]: single(next) } as Partial<GlassParams>)
        }
      />
    </div>
  );
}
