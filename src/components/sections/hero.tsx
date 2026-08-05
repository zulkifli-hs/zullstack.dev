import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pick } from "@/lib/utils";
import type { SiteConfig } from "@/types/content";

export async function Hero({ config, locale }: { config: SiteConfig | null; locale: Locale }) {
  const t = await getTranslations("hero");
  const tagline = pick(config?.tagline, locale) || t("tagline");

  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-12 sm:pt-28">
      {/*
        The one true-lens surface on the page. Refraction is the most expensive
        thing in the design system, so it is spent here and nowhere else.
      */}
      <GlassPanel variant="lens" padding="lg" interactive grain className="max-w-3xl">
        <p className="lab-label text-signal">{t("eyebrow")}</p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          {t("greeting")}{" "}
          <span className="text-link">{config?.name || t("name")}</span>
        </h1>

        <p className="mt-4 font-mono text-sm font-medium sm:text-base">
          <span aria-hidden className="text-signal">{"> "}</span>
          {tagline}
        </p>

        <p className="text-muted-foreground mt-1 font-mono text-xs sm:text-sm">{t("role")}</p>
      </GlassPanel>

      {/* Body copy lives on the page ground, never on glass — 400-weight text
          dissolves into a blurred backdrop and fails contrast. */}
      <p className="text-muted-foreground mt-8 max-w-2xl text-base text-pretty sm:text-lg">
        {t("description")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/projects"
          className="bg-primary text-primary-foreground hover:bg-brand-700 group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {t("primaryCta")}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/mentoring"
          className="border-hairline hover:bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Sparkles className="text-signal size-4" />
          {t("secondaryCta")}
        </Link>
      </div>
    </section>
  );
}
