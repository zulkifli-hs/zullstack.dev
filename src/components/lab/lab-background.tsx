import { cn } from "@/lib/utils";

/**
 * The page substrate: a soft brand mesh gradient with a blueprint grid on top.
 *
 * Glass belongs over *this*, not over photography. Straight grid lines visibly
 * bending at a panel's rim are what prove the surface is a lens rather than a
 * blur — photos hide the effect entirely. It also happens to be the cheapest
 * possible background, which matters because the frame budget is already going
 * to backdrop-filter.
 */
export function LabBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Mesh gradient — the only saturated colour on the page. The glass picks
          it up as an adaptive tint for free, which is our approximation of
          Apple's "light spills onto the surface". */}
      {/* Light mode carries a stronger mesh than dark for the same reason the
          grid does: colour at low alpha over white is a weaker figure than the
          same colour over near-black, and a lens with a flat backdrop has
          nothing to prove itself against. */}
      <div className="bg-brand-600/28 dark:bg-brand-600/25 absolute -top-1/4 left-1/2 h-[70vh] w-[80vw] -translate-x-1/2 rounded-full blur-[120px]" />
      <div className="bg-accent-400/16 dark:bg-accent-500/10 absolute top-1/3 -left-[10%] h-[50vh] w-[50vw] rounded-full blur-[130px]" />
      <div className="bg-brand-400/22 dark:bg-brand-700/20 absolute -right-[10%] bottom-0 h-[55vh] w-[55vw] rounded-full blur-[140px]" />

      {/* Blueprint grid, masked so it dissolves toward the edges instead of
          ending on a hard line.
          The falloff starts late (60%) because the old 35% stop meant a card
          sitting anywhere but the middle of the viewport had no grid left
          behind it to refract — the lens was correct and had nothing to bend. */}
      <div className="lab-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-20" />
    </div>
  );
}
