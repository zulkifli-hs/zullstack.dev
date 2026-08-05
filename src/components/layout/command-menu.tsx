"use client";

import { FileText, FlaskConical, Loader2, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import type { SearchHit } from "@/app/api/search/route";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * ⌘K search over projects and articles.
 *
 * Built on Base UI's Dialog rather than a hand-rolled overlay, which brings a
 * real focus trap, scroll locking, Escape handling and `aria-modal` — none of
 * which the previous bespoke implementation had. It also removes the second of
 * three uncoordinated `backdrop-filter`s: the scrim now dims rather than blurs,
 * so the glass popup has crisp geometry behind it to refract.
 *
 * Results are fetched rather than bundled: shipping the whole content index to
 * every visitor would grow with the site, and the API route already has the
 * database open.
 */
export function CommandMenu() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K. Escape and focus trapping are Base UI's job now.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /**
   * All synchronous state transitions live in the change handler, so the effect
   * below only performs the async fetch. Setting state in an effect body
   * schedules a second render pass before paint.
   */
  function onQueryChange(value: string) {
    setQuery(value);
    const tooShort = value.trim().length < 2;
    if (tooShort) setHits([]);
    setLoading(!tooShort);
  }

  // Debounced search. The timer is cleared on every keystroke, so only the
  // pause at the end of typing actually hits the network.
  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data: { hits: SearchHit[] }) => {
          setHits(data.hits);
          setActive(0);
          setLoading(false);
        })
        .catch(() => {
          // An aborted request is the expected path when typing continues.
        });
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setHits([]);
    }
  }

  function go(hit: SearchHit) {
    onOpenChange(false);
    router.push(hit.type === "project" ? `/projects/${hit.slug}` : `/articles/${hit.slug}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="text-muted-foreground"
      >
        <Search className="size-4" />
        {/* The shortcut hint is desktop-only — it is not actionable on touch,
            and it was previously the reason the whole button was hidden below
            md, which left mobile with no search at all. */}
        <kbd className="border-hairline hidden rounded border px-1.5 py-0.5 font-mono text-[0.625rem] md:inline">
          ⌘K
        </kbd>
      </Button>

      <DialogContent side="top" showClose={false} className="p-0">
        <DialogTitle className="sr-only">{t("open")}</DialogTitle>
        <DialogDescription className="sr-only">{t("placeholder")}</DialogDescription>

        <div className="border-hairline/60 flex items-center gap-3 border-b px-4">
          {loading ? (
            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
          ) : (
            <Search className="text-muted-foreground size-4 shrink-0" />
          )}
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((i) => Math.min(i + 1, hits.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
              if (event.key === "Enter" && hits[active]) go(hits[active]);
            }}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="w-full bg-transparent py-3.5 text-sm outline-none"
          />
        </div>

        {hits.length > 0 && (
          <ul className="max-h-80 overflow-y-auto p-1.5">
            {hits.map((hit, index) => (
              <li key={`${hit.type}-${hit.slug}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(hit)}
                  className={cn(
                    "rounded-concentric flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                    "focus-visible:inset-ring-2 focus-visible:inset-ring-ring focus-visible:outline-none",
                    index === active && "bg-secondary/60",
                  )}
                >
                  {hit.type === "project" ? (
                    <FlaskConical className="text-signal mt-0.5 size-4 shrink-0" />
                  ) : (
                    <FileText className="text-signal mt-0.5 size-4 shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{hit.title}</span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {hit.summary}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.trim().length >= 2 && !loading && hits.length === 0 && (
          <p className="text-muted-foreground px-4 py-8 text-center text-sm">
            {t("empty", { query })}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
