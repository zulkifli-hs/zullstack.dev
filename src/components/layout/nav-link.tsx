"use client";

import type { ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * A capsule nav item with an active pill, as in the reference designs.
 *
 * The active pill is FLAT — a tint, not a second backdrop-filter. It sits
 * visually on top of the header's glass, and glass over glass is exactly what
 * Apple rules out. The cascade guard cannot catch this one either: the header's
 * blur lives on an absolutely-positioned *sibling* layer rather than an
 * ancestor, so `[data-surface] [data-surface]` never matches and the rule has to
 * be kept by construction here. It also matches the reference, where the active
 * item is a translucent fill rather than a separately blurred pill.
 *
 * `usePathname` from `@/i18n/navigation` returns the path *without* the locale
 * prefix, which is what makes a plain `href` comparison correct. Using
 * `next/navigation` here would compare "/en/projects" against "/projects" and
 * never match.
 */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "lift relative inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
        "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
        active
          ? "text-foreground bg-foreground/8 inset-ring-1 inset-ring-foreground/10"
          : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
      )}
    >
      {children}
    </Link>
  );
}
