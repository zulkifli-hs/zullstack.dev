"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { ProjectCard } from "@/components/sections/project-grid";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/types/content";

/** A rail card is a fixed width, not a fraction of the viewport above `sm`. */
const RAIL_SIZES = "(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 82vw";

/** Matches the `gap-5` between cards; used to advance exactly one card. */
const GAP = 20;

/**
 * The home page's projects, scrolled sideways instead of stacked.
 *
 * The section used to show three, because three is what one row of the grid
 * holds and a second row would have pushed everything below it off the fold.
 * A rail decouples the two: how many projects are offered stops being a
 * function of how tall the section is allowed to be.
 *
 * Native overflow scrolling with CSS snap points does the actual work — the
 * buttons are an affordance for mouse users on desktop, not the mechanism.
 * That is what keeps this working with the keyboard, with a trackpad, with a
 * touch screen, and before hydration: the markup scrolls on its own, and
 * JavaScript only adds the arrows.
 */
export function ProjectRail({ items, locale }: { items: Project[]; locale: Locale }) {
  const t = useTranslations("sections.projects.rail");
  const scroller = useRef<HTMLUListElement>(null);

  // `end: false` on the first render rather than the measured truth: the rail
  // overflows in every real case, and starting it disabled would flash a dead
  // button on every load for the one case that does not.
  const [edges, setEdges] = useState({ start: true, end: false });

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 1, end: el.scrollLeft >= max - 1 });
  }, []);

  // Re-measured on resize as well as on scroll: how many cards fit — and
  // therefore whether the rail can move at all — changes with the viewport,
  // and a scroll event never fires for that.
  useEffect(() => {
    sync();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const step = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    // One card at a time, measured from the DOM rather than from a constant —
    // the width is a responsive class, so the only honest source is the card.
    const card = el.firstElementChild as HTMLElement | null;
    const distance = card ? card.offsetWidth + GAP : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-4 hidden justify-end gap-2 md:flex">
        <Button
          variant="glass"
          size="icon-lg"
          aria-label={t("previous")}
          disabled={edges.start}
          onClick={() => step(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="glass"
          size="icon-lg"
          aria-label={t("next")}
          disabled={edges.end}
          onClick={() => step(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      {/*
        `-mx-6 px-6` bleeds the track past the section's gutter and puts the
        gutter back inside it, so a card scrolls out to the edge of the page
        instead of stopping short at an invisible wall. `scroll-px-6` is the
        matching correction for the snap points, without which every card
        snaps 24px too far left.

        The scrollbar is hidden rather than styled: the arrows and the
        half-visible next card are the affordance, and a horizontal bar under
        a row of glass cards reads as a rendering artefact.
      */}
      <ul
        ref={scroller}
        onScroll={sync}
        aria-label={t("label")}
        className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 pt-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((project) => (
          <li key={project.id} className="w-[82vw] shrink-0 snap-start sm:w-80 lg:w-88">
            <ProjectCard project={project} locale={locale} sizes={RAIL_SIZES} />
          </li>
        ))}
      </ul>
    </div>
  );
}
