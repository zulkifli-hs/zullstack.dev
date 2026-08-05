import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { CommandMenu } from "@/components/layout/command-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { TransparencyToggle } from "@/components/layout/transparency-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { HEADER_NAV } from "@/lib/navigation";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50">
      {/*
        Apple's scroll edge effect: the blurred strip fades out downward via a
        mask instead of ending on a hard line, which is what keeps a sticky
        header legible over arbitrary content.

        The blur lives on this absolutely-positioned layer rather than on the
        <header> itself so the nav content is not inside the filtered element —
        text on a backdrop-filtered surface renders noticeably softer.

        Previously this was a hand-rolled `backdrop-blur-xl backdrop-saturate-150`
        that ignored the glass tokens entirely, which meant the site's own
        transparency toggle did nothing to the header. Going through `glass`
        fixes that and picks up all seven degradation modes for free. Radius and
        shadow are stripped because a full-bleed bar has neither.
      */}
      <div
        aria-hidden
        data-surface="glass"
        className="glass surface-md scroll-edge pointer-events-none absolute inset-0 rounded-none border-0 shadow-none"
      />
      <div className="border-hairline/60 relative border-b">
        <nav
          aria-label={t("label")}
          className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6"
        >
          <Link href="/" aria-label="Zullstack — home" className="shrink-0">
            {/* Above the fold on every page, so it is an LCP candidate. */}
            <Logo className="h-9" priority />
          </Link>

          <ul className="ml-auto hidden items-center gap-1 lg:flex">
            {HEADER_NAV.map(({ href, key }) => (
              <li key={href}>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-muted-foreground hover:text-foreground"
                  render={<Link href={href} />}
                >
                  {t(key)}
                </Button>
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
