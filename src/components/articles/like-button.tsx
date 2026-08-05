"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useOptimistic, useState, useTransition } from "react";

import { getLikeState, toggleLike } from "@/lib/actions/engagement";
import { cn } from "@/lib/utils";

/**
 * Like toggle with an optimistic count.
 *
 * Whether *this* visitor has liked is per-visitor state living in an httpOnly
 * cookie, so it cannot be known at build time. Reading it in the page would
 * force the whole article to render dynamically; resolving it here after mount
 * keeps the article statically generated and costs one small request.
 *
 * The count itself comes from the article document, so the number is correct
 * on first paint even before the visitor's own state resolves.
 */
export function LikeButton({
  articleSlug,
  initialCount,
}: {
  articleSlug: string;
  initialCount: number;
}) {
  const t = useTranslations("comments");
  const [isPending, startTransition] = useTransition();
  const [base, setBase] = useState({ liked: false, count: initialCount });

  useEffect(() => {
    let cancelled = false;

    // setState lives in the async callback, not the effect body — this is the
    // "subscribe to an external system" shape, not a cascading render.
    void getLikeState(articleSlug).then((state) => {
      if (!cancelled) setBase(state);
    });

    return () => {
      cancelled = true;
    };
  }, [articleSlug]);

  const [state, setOptimistic] = useOptimistic(base, (current) => ({
    liked: !current.liked,
    count: current.count + (current.liked ? -1 : 1),
  }));

  return (
    <button
      type="button"
      disabled={isPending}
      aria-pressed={state.liked}
      aria-label={state.liked ? t("unlike") : t("like")}
      onClick={() =>
        // The optimistic update must happen inside the transition, or React
        // discards it before the action resolves.
        startTransition(async () => {
          setOptimistic(null);
          const next = await toggleLike(articleSlug);
          setBase(next);
        })
      }
      className={cn(
        "border-hairline hover:bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        state.liked && "border-signal/50 text-signal",
      )}
    >
      <Heart className={cn("size-4", state.liked && "fill-current")} />
      <span className="tabular">{state.count}</span>
    </button>
  );
}
