"use client";

import { Contrast } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useTransparency } from "@/hooks/use-transparency";

/**
 * Manual escape hatch from the glass material.
 *
 * Safari implements neither `prefers-reduced-transparency` nor any equivalent,
 * and macOS/iOS users with "Reduce Transparency" enabled are precisely the
 * people this site's aesthetic would otherwise fail. Without this control they
 * have no recourse at all, so it is a functional requirement, not a nicety.
 *
 * Previously a bare icon button whose only affordance was a `title` attribute —
 * invisible on touch and to screen readers that do not announce titles. Now a
 * labelled switch in a popover, so what it does is legible before you press it.
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

      <PopoverContent align="end" className="w-64">
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
      </PopoverContent>
    </Popover>
  );
}
