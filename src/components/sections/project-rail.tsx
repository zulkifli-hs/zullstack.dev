"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";

import { ProjectCard } from "@/components/sections/project-grid";
import type { Locale } from "@/i18n/routing";
import type { Project } from "@/types/content";

/** A rail card is a fixed width, not a fraction of the viewport above `sm`. */
const RAIL_SIZES = "(min-width: 1024px) 22rem, (min-width: 640px) 20rem, 82vw";

/**
 * Pixels per second.
 *
 * Slow enough to read a card as it goes past: at this rate one ~370px card
 * takes about twelve seconds to cross, so the summary is legible without
 * anyone having to catch it. Fast enough that the rail is visibly alive rather
 * than looking like a layout that failed to settle.
 */
const SPEED = 30;

/** Cap on a single frame's advance, so a backgrounded tab does not lurch. */
const MAX_FRAME = 0.05;

/**
 * The home page's projects, scrolling themselves.
 *
 * Two copies of the list are rendered and the scroll position wraps by exactly
 * one copy's width, which is what makes the loop seamless — at the moment it
 * wraps, the pixels on screen are identical either side of the jump, so there
 * is nothing to see. The loop width is measured from the DOM (the distance
 * between copy one's first card and copy two's first card) rather than
 * calculated from card widths and gaps: the cards are responsive, and a
 * computed figure that is a gap out would show as a stutter once per lap.
 *
 * It drives `scrollLeft` rather than a CSS transform so the rail stays a real
 * scroll container — drag it on a phone, flick it with a trackpad, and the
 * animation picks up from wherever you left it instead of fighting you.
 *
 * Motion stops for hover, for keyboard focus landing on a card, and for a
 * finger on the track; `prefers-reduced-motion` stops it before it starts.
 * Worth naming the gap honestly: WCAG 2.2.2 wants a control to pause moving
 * content, and hover is not that for a touch user who is only reading. The
 * mitigations are that nothing here is essential — every card is on /projects,
 * a page with no motion at all — and that touching the rail halts it.
 */
export function ProjectRail({ items, locale }: { items: Project[]; locale: Locale }) {
  const t = useTranslations("sections.projects.rail");
  const scroller = useRef<HTMLUListElement>(null);
  const paused = useRef(false);

  const setPaused = useCallback((value: boolean) => {
    paused.current = value;
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // The distance from the first card of copy one to the first card of copy
    // two: one whole lap, gaps included, padding excluded.
    const lapWidth = () => {
      const first = el.children[0] as HTMLElement | undefined;
      const second = el.children[items.length] as HTMLElement | undefined;
      return first && second ? second.offsetLeft - first.offsetLeft : 0;
    };

    let lap = lapWidth();
    // Nothing to loop through — one copy does not even fill the viewport, so
    // scrolling would only reveal the empty tail of the second copy.
    if (lap <= el.clientWidth) return;

    const observer = new ResizeObserver(() => {
      lap = lapWidth();
    });
    observer.observe(el);

    let frame = 0;
    let last = performance.now();
    // Tracked as a float and written each frame: `scrollLeft` reads back
    // rounded in some browsers, and at 30px/s the lost fraction is most of the
    // movement — the rail would creep or stall outright.
    let position = el.scrollLeft;
    let written = position;

    const tick = (now: number) => {
      const delta = Math.min((now - last) / 1000, MAX_FRAME);
      last = now;

      if (paused.current || lap <= 0) {
        // Adopt whatever the reader did while we were stopped.
        position = el.scrollLeft;
        written = position;
      } else {
        // Same for a drag or a flick mid-run: if the position moved by
        // something other than us, that was the reader, and they win.
        if (Math.abs(el.scrollLeft - written) > 1) position = el.scrollLeft;

        position += SPEED * delta;
        // Modulo rather than one subtraction: a reader who dragged deep into
        // the second lap before letting go can be more than a lap along, and
        // the pattern repeats every `lap` pixels either way — so this lands on
        // the identical pixels no matter how far out it started.
        if (position >= lap) position %= lap;

        el.scrollLeft = position;
        written = el.scrollLeft;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [items.length]);

  return (
    <div className="relative">
      {/*
        Full bleed, to the viewport edge rather than to the section's gutter.

        `mx-[calc(50%-50vw)]` is the distance from this wrapper's edge out to
        the screen's, so the track spans the window at every width; the matching
        padding puts the first card back under the "Projects" title. The old
        `-mx-6` cut cards off 24px outside the text column, which is close
        enough in to read as a box clipping them rather than as content leaving
        the screen — and no fade can rescue an edge that lands there. Overflow
        past the window is safe: `html` is `overflow-x: clip`.

        No scroll snapping: snap points and a per-frame `scrollLeft` fight each
        other, and the browser wins — the rail would tug back to the nearest
        card on every frame. The scrollbar is hidden because the motion is its
        own affordance.
      */}
      <ul
        ref={scroller}
        aria-label={t("label")}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        // Tabbing into a card stops the rail: a link that slides out from under
        // the focus ring is unusable, and this is the only pause a keyboard
        // reader gets.
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        className="mx-[calc(50%-50vw)] flex w-screen scroll-auto gap-5 overflow-x-auto px-[calc(50vw-50%)] pt-1 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((project) => (
          <li key={project.id} className="w-[82vw] shrink-0 sm:w-80 lg:w-88">
            <ProjectCard project={project} locale={locale} sizes={RAIL_SIZES} />
          </li>
        ))}

        {/* The second lap: the same projects again, so the wrap has identical
            pixels to land on.

            Hidden from assistive technology and taken out of the tab order,
            because it is a repeat of content already in the tree — but still
            clickable. `inert` would have done the hiding in one attribute and
            was the first thing tried; it also blocks pointer events, and the
            wrap keeps the scroll position inside lap one, which means cards
            from lap two are on screen for roughly a quarter of every lap. A
            visible card that silently ignores a click is worse than a card
            announced twice. */}
        {items.map((project) => (
          <li
            key={`${project.id}-loop`}
            aria-hidden
            className="w-[82vw] shrink-0 sm:w-80 lg:w-88"
          >
            <ProjectCard project={project} locale={locale} sizes={RAIL_SIZES} duplicate />
          </li>
        ))}
      </ul>

      {/* Sat at the window's edges, matching the track's bleed. Wide enough
          that a card is most of the way gone before it reaches the clip — a
          40px fade against a 352px card only softened the cut, it did not hide
          it. See `rail-fade-*` in globals.css for why these are overlays.

          Off entirely below `sm`. A fade is what makes a card look like it is
          leaving rather than being cut, and on a phone the screen edge already
          says that; at 375px these were 80px a side, so 43% of the viewport was
          spent dimming the only card on it. */}
      <span
        aria-hidden
        className="rail-fade-l pointer-events-none absolute inset-y-0 left-[calc(50%-50vw)] z-1 hidden w-36 sm:block lg:w-52"
      />
      <span
        aria-hidden
        className="rail-fade-r pointer-events-none absolute inset-y-0 right-[calc(50%-50vw)] z-1 hidden w-36 sm:block lg:w-52"
      />
    </div>
  );
}
