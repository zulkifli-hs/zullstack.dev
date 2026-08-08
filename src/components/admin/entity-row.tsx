"use client";

import { GripVertical, Loader2, Star, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BadgeButton } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteEntity, toggleFavorite, toggleStatus } from "@/lib/actions/content";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  status: string;
  favorite: boolean;
  columns: { label: string; value: string }[];
};

/**
 * One row in the admin list.
 *
 * Renders as a `Reorder.Item` when `dragValue` is supplied and a plain `<li>`
 * otherwise, so resources sorted by date reuse the row without gaining a drag
 * handle that would not stick.
 */
export function EntityRow({
  resource,
  item,
  dragValue,
  onDragEnd,
  favoritable = true,
}: {
  resource: string;
  item: Item;
  dragValue?: Item;
  onDragEnd?: () => void;
  favoritable?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const controls = useDragControls();

  const published = item.status === "published";

  const body = (
    <>
      {dragValue && (
        <button
          type="button"
          // Drag starts from the handle only: the row contains a link and three
          // buttons, and a whole-row listener would swallow their clicks.
          onPointerDown={(event) => controls.start(event)}
          aria-label={`Reorder ${item.title}`}
          className="text-muted-foreground hover:text-foreground -ml-1 cursor-grab touch-none transition-colors active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/${resource}/${item.id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
        {item.columns.length > 0 && (
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
            {item.columns.map((column) => `${column.label}: ${column.value}`).join(" · ")}
          </p>
        )}
      </div>

      {favoritable && (
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          onClick={() =>
            startTransition(() =>
              toggleFavorite(resource, item.id).then(() => router.refresh()),
            )
          }
          aria-label={item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
          aria-pressed={item.favorite}
          className="shrink-0"
        >
          <Star
            className={cn(
              "size-4",
              item.favorite ? "fill-signal text-signal" : "text-muted-foreground",
            )}
          />
        </Button>
      )}

      <BadgeButton
        disabled={pending}
        tone={published ? "signal" : "neutral"}
        onClick={() =>
          startTransition(() => toggleStatus(resource, item.id).then(() => router.refresh()))
        }
        aria-label={published ? "Unpublish" : "Publish"}
        className="shrink-0"
      >
        {item.status}
      </BadgeButton>

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${item.title}`}
        className="hover:text-destructive shrink-0"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>

      {/* A destructive action with no undo deserves a confirmation, and this is
          the one place in the CMS where data is irrecoverably lost. Was
          `window.confirm`, which cannot be styled and reads as a browser
          malfunction inside a dark admin. */}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="p-6">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Delete “{item.title}”?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 text-sm">
            This cannot be undone.
          </DialogDescription>

          <div className="mt-6 flex justify-end gap-3">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                startTransition(() =>
                  deleteEntity(resource, item.id).then(() => router.refresh()),
                );
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  const className = "hover:bg-secondary/30 flex items-center gap-3 px-4 py-3 transition-colors";

  if (!dragValue) return <li className={className}>{body}</li>;

  return (
    <Reorder.Item
      value={dragValue}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className={cn(className, "bg-background")}
    >
      {body}
    </Reorder.Item>
  );
}
