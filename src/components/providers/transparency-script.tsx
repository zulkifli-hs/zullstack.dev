export const TRANSPARENCY_STORAGE_KEY = "zullstack-transparency";

/**
 * Applies the stored glass-transparency preference before first paint.
 *
 * This exists because Safari does not implement `prefers-reduced-transparency`
 * at all — and macOS/iOS users who enable "Reduce Transparency" are exactly the
 * audience most likely to want it here. Without a manual override they would get
 * nothing. Runs synchronously in <head>, so there is no flash of full glass.
 */
export function TransparencyScript() {
  const script = `
    try {
      var v = localStorage.getItem(${JSON.stringify(TRANSPARENCY_STORAGE_KEY)});
      if (v === 'reduced') document.documentElement.setAttribute('data-transparency', 'reduced');
    } catch (e) {}
  `;

  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: script }} />;
}
