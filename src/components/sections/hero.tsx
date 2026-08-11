import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { cloudinarySrc } from "@/lib/images/cloudinary";
import { cn, pick } from "@/lib/utils";
import type { SiteConfig } from "@/types/content";

export async function Hero({ config, locale }: { config: SiteConfig | null; locale: Locale }) {
  const t = await getTranslations("hero");
  const tagline = pick(config?.tagline, locale) || t("tagline");
  const photo = config?.heroPhoto?.url ? config.heroPhoto : null;

  return (
    <section className="relative mx-auto max-w-6xl px-6 pt-20 pb-12 sm:pt-28">
      {/*
        The one true-lens surface on the page. Refraction is the most expensive
        thing in the design system, so it is spent here and nowhere else.

        The photo is a child of this panel, and the panel has to stop clipping
        for it: the figure stands *on* the card's bottom edge and rises past its
        top one, so the card reads as a plane the subject is standing behind
        rather than a window they are cropped inside.

        `--surface-contain: none` is what buys that. The `glass` utility applies
        `contain: paint`, which clips descendants to the padding box exactly as
        `overflow: hidden` would — so without this the head is simply cut off at
        the card's top edge. It is the same escape hatch `surface-md` sets for
        overlays that have to anchor submenus outside their own box, and it is
        opted into only when there is a photo, so every other panel keeps the
        containment it benefits from.
      */}
      <GlassPanel
        variant="lens"
        padding="lg"
        interactive
        grain
        className={cn("relative max-w-3xl", photo && "mt-8 lg:mt-20 lg:[--surface-contain:none]")}
      >
        {/* Reserved so the copy never runs under the figure. Below `lg` the
            photo is not rendered, so the text takes the full width back. */}
        <div className={cn(photo && "lg:pr-64")}>
          <p className="lab-label text-signal">{t("eyebrow")}</p>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {t("greeting")} <span className="text-link">{config?.name || t("name")}</span>
          </h1>

          <p className="mt-4 font-mono text-sm font-medium sm:text-base">
            <span aria-hidden className="text-signal">
              {"> "}
            </span>
            {tagline}
          </p>

          <p className="text-muted-foreground mt-1 font-mono text-xs sm:text-sm">{t("role")}</p>
        </div>

        {photo && (
          // Hidden below `lg`: a phone's card is the width of the text, and a
          // figure standing in it would leave a column too narrow to read.
          // `bottom-0` resolves against the panel's padding box, whose bottom
          // edge *is* the card's inner border — so the figure lands on the card
          // edge regardless of how much padding the copy sits in.
          <div
            aria-hidden
            className="pointer-events-none absolute right-6 bottom-0 hidden h-[132%] w-60 lg:block"
          >
            {/* A cut-out has no edges of its own, so without something behind it
                it reads as pasted on rather than standing there. */}
            <div className="from-brand-600/30 dark:from-brand-600/35 absolute inset-x-0 bottom-0 h-1/2 bg-radial-[at_50%_100%] to-transparent blur-2xl" />

            <Image
              src={cloudinarySrc(photo)}
              alt=""
              width={photo.width ?? 720}
              height={photo.height ?? 900}
              // Beside the H1 and above the fold, so it competes for LCP.
              priority
              quality={90}
              sizes="240px"
              // `object-bottom` is what keeps the feet on the card's edge as the
              // panel grows or shrinks with its own copy — the overflow is
              // always taken off the top, where it is wanted.
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        )}
      </GlassPanel>

      {/* Body copy lives on the page ground, never on glass — 400-weight text
          dissolves into a blurred backdrop and fails contrast. */}
      <p className="text-muted-foreground mt-8 max-w-2xl text-base text-pretty sm:text-lg">
        {t("description")}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button size="pill" variant="glassProminent" render={<Link href="/projects" />}>
          {t("primaryCta")}
          <ArrowRight className="size-4" />
        </Button>

        <Button size="pill" variant="glass" render={<Link href="/mentoring" />}>
          <Sparkles className="text-signal size-4" />
          {t("secondaryCta")}
        </Button>
      </div>
    </section>
  );
}
