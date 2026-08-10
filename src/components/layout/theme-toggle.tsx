"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useHydrated } from "@/hooks/use-hydrated";
import { Button } from "@/components/ui/button";

/**
 * Light or dark, in one click.
 *
 * Was a three-item dropdown including System. Two of those options are the same
 * gesture — this site is dark by default and light is the deliberate exception
 * — so a menu asked for two clicks to express one preference. System is gone
 * with it: `defaultTheme="dark"` and `enableSystem={false}` mean the site has
 * an opinion, and a visitor's OS setting no longer silently overrides it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("settings");
  const { resolvedTheme, setTheme } = useTheme();

  // The active theme lives in localStorage, so the server cannot know it. Any
  // pre-hydration render of the icon would be a guess that mismatches.
  const mounted = useHydrated();
  const dark = !mounted || resolvedTheme !== "light";

  // Labelled by where it goes, not by where it is — the icon shows the
  // destination, so the accessible name has to agree with it.
  const next = dark ? t("themeLight") : t("themeDark");

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={next}
      title={next}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
