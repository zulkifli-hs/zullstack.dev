/**
 * Backfills `project.category` — the domain the work is in.
 *
 *   pnpm migrate:categories          # print what would change, write nothing
 *   pnpm migrate:categories --apply  # write it
 *
 * Two things make this necessary rather than optional.
 *
 * First, `category` is not a new *key*. Documents seeded before the field meant
 * anything carry `"web"` or `"mobile"` there — a copy of `platforms` under a
 * name that now means something else entirely. The read layer coerces those to
 * `other` so nothing crashes, but leaving them would file every project on the
 * site under "Other" and make the filter useless the day it shipped.
 *
 * Second, Mongoose only applies a schema default when a document is created or
 * saved. Adding `default: "other"` to the schema does nothing at all to the
 * fourteen documents already in the collection.
 *
 * The assignments below are per-slug rather than inferred from the tech stack,
 * because the domain is a judgement about what the software was *for* — no
 * heuristic gets "an anti-fraud monitor for a ministry" out of a list that
 * reads Next.js, Express and Server-Sent Events. Anything not named here is
 * left alone for the CMS to categorise by hand; the same is true of anything
 * that already carries a valid category, so a re-run never overwrites an
 * editor's decision.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

// Next.js loads .env.local automatically; a standalone script does not.
config({ path: [".env.local", ".env"] });

import { connectDB } from "../src/lib/db";
import { Project } from "../src/lib/models";
import { PROJECT_CATEGORIES, type ProjectCategory } from "../src/lib/content-enums";

/**
 * Slug → domain, decided by reading each project's summary and role.
 *
 * Where two domains are arguably true the *primary* one wins, because the
 * field is single-valued: Culminaite is a SaaS product, but the thing that
 * distinguishes it from every other SaaS here is that the product is the AI.
 * Satu Matrix and RITJ both serve government, but both are dashboards over a
 * data set, and "Govtech" would collapse them into the correspondence system
 * they have nothing else in common with.
 */
const CATEGORIES: Record<string, ProjectCategory> = {
  "saman-anti-fraud-monitoring": "govtech",
  "e-persuratan-ditprasarana": "govtech",
  "satu-matrix": "data-analytics",
  "ritj-dashboard": "data-analytics",
  culminaite: "ai",
  idbuild: "saas",
  "pawship-grooming": "saas",
  wikiexport: "marketplace",
  warnas: "marketplace",
  hipmigo: "community",
  adigsi: "community",
  "pbhmi-datacentrum": "community",
  "it-care-inspection": "field-ops",
  dutafirza: "corporate",
};

const isValid = (value: unknown): value is ProjectCategory =>
  PROJECT_CATEGORIES.includes(value as ProjectCategory);

async function main() {
  const apply = process.argv.includes("--apply");

  await connectDB();

  const docs = (await Project.find({}).select("slug category").lean()) as {
    _id: unknown;
    slug: string;
    category?: unknown;
  }[];

  const planned: { slug: string; from: string; to: ProjectCategory }[] = [];
  const skipped: string[] = [];
  const unknown: string[] = [];

  for (const doc of docs) {
    if (isValid(doc.category)) {
      skipped.push(doc.slug);
      continue;
    }

    const target = CATEGORIES[doc.slug];
    if (!target) {
      unknown.push(doc.slug);
      continue;
    }

    planned.push({ slug: doc.slug, from: String(doc.category ?? "—"), to: target });
  }

  for (const change of planned) {
    console.log(`  ${change.slug}: ${change.from} → ${change.to}`);
  }

  if (skipped.length > 0) {
    console.log(`\n  already categorised (left alone): ${skipped.join(", ")}`);
  }

  if (unknown.length > 0) {
    console.log(
      `\n  no mapping, defaulted to "other" — set these in the CMS: ${unknown.join(", ")}`,
    );
  }

  if (!apply) {
    console.log(`\n${planned.length} project(s) would change. Re-run with --apply to write.`);
    await mongoose.disconnect();
    return;
  }

  for (const change of planned) {
    await Project.updateOne({ slug: change.slug }, { $set: { category: change.to } });
  }

  // Anything the read layer would coerce still gets a real stored value, so the
  // CMS shows the same thing the site does rather than an empty select.
  if (unknown.length > 0) {
    await Project.updateMany({ slug: { $in: unknown } }, { $set: { category: "other" } });
  }

  console.log(`\nUpdated ${planned.length + unknown.length} project(s).`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
