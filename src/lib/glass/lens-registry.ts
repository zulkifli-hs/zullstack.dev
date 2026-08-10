"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import { DEFAULT_PARAMS, type MapParams } from "./lens-params";
import type { LensSpec } from "./lens-math";
import type { LensRequest, LensResponse } from "./lens-worker";

/**
 * Cache and de-duplication for runtime lens maps.
 *
 * The single fact this exists to exploit: a displacement map depends only on
 * *geometry*, never on content. Nine cards in a three-column grid are the same
 * size, so they are the same map — which turns nine ~35ms generations into one.
 * Without that collapse the runtime approach would not be viable at all.
 */

/**
 * Sizes are rounded into 8px buckets before they become a cache key.
 *
 * The trade is deliberate. Exact sizes would thrash the cache during a resize
 * and miss between cards that differ by a pixel of rounding; an 8px bucket on a
 * ~355px card is at most 2% of stretch in the filter region. That is nothing
 * against the bug being fixed here, which was a 360px-wide map stretched across
 * a 1104px row — a bevel band three times too wide.
 */
const QUANTUM = 8;

/**
 * Below this, a bespoke map buys nothing a static tier map does not already
 * give, and the fixed cost of a worker round-trip dominates.
 */
const MIN_SIZE = 64;

/** Distinct geometries kept alive at once. Unreferenced entries evict first. */
const MAX_ENTRIES = 16;

export type LensEntry = {
  key: string;
  filterId: string;
  status: "pending" | "ready" | "failed";
  displacement?: string;
  specular?: string;
  scale?: number;
  pad?: number;
  width?: number;
  height?: number;
};

type Internal = LensEntry & { refs: number; usedAt: number };

const entries = new Map<string, Internal>();
const listeners = new Map<string, Set<() => void>>();
const globalListeners = new Set<() => void>();

let params: MapParams = { ...DEFAULT_PARAMS };
let worker: Worker | null = null;
let workerBroken = false;
let seq = 0;

/**
 * `useSyncExternalStore` compares snapshots by identity, so `readyEntries` must
 * hand back the *same* array until something actually changes — rebuilding it
 * per call is an infinite render loop, not a performance detail.
 */
let readySnapshot: LensEntry[] = [];
let readyDirty = true;

function invalidate() {
  readyDirty = true;
}

function emit(key: string) {
  invalidate();
  for (const fn of listeners.get(key) ?? []) fn();
  for (const fn of globalListeners) fn();
}

function revoke(entry: Internal) {
  if (entry.displacement) URL.revokeObjectURL(entry.displacement);
  if (entry.specular) URL.revokeObjectURL(entry.specular);
}

/**
 * Evicts unreferenced entries once the cache is over budget.
 *
 * Refcounting rather than a plain LRU because the values are object URLs:
 * revoking one that a mounted filter is still pointing at does not degrade
 * gracefully, it blanks the element's backdrop.
 */
function sweep() {
  if (entries.size <= MAX_ENTRIES) return;

  const evictable = [...entries.values()]
    .filter((e) => e.refs === 0)
    .sort((a, b) => a.usedAt - b.usedAt);

  for (const entry of evictable) {
    if (entries.size <= MAX_ENTRIES) break;
    revoke(entry);
    entries.delete(entry.key);
    listeners.delete(entry.key);
    invalidate();
  }
}

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL("./lens-worker.ts", import.meta.url), { type: "module" });
    worker.addEventListener("message", (event: MessageEvent<LensResponse>) => {
      const data = event.data;
      const current = entries.get(data.id);
      if (!current) {
        // Evicted while in flight — the URLs would leak otherwise.
        if (data.ok) {
          URL.revokeObjectURL(data.displacement);
          URL.revokeObjectURL(data.specular);
        }
        return;
      }

      entries.set(
        data.id,
        data.ok
          ? {
              ...current,
              status: "ready",
              displacement: data.displacement,
              specular: data.specular,
              scale: data.scale,
              pad: data.pad,
              width: data.width,
              height: data.height,
            }
          : { ...current, status: "failed" },
      );
      emit(data.id);
    });

    worker.addEventListener("error", () => {
      // Blocked by CSP, unsupported, or a bundling failure. Every surface stays
      // on its static tier map, which is a plainer lens rather than a broken one.
      workerBroken = true;
      for (const [key, entry] of entries) {
        if (entry.status === "pending") {
          entries.set(key, { ...entry, status: "failed" });
          emit(key);
        }
      }
    });
  } catch {
    workerBroken = true;
    return null;
  }

  return worker;
}

export type LensRequestInput = {
  width: number;
  height: number;
  radius: number;
};

const bucket = (n: number) => Math.max(MIN_SIZE, Math.round(n / QUANTUM) * QUANTUM);

/** A corner cannot exceed half the shorter side, whatever CSS reports. */
const fitRadius = (radius: number, width: number, height: number) =>
  Math.min(Math.round(radius), width / 2, height / 2);

