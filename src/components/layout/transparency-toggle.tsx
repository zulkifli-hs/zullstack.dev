"use client";

import { ChevronDown, Contrast } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { GlassControls } from "@/components/layout/glass-controls";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useTransparency } from "@/hooks/use-transparency";
import { cn } from "@/lib/utils";

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
  const tGlass = useTranslations("glass");
  const { mode, setMode } = useTransparency();
  const [advanced, setAdvanced] = useState(false);
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
        <div className="flex items-start justify-between gap-4">
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

        <div className="border-hairline/60 mt-4 border-t pt-3">
          <button
            type="button"
            onClick={() => setAdvanced((open) => !open)}
            aria-expanded={advanced}
            className={cn(
              "rounded-concentric flex w-full items-center gap-2 px-1 py-1.5 text-left text-sm font-medium",
              "hover:text-foreground text-muted-foreground transition-colors",
              "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:outline-none",
            )}
          >
            <ChevronDown
              aria-hidden
              className={cn("size-4 transition-transform", advanced && "rotate-180")}
            />
            {tGlass("advanced")}
          </button>

          {/* Mounted only when open: the controls subscribe to the lens registry
              and read localStorage, and there is no reason to pay for that on
              every page load for a panel most visitors never expand. */}
          {advanced && <GlassControls />}
        </div>
      </PopoverContent>
    </Popover>
  );
}
