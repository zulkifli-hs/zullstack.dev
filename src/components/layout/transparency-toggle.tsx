"use client";

import { Contrast } from "lucide-react";
import { useTranslations } from "next-intl";

import { GlassControls } from "@/components/layout/glass-controls";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useTransparency } from "@/hooks/use-transparency";

/**
 * Manual escape hatch from the glass material, plus the material inspector.
 *
 * Safari implements neither `prefers-reduced-transparency` nor any equivalent,
 * and macOS/iOS users with "Reduce Transparency" enabled are precisely the
 * people this site's aesthetic would otherwise fail. Without this control they
 * have no recourse at all, so it is a functional requirement, not a nicety.
 *
 * That is also why the switch stays at the top, always visible, and the fifteen
 * material controls sit behind a collapsed disclosure. The accessibility
 * affordance must not have to be found among a wall of sliders.
 */
export function TransparencyToggle() {
  const t = useTranslations("settings");
  const { mode, setMode } = useTransparency();
  const reduced = mode === "reduced";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("transparency")}>
            <Contrast className={reduced ? "text-signal size-4" : "size-4"} />
          </Button>
        }
      />

      <PopoverContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
        {/* Theme sits above transparency because it is the coarser choice: the
            material behaves differently in each, so it is the setting a visitor
            reaches for first. It lives here rather than in the header capsule,
            which stays down to navigation and contact. */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{t("theme")}</span>
          <ThemeToggle className="-mr-2" />
        </div>

        <div className="border-hairline/60 mt-3 flex items-start justify-between gap-4 border-t pt-3">
          <label htmlFor="transparency-switch" className="text-sm font-medium">
            {t("transparency")}
          </label>
          <Switch
            id="transparency-switch"
            checked={!reduced}
            onCheckedChange={(checked) => setMode(checked ? "full" : "reduced")}
          />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">{t("transparencyHint")}</p>

        <GlassControls />
      </PopoverContent>
    </Popover>
  );
}
