/**
 * Number formatting for the analytics dashboard.
 *
 * A plain module — deliberately with no `"use client"`. This function used to
 * live in `trend-chart.tsx`, which is a client module, and every export of a
 * client module becomes a *client reference* when a Server Component imports
 * it: renderable as a component, but not callable. The dashboard page called
 * it on the server and got "Attempted to call compact() from the server".
 *
 * The build does not catch that — it is a render-time error, and the page sits
 * behind sign-in, so nothing renders it during the build. Keep non-component
 * helpers out of `"use client"` files.
 */
export function compact(value: number): string {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
