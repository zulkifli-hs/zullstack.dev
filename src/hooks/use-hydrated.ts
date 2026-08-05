"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * True only after hydration.
 *
 * Guards markup that depends on browser-only state (localStorage theme, media
 * queries) which the server cannot know and would otherwise hydrate-mismatch.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useState(false)` + `useEffect(() => setMounted(true))`: that pattern
 * triggers a cascading render and is flagged by the React Compiler's
 * `set-state-in-effect` rule. Here the server snapshot is simply `false` and
 * the client snapshot `true`, with nothing to subscribe to.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
