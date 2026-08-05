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
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-16 pb-8 sm:pt-20">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-12">{isEmpty ? <EmptyState message={emptyMessage} /> : children}</div>
    </main>
  );
}
