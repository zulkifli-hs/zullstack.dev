import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { LensAuto } from "@/components/glass/lens-auto";
import { CommandMenu } from "@/components/layout/command-menu";
import { ContactCta } from "@/components/layout/contact-cta";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { NavLink } from "@/components/layout/nav-link";
import { TransparencyToggle } from "@/components/layout/transparency-toggle";
import { Link } from "@/i18n/navigation";
import { contactChannels } from "@/lib/contact";
import { HEADER_NAV } from "@/lib/navigation";
import { getSiteConfig } from "@/lib/queries";

export async function SiteHeader() {
  const [t, config] = await Promise.all([getTranslations("nav"), getSiteConfig()]);
  const channels = contactChannels(config);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      {/*
        A floating capsule rather than a full-bleed bar — Apple's iOS 26
        navigation shape, and what makes the material legible: a bar welded to
        the viewport edge has only one visible boundary, where a capsule is
        surrounded by the backdrop it is refracting.

        `scroll-edge` is deliberately gone. That utility masks the bottom of the
        surface to a soft fade, which is right for a full-bleed bar ending on a
        hard line and completely wrong here — it would cut the capsule in half.
      */}
      <div className="relative mx-auto max-w-6xl">
        {/*
          The blur lives on this layer, not on the <header>, so the nav content
          is not *inside* a filtered element. Text rendered within a
          backdrop-filtered box comes out noticeably soft.
        */}
        <div
          aria-hidden
          data-surface="lens"
          className="glass glass-lens surface-md lens-pill pointer-events-none absolute inset-0 rounded-full"
        >
          {/* Without this the capsule would wear the `md` map — a rounded
              rectangle with an 18px corner — stretched across a 1152x64 pill.
              `lens-pill` is the closer static fallback; LensAuto replaces it
              with a map cut to the capsule's real geometry. */}
          <LensAuto />
        </div>

        <nav
          aria-label={t("label")}
          className="relative flex h-14 items-center gap-2 pr-2 pl-4 sm:h-16 sm:pr-6 sm:pl-5"
        >
          <Link href="/" aria-label="Zullstack — home" className="shrink-0">
            {/* Above the fold on every page, so it is an LCP candidate. */}
            <Logo className="h-8 sm:h-9" priority />
          </Link>

          <span aria-hidden className="bg-hairline/70 mx-2 hidden h-6 w-px lg:block" />

          <ul className="hidden items-center gap-0.5 lg:flex">
            {HEADER_NAV.map(({ href, key }) => (
              <li key={href}>
                <NavLink href={href}>{t(key)}</NavLink>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-0.5">
            <CommandMenu />
            {/* Theme lives inside this popover now — one settings surface
                rather than two adjacent icons doing adjacent things. */}
            <TransparencyToggle />
            <LocaleSwitcher />
            {/* The capsule's right-hand anchor, as in the reference designs.
                Hidden on mobile, where the floating button carries it instead —
                two triggers, one surface. */}
            <ContactCta channels={channels} className="ml-1.5 hidden sm:inline-flex" />
          </div>
        </nav>
      </div>
    </header>
  );
}
