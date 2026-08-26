import type { ReactNode } from "react";

import { EmptyState, SectionHeading } from "@/components/lab/section";

/**
 * Standard listing-page frame: heading block, then content or an empty state.
 *
 * Every listing page is otherwise identical boilerplate, and routing the empty
 * case through here means an unseeded collection can never render as a blank
 * page by accident.
 */
export function ListingPage({
  eyebrow,
  title,
  description,
  isEmpty,
  emptyMessage,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  isEmpty: boolean;
  emptyMessage: string;
  /** Controls for the list, at the end of the title row. See `SectionHeading`. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-20">
      {/* No controls over an empty collection: a filter button on a page that
          says "nothing published yet" offers to narrow down nothing. */}
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={isEmpty ? undefined : action}
      />
      <div className="mt-12">{isEmpty ? <EmptyState message={emptyMessage} /> : children}</div>
    </main>
  );
}
