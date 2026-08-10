"use client";

import { useCallback, useSyncExternalStore } from "react";

import { setLensParams } from "@/lib/glass/lens-registry";
import {
  cssVars,
  DEFAULT_PARAMS,
  GLASS_STORAGE_KEY,
  normalizeParams,
  type GlassParams,
} from "@/lib/glass/lens-params";

const EVENT = "zullstack:glass";

let current: GlassParams = DEFAULT_PARAMS;
let hydrated = false;

/**
 * Reads the stored params once, then serves the in-memory copy.
 *
 * `useSyncExternalStore` compares by identity, so this must return a stable
 * object between writes — parsing localStorage on every call would both thrash
 * and loop.
 */
function snapshot(): GlassParams {
  if (!hydrated) {
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(GLASS_STORAGE_KEY);
      if (raw) current = normalizeParams(JSON.parse(raw));
    } catch {
      // Unparseable or storage blocked — defaults are already correct.
    }
    setLensParams(current);
  }
  return current;
}

/** The server cannot know a stored value, and the CSS defaults match these. */
const serverSnapshot = () => DEFAULT_PARAMS;

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The live material parameters.
 *
 * Writes split two ways, and the split is the whole design:
 *
 *   - the CSS half lands on <html> as custom properties and repaints in the
 *     same frame, costing nothing;
 *   - the map half goes to the lens registry, which invalidates every cached
 *     map and re-runs the worker. That is tens of milliseconds per geometry, so
 *     callers must debounce it — see `GlassControls`.
 */
export function useGlassParams() {
  const params = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const setParams = useCallback((next: Partial<GlassParams>) => {
    current = normalizeParams({ ...current, ...next });

    const root = document.documentElement;
    for (const [name, value] of Object.entries(cssVars(current))) {
      root.style.setProperty(name, value);
    }

    setLensParams(current);

    try {
      window.localStorage.setItem(GLASS_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Private browsing: the settings still apply for this session.
    }

    window.dispatchEvent(new Event(EVENT));
  }, []);

  const reset = useCallback(() => {
    current = { ...DEFAULT_PARAMS };
    const root = document.documentElement;
    for (const name of Object.keys(cssVars(current))) root.style.removeProperty(name);
    setLensParams(current);
    try {
      window.localStorage.removeItem(GLASS_STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { params, setParams, reset };
}
