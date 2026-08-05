"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  // next-intl's `usePathname` returns the current path *without* the locale
  // prefix and with dynamic segments already resolved, so switching is a replace
  // of the same route under a different locale — never string surgery on the URL.
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    // `replace`, not `push`: a language change is a correction of the current
    // view, and should not add a history entry the back button lands on.
    startTransition(() => router.replace(pathname, { locale: next }));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("language")} disabled={isPending}>
            <Languages className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {routing.locales.map((value) => (
          <DropdownMenuItem key={value} onClick={() => switchTo(value)}>
            <span className="lab-label w-6">{value}</span>
            {localeNames[value]}
            {locale === value && <span className="text-signal ml-auto">•</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
