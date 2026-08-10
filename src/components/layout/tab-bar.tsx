"use client";

import { BookOpen, Briefcase, House, LayoutGrid, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LensAuto } from "@/components/glass/lens-auto";
import { Link, usePathname } from "@/i18n/navigation";
import { TAB_NAV, type NavKey } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<NavKey, typeof House>> = {
  home: House,
  projects: LayoutGrid,
  experience: Briefcase,
  mentoring: Sparkles,
  articles: BookOpen,
};

/**
 * Mobile bottom navigation — a floating glass capsule, per the reference.
 *
 * Destinations only. Apple is explicit that a tab bar navigates between
 * sections and is not a home for actions or settings, so search, theme,
 * language and the glass controls stay in the top bar, and contact is a
 * detached floating button beside this rather than a sixth tab.
 */
export function TabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const minimized = useMinimizeOnScroll();

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div
        data-surface="lens"
        className={cn(
          "glass glass-lens surface-md lens-pill flex items-center gap-1 rounded-full p-1.5",
          "[--surface-radius:9999px]",
          // Apple's `.tabBarMinimizeBehavior(.onScrollDown)`. This is a discrete
          // 220ms transition on a direction change, never a scroll-linked one:
          // a glass element whose geometry animates forces the compositor to
          // re-snapshot its backdrop every frame, which is affordable once and
          // ruinous continuously.
          "transition-[padding,gap] duration-220 ease-glass",
          minimized && "gap-0 p-1",
        )}
      >
        {/* Pill geometry, measured — the static `md` map is a rounded rect. */}
        <LensAuto />
        {TAB_NAV.map(({ href, key }) => {
          const Icon = ICONS[key] ?? House;
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              // The visible label collapses to zero width, so it cannot be the
              // accessible name — a collapsed tab would be announced as nothing
              // at all. Naming the link explicitly keeps the announcement
              // constant while the label animates, and stops the name being
              // read twice, which is what a parallel sr-only span would cause.
              aria-label={t(key)}
              className={cn(
                "lift relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium",
                "transition-colors",
                "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:outline-none",
                // Flat, not glass: this pill sits on the capsule's own blur, and
                // stacking a second backdrop-filter on it is the glass-on-glass
                // case Apple rules out. The reference shows a solid fill here.
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon aria-hidden className="size-5 shrink-0" />
              <span
                aria-hidden
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-220 ease-glass",
                  active && !minimized ? "max-w-32 opacity-100" : "max-w-0 opacity-0",
                )}
              >
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * True while the reader is moving down the page.
 *
 * Reads scroll position in a passive listener and only commits a state change
 * when the direction actually flips past a threshold — a per-pixel state update
 * would re-render the bar on every frame of every scroll.
 */
function useMinimizeOnScroll() {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        if (Math.abs(y - last) < 12) return;
        setMinimized(y > last && y > 120);
        last = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return minimized;
}
