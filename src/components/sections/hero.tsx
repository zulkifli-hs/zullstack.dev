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
      {/* Two columns only when there is a photo. Reserving the right-hand column
          unconditionally would leave a hole on a site whose config has not been
          filled in yet. */}
      <div className={cn(photo && "lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-8")}>
        <div>
          {/*
            The one true-lens surface on the page. Refraction is the most
            expensive thing in the design system, so it is spent here and
            nowhere else.
          */}
          <GlassPanel variant="lens" padding="lg" interactive grain className="max-w-3xl">
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
          </GlassPanel>

          {/* Body copy lives on the page ground, never on glass — 400-weight
              text dissolves into a blurred backdrop and fails contrast. */}
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
        </div>

        {photo && (
          // Hidden below `lg`: a phone has no empty column to fill, and the
          // photo would only push the buttons another screen down.
          <div className="relative hidden lg:block">
            {/* A cut-out has no edges of its own, so without something behind it
                it reads as pasted on. A soft radial pool sits it on the page. */}
            <div
              aria-hidden
              className="from-brand-600/25 absolute inset-x-0 bottom-0 -z-10 h-3/4 rounded-full bg-radial-[at_50%_100%] to-transparent blur-2xl dark:from-brand-600/30"
            />
            <Image
              src={cloudinarySrc(photo)}
              alt={photo.alt?.[locale] || config?.name || ""}
              width={photo.width ?? 720}
              height={photo.height ?? 900}
              // Beside the H1 and above the fold, so it competes for LCP.
              priority
              quality={90}
              sizes="352px"
              className="mx-auto h-auto w-full max-w-88 object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}
