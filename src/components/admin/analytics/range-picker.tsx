"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { RANGES, type RangeKey } from "@/lib/analytics/range";

const LABELS: Record<RangeKey, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  "12mo": "12 months",
};

/**
 * The time range, held in the URL rather than in component state.
 *
 * That is what makes a particular view linkable and survivable across a reload,
 * and it is what lets the page stay a Server Component: the range is an input
 * to the render, not something the client re-fetches for.
 */
export function RangePicker({ value }: { value: RangeKey }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <Segmented
      value={[value]}
      onValueChange={(next) => {
        const key = (next as string[])[0];
        if (!key) return;
        const search = new URLSearchParams(params.toString());
        search.set("range", key);
        startTransition(() => router.replace(`/admin/analytics?${search}`));
      }}
      data-pending={pending ? "" : undefined}
      className="data-pending:opacity-60"
    >
      {(Object.keys(RANGES) as RangeKey[]).map((key) => (
        <SegmentedItem key={key} value={key}>
          {LABELS[key]}
        </SegmentedItem>
      ))}
    </Segmented>
  );
}
