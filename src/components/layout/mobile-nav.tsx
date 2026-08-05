"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

const NAV_ITEMS = [
  { href: "/projects", key: "projects" },
  { href: "/experience", key: "experience" },
  { href: "/mentoring", key: "mentoring" },
  { href: "/articles", key: "articles" },
  { href: "/testimonials", key: "testimonials" },
  { href: "/resources", key: "resources" },
  { href: "/open-source", key: "openSource" },
  { href: "/playground", key: "playground" },
] as const;

export function MobileNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("menu")}>
            <Menu className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {NAV_ITEMS.map(({ href, key }) => (
          // `render` hands the menu item's behaviour to the Link, so keyboard
          // navigation and route prefetching both keep working.
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            {t(key)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
