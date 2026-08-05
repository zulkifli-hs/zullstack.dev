import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/glass/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Section heading in the lab register: a mono eyebrow, a display title, and an
 * optional "see all" link. Every section on the site uses this, which is what
 * makes the vocabulary feel like one instrument rather than nine pages.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  cta,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        <p className="lab-label text-signal">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-3 text-sm text-pretty sm:text-base">
            {description}
          </p>
        )}
      </div>

      {href && cta && (
        <Link
          href={href}
          className="text-link group inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
        >
          {cta}
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-6 py-16 sm:py-20", className)}>
      {children}
    </section>
  );
}

/**
 * Consistent empty state, so an unseeded collection reads as intentional.
 *
 * Glass rather than the old dashed outline: a dashed border cannot coexist with
 * the material, because `glass` spends the border on the rim-light gradient that
 * makes the edge read as an edge.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <GlassPanel
      variant="glass"
      tier="card"
      padding="none"
      className="text-muted-foreground px-6 py-14 text-center text-sm"
    >
      {message}
    </GlassPanel>
  );
}

/** Small mono tag used for tech stack, topics and categories. */
export function Tag({ children }: { children: ReactNode }) {
  return <Badge shape="tag">{children}</Badge>;
}
