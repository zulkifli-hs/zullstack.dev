"use client";

import { Reorder } from "motion/react";
import { useState, useTransition } from "react";

import { EntityRow } from "@/components/admin/entity-row";
import { reorderEntities } from "@/lib/actions/content";

export type EntityListItem = {
  id: string;
  title: string;
  status: string;
  favorite: boolean;
  columns: { label: string; value: string }[];
};

/**
 * Identity of a server-supplied list: which rows, in which order, starred or
 * not. Any mutation — starring, deleting, publishing — changes this, which is
 * how a local drag ordering knows it has been superseded.
 */
const signatureOf = (items: EntityListItem[]) =>
  items.map((item) => `${item.id}:${item.favorite ? 1 : 0}`).join(",");

/**
 * The admin list, with drag-to-reorder and a favorites section.
 *
 * Favorites are a *separate* group rather than a badge inside one list. The
 * server sorts by `{ favorite: -1, order: 1 }`, so in a single mixed list the
 * meaning of dragging a row across the favorite boundary would be ambiguous —
 * either it silently flips the flag, or the row springs back on reload and
 * looks broken. Two groups make the boundary explicit: dragging reorders within
 * a group, and moving between them is the star button's job.
 */
export function EntityList({
  resource,
  items,
  reorderable,
  hasFavorites,
}: {
  resource: string;
  items: EntityListItem[];
  reorderable: boolean;
  hasFavorites: boolean;
}) {
  // A drag reorders rows locally so the list does not wait on a round trip.
  // Storing ids rather than rows means a refreshed title or status still shows
  // through the override.
  const [override, setOverride] = useState<{ signature: string; ids: string[] } | null>(null);

  const signature = signatureOf(items);

  // Adjusting state during render rather than in an effect: this is React's
  // documented way to reset derived state when props change, and it avoids the
  // extra commit-then-rerender an effect would cost.
  if (override && override.signature !== signature) setOverride(null);

  const ordered = applyOverride(items, override?.ids);

  const favorites = ordered.filter((item) => item.favorite);
  const rest = ordered.filter((item) => !item.favorite);

  function reorder(group: EntityListItem[], leading: EntityListItem[]) {
    const ids = [...leading.map((item) => item.id), ...group.map((item) => item.id)];
    setOverride({ signature, ids });
    return ids;
  }

  if (!reorderable) {
    return (
      <ul className="border-hairline divide-hairline mt-8 divide-y overflow-hidden rounded-xl border">
        {items.map((item) => (
          <EntityRow
            key={item.id}
            resource={resource}
            item={item}
            favoritable={hasFavorites}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {hasFavorites && (
        <ReorderSection
          resource={resource}
          title="Favorites"
          hint="Pinned above everything else, however new the rest are."
          items={favorites}
          favoritable
          onReorder={(next) => reorder(next, [])}
        />
      )}

      <ReorderSection
        resource={resource}
        title={hasFavorites ? "All others" : null}
        items={rest}
        favoritable={hasFavorites}
        // Favorites keep the leading block of `order` values, so the two groups
        // can never interleave once the server rewrites positions.
        onReorder={(next) => reorder(next, hasFavorites ? favorites : [])}
      />
    </div>
  );
}

/** Reorders by id, dropping ids that no longer exist and appending new ones. */
function applyOverride(items: EntityListItem[], ids?: string[]): EntityListItem[] {
  if (!ids) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as EntityListItem[];
  const seen = new Set(ordered.map((item) => item.id));

  return [...ordered, ...items.filter((item) => !seen.has(item.id))];
}

function ReorderSection({
  resource,
  title,
  hint,
  items,
  onReorder,
  favoritable,
}: {
  resource: string;
  title: string | null;
  hint?: string;
  items: EntityListItem[];
  /** Returns the full id order to persist, including any preceding group. */
  onReorder: (items: EntityListItem[]) => string[];
  favoritable: boolean;
}) {
  const [, startTransition] = useTransition();
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);

  if (items.length === 0 && title) return null;

  return (
    <section>
      {title && (
        <div className="mb-3">
          <h2 className="lab-label text-muted-foreground">{title}</h2>
          {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
      )}

      {items.length === 0 ? (
        <p className="border-hairline text-muted-foreground rounded-xl border border-dashed px-6 py-10 text-center text-sm">
          Nothing here yet.
        </p>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          // Fires on every row crossed during a drag, so it only stages the
          // result. Persisting here would be one write per row passed over.
          onReorder={(next) => setPendingIds(onReorder(next))}
          className="border-hairline divide-hairline divide-y overflow-hidden rounded-xl border"
        >
          {items.map((item) => (
            <EntityRow
              key={item.id}
              resource={resource}
              item={item}
              dragValue={item}
              favoritable={favoritable}
              onDragEnd={() => {
                if (!pendingIds) return;
                const ids = pendingIds;
                setPendingIds(null);
                startTransition(() => {
                  void reorderEntities(resource, ids);
                });
              }}
            />
          ))}
        </Reorder.Group>
      )}
    </section>
  );
}
