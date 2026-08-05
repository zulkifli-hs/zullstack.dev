"use client";

import { Contrast } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useTransparency } from "@/hooks/use-transparency";

/**
 * Manual escape hatch from the glass material.
 *
 * Safari implements neither `prefers-reduced-transparency` nor any equivalent,
 * and macOS/iOS users with "Reduce Transparency" enabled are precisely the
 * people this site's aesthetic would otherwise fail. Without this control they
 * have no recourse at all, so it is a functional requirement rather than a nicety.
 */
export function TransparencyToggle() {
  const t = useTranslations("settings");
  const { mode, toggle } = useTransparency();
  const reduced = mode === "reduced";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={reduced}
      aria-label={reduced ? t("transparencyReduced") : t("transparencyOn")}
      title={t("transparencyHint")}
    >
      <Contrast className={reduced ? "text-signal size-4" : "size-4"} />
    </Button>
  );
}
