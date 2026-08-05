import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { getSiteConfig } from "@/lib/queries";

const EXPLORE = [
  { href: "/projects", key: "projects" },
  { href: "/experience", key: "experience" },
  { href: "/mentoring", key: "mentoring" },
  { href: "/articles", key: "articles" },
  { href: "/testimonials", key: "testimonials" },
  { href: "/open-source", key: "openSource" },
] as const;

export async function SiteFooter() {
  const [t, tNav, config] = await Promise.all([
    getTranslations("footer"),
    getTranslations("nav"),
    getSiteConfig(),
  ]);

  return (
    <footer className="border-hairline/60 relative mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Logo className="h-9" />
          {config?.email && (
            <a
              href={`mailto:${config.email}`}
              className="text-link mt-4 inline-block text-sm font-medium hover:underline"
            >
              {config.email}
            </a>
          )}
        </div>

        <div>
          <p className="lab-label text-muted-foreground">{t("explore")}</p>
          <ul className="mt-4 space-y-2">
            {EXPLORE.map(({ href, key }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {tNav(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="lab-label text-muted-foreground">{t("connect")}</p>
          <ul className="mt-4 space-y-2">
            {(config?.socials ?? []).map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url}
                  target="_blank"
                  // noreferrer alongside noopener: the former also strips the
                  // Referer header, the latter blocks window.opener access.
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-sm capitalize transition-colors"
                >
                  {social.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-hairline/60 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t("rights", { year: new Date().getFullYear() })}</p>
          <p className="font-mono">{t("builtWith")}</p>
        </div>
      </div>
    </footer>
  );
}
