"use client";

import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteEntity, toggleStatus } from "@/lib/actions/content";
import { cn } from "@/lib/utils";

export function EntityRow({
  resource,
  id,
  title,
  status,
  columns,
}: {
  resource: string;
  id: string;
  title: string;
  status: string;
  columns: { label: string; value: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const published = status === "published";

  return (
    <li className="hover:bg-secondary/30 flex items-center gap-4 px-4 py-3 transition-colors">
      <div className="min-w-0 flex-1">
        <Link
          href={`/admin/${resource}/${id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {title}
        </Link>
        {columns.length > 0 && (
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
            {columns.map((column) => `${column.label}: ${column.value}`).join(" · ")}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleStatus(resource, id).then(() => router.refresh()))}
        className={cn(
          "lab-label shrink-0 rounded-full border px-2.5 py-1 transition-colors",
          published
            ? "border-signal/40 text-signal"
            : "border-hairline text-muted-foreground hover:text-foreground",
        )}
        aria-label={published ? "Unpublish" : "Publish"}
      >
        {status}
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          // A destructive action with no undo deserves a confirmation, and this
          // is the one place in the CMS where data is irrecoverably lost.
          if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
          startTransition(() => deleteEntity(resource, id).then(() => router.refresh()));
        }}
        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
        aria-label={`Delete ${title}`}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </button>
    </li>
  );
}
