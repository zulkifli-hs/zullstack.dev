import {
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Cpu,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Landmark,
  Newspaper,
  PanelsTopLeft,
  Shapes,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/content-enums";
import type { Project } from "@/types/content";

/**
 * The glyph for each domain.
 *
 * Split from `content-enums.ts` on the same principle that module is split from
 * `models/shared.ts`: the enum is data that both the schema and the browser
 * need, while this is a table of React components. Importing it from a Mongoose
 * schema would drag `lucide-react` into the server bundle for nothing.
 *
 * `Record<ProjectCategory, …>` rather than a lookup with a fallback: adding a
 * category to the enum and forgetting the icon should be a type error, not a
 * blank square that nobody notices until it ships.
 */
export const CATEGORY_ICONS: Record<ProjectCategory, LucideIcon> = {
  govtech: Landmark,
  saas: Workflow,
  marketplace: ShoppingBag,
  community: Users,
  "data-analytics": ChartNoAxesCombined,
  ai: Sparkles,
  "field-ops": ClipboardCheck,
  corporate: Building2,
  fintech: CreditCard,
  edtech: GraduationCap,
  healthtech: HeartPulse,
  logistics: Truck,
  iot: Cpu,
  devtools: Wrench,
  "internal-tools": PanelsTopLeft,
  media: Newspaper,
  other: Shapes,
};

/**
 * The categories actually present in a set of projects, in enum order, with
 * how many projects each holds.
 *
 * Derived rather than declared, which is what makes the enum safe to run ahead
 * of the work: `fintech` can sit in the vocabulary for a year without ever
 * rendering an empty chip that filters down to nothing, and the day a fintech
 * project is published its chip appears on its own.
 *
 * Enum order rather than count order so the chips do not reshuffle themselves
 * every time a project is added — a filter row whose buttons move is a filter
 * row people misclick.
 */
export function categoryFacets(items: Project[]): { category: ProjectCategory; count: number }[] {
  const counts = new Map<ProjectCategory, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return PROJECT_CATEGORIES.filter((category) => counts.has(category)).map((category) => ({
    category,
    count: counts.get(category) ?? 0,
  }));
}