/**
 * The bevel a given box can actually carry.
 *
 * `params.bevel` is an absolute width, which is the right way to *ask* for a
 * material — but 28px of bevel on a 143px-tall article row would put the top
 * and bottom bands within a few pixels of meeting, and the flat centre the lens
 * needs in order to read as glass rather than a smear would be gone. Capping
 * against the shorter side is what lets one setting serve a 492px card and a
 * 143px row. Only the runtime path can do this; a static tier cannot know.
 */
function fitBevel(width: number, height: number): number {
  const limit = Math.min(width, height) * 0.18;
  return Math.max(6, Math.min(params.bevel, limit));
}

/** `null` when the element is too small or the input is not measurable yet. */
export function lensKey(input: LensRequestInput | null): string | null {
  if (!input || input.width < MIN_SIZE || input.height < MIN_SIZE) return null;
  const w = bucket(input.width);
  const h = bucket(input.height);
  // Clamped here as well as in the spec, so `border-radius: 9999px` and
  // `rounded-full` (which computes to ~3.4e7) collapse to the same key instead
  // of building two identical maps under two names.
  const r = fitRadius(input.radius, w, h);
  const p = params;
  return [
    w,
    h,
    r,
    p.profile,
    p.bevel,
    p.ior,
    p.thickness,
    p.specularAngle,
    p.specularOpacity,
    p.specularSaturation,
  ].join("|");
}

function ensure(key: string, input: LensRequestInput) {
  const existing = entries.get(key);
  if (existing) {
    existing.usedAt = ++seq;
    return;
  }

  const entry: Internal = {
    key,
    // Stable, DOM-id-safe, and derived from the key so two elements with the
    // same geometry genuinely share one <filter> element.
    filterId: `zl-lens-rt-${cssId(key)}`,
    status: "pending",
    refs: 0,
    usedAt: ++seq,
  };
  entries.set(key, entry);

  const lensWorker = getWorker();
  if (!lensWorker) {
    entries.set(key, { ...entry, status: "failed" });
    return;
  }

  const w = bucket(input.width);
  const h = bucket(input.height);

  const spec: LensSpec = {
    width: w,
    height: h,
    radius: fitRadius(input.radius, w, h),
    bevel: fitBevel(w, h),
    profile: params.profile,
    ior: params.ior,
    thickness: params.thickness,
    specularAngle: params.specularAngle,
    specularOpacity: params.specularOpacity,
    specularSaturation: params.specularSaturation,
    // 3x displays triple the pixel count for a normal map no one can resolve.
    dpr: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
  };

  const message: LensRequest = { id: key, spec };
  lensWorker.postMessage(message);
  sweep();
}

/** Key characters that are legal in a CSS identifier and a `url(#…)` reference. */
const cssId = (key: string) => key.replace(/[^a-zA-Z0-9]/g, "-");

/** Replaces the material parameters and drops every map baked with the old set. */
export function setLensParams(next: MapParams) {
  params = { ...next };
  for (const [key, entry] of entries) {
    // A referenced entry keeps its URLs until its last consumer unmounts —
    // which happens on the next render, because the key it asks for has just
    // changed. Revoking here would blank those elements for a frame.
    if (entry.refs > 0) continue;
    revoke(entry);
    entries.delete(key);
    listeners.delete(key);
  }
  invalidate();
  for (const fn of globalListeners) fn();
}

export function getLensParams(): MapParams {
  return params;
}

/** Every entry with a usable map, for the provider's `<defs>` pool. */
export function readyEntries(): LensEntry[] {
  if (readyDirty) {
    readySnapshot = [...entries.values()].filter((e) => e.status === "ready");
    readyDirty = false;
  }
  return readySnapshot;
}

/** No runtime maps exist during SSR, and the static tiers cover that frame. */
export function noEntries(): LensEntry[] {
  return EMPTY;
}

const EMPTY: LensEntry[] = [];

export function subscribeAll(onChange: () => void) {
  globalListeners.add(onChange);
  return () => {
    globalListeners.delete(onChange);
  };
}

const NO_ENTRY = null;

/**
 * Requests a map for `input` and reports its state.
 *
 * Returns `null` until a map exists, which is the signal to keep using the
 * static tier filter. That fallback is not a nicety: pointing `feImage` at a
 * URL that has not loaded leaves `feDisplacementMap` with no map, and Chromium
 * paints that as transparent black — the panel's backdrop blinking out.
 */
export function useLens(input: LensRequestInput | null): LensEntry | null {
  const key = lensKey(input);

  useEffect(() => {
    if (!key || !input) return;
    ensure(key, input);

    const entry = entries.get(key);
    if (entry) entry.refs += 1;

    return () => {
      const current = entries.get(key);
      if (current) {
        current.refs -= 1;
        current.usedAt = ++seq;
      }
      sweep();
    };
    // `input` is re-derived on every render; `key` is its stable projection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!key) return () => {};
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      return () => {
        set?.delete(onChange);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    if (!key) return NO_ENTRY;
    const entry = entries.get(key);
    return entry && entry.status === "ready" ? entry : NO_ENTRY;
  }, [key]);

  return useSyncExternalStore(subscribe, getSnapshot, () => NO_ENTRY);
}
