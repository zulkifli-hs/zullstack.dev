import { getTranslations } from "next-intl/server";

import { LogoMark } from "@/components/brand/logo-mark";
import { CommandMenu } from "@/components/layout/command-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TransparencyToggle } from "@/components/layout/transparency-toggle";
import { Link } from "@/i18n/navigation";

export const NAV_ITEMS = [
  { href: "/projects", key: "projects" },
  { href: "/experience", key: "experience" },
  { href: "/mentoring", key: "mentoring" },
  { href: "/articles", key: "articles" },
  { href: "/resources", key: "resources" },
  { href: "/playground", key: "playground" },
] as const;

export async function SiteHeader() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50">
      {/*
        Apple's scroll edge effect: the blurred strip fades out downward via a
        mask instead of ending on a hard line, which is what keeps a sticky
        header legible over arbitrary content. Highest legibility-per-byte in
        the design system, and it works in every browser.

        The blur lives on this absolutely-positioned layer rather than on the
        <header> itself so the nav content is not inside the filtered element —
        text on a backdrop-filtered surface renders noticeably softer.
      */}
      <div
        aria-hidden
        className="scroll-edge bg-background/55 pointer-events-none absolute inset-0 backdrop-blur-xl backdrop-saturate-150"
      />
      <div className="border-hairline/60 relative border-b">
        <nav
          aria-label={t("label")}
          className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6"
        >
          <Link href="/" className="group flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-mono text-sm font-semibold tracking-tight">
              zullstack<span className="text-signal">.dev</span>
            </span>
          </Link>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <CommandMenu />
            <TransparencyToggle />
            <LocaleSwitcher />
            <ThemeToggle />
            <MobileNav />
          </div>
        </nav>
      </div>
    </header>
  );
}
