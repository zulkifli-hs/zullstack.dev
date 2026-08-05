"use client";

import { useCallback, useSyncExternalStore } from "react";

import { TRANSPARENCY_STORAGE_KEY } from "@/components/providers/transparency-script";

export type TransparencyMode = "full" | "reduced";

const EVENT = "zullstack:transparency";

/**
 * The `data-transparency` attribute on <html> is the source of truth, not React
 * state — the blocking script in <head> already set it before hydration, so
 * reading it back is what keeps server and client agreeing.
 */
function getSnapshot(): TransparencyMode {
  return document.documentElement.getAttribute("data-transparency") === "reduced"
    ? "reduced"
    : "full";
}

/** The server cannot know a localStorage value; "full" matches the CSS default. */
function getServerSnapshot(): TransparencyMode {
  return "full";
}

function subscribe(onChange: () => void) {
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useTransparency() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: TransparencyMode) => {
    const root = document.documentElement;
    if (next === "reduced") root.setAttribute("data-transparency", "reduced");
    else root.removeAttribute("data-transparency");

    try {
      window.localStorage.setItem(TRANSPARENCY_STORAGE_KEY, next);
    } catch {
      // Private browsing or storage disabled: the toggle still works for this
      // session, it just will not persist.
    }

    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => {
    setMode(getSnapshot() === "reduced" ? "full" : "reduced");
  }, [setMode]);

  return { mode, setMode, toggle };
}
