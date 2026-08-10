/**
 * Folds one-position experience documents into one document per company.
 *
 *   pnpm migrate:experience            # apply
 *   pnpm migrate:experience --dry-run  # report what would change, write nothing
 *
 * Why: a document per job title cannot express two jobs held at once. Sorted by
 * start date, three roles at one employer and three at another interleave into
 * six fragments, and the reader has to reassemble both histories from the dates.
 *
 * What it does:
 *   company (string)  → a Partner with kind "employer", created if missing
 *   the six inline position fields → one entry in `positions[]`
 *   techStack         → skills
 *   then unsets the legacy fields.
 *
 * Idempotent: documents that already carry `positions` are skipped, and partners
 * are matched by slug before being created, so a second run is a no-op.
 */
import { config } from "dotenv";
import mongoose, { type Types } from "mongoose";

// Next.js loads .env.local automatically; a standalone script does not.
config({ path: [".env.local", ".env"] });

import { connectDB } from "../src/lib/db";
import { Experience, Partner } from "../src/lib/models";

const dryRun = process.argv.includes("--dry-run");

type LegacyExperience = {
  _id: Types.ObjectId;
  company?: string;
  companyUrl?: string;
  logo?: Record<string, unknown>;
  position?: { en?: string; id?: string };
  employmentType?: string;
  locationType?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date | null;
  current?: boolean;
  highlights?: { en?: string[]; id?: string[] };
  techStack?: string[];
  positions?: unknown[];
  partner?: unknown;
  order?: number;
  status?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function migrate() {
  await connectDB();
  console.log(`connected${dryRun ? " (dry run — nothing will be written)" : ""}\n`);

  // Raw collection access: the schema still declares the legacy fields as
  // read-only leftovers, but reading through the model would drop anything it
  // no longer knows about, and there would be nothing left to migrate.
  const collection = Experience.collection;

  const docs = (await collection
    .find({ company: { $exists: true, $ne: null } })
    .sort({ startDate: -1 })
    .toArray()) as unknown as LegacyExperience[];

  const legacy = docs.filter((doc) => !doc.positions || doc.positions.length === 0);

  if (legacy.length === 0) {
    console.log("Nothing to migrate — every document already has positions.");
    return;
  }

  // Grouped by company name rather than by adjacency: two jobs at once
  // interleave by date, so the same employer appears twice in a sorted list
  // with another company in between.
  const byCompany = new Map<string, LegacyExperience[]>();
  for (const doc of legacy) {
    const key = String(doc.company ?? "").trim();
    if (!key) continue;
    byCompany.set(key, [...(byCompany.get(key) ?? []), doc]);
  }

  console.log(`${legacy.length} positions across ${byCompany.size} companies\n`);

  for (const [company, entries] of byCompany) {
    const slug = slugify(company);

    let partner = await Partner.findOne({ slug }).lean();
    const withLogo = entries.find((entry) => entry.logo?.url);
    const withUrl = entries.find((entry) => entry.companyUrl);

    if (!partner) {
      console.log(`  + partner "${company}" (${slug}) — employer`);
      if (!dryRun) {
        partner = (
          await Partner.create({
            slug,
            name: company,
            kind: "employer",
            url: withUrl?.companyUrl ?? "",
            logo: withLogo?.logo,
            // Published so the timeline can populate it. Employers are filtered
            // out of the public partners page by kind, not by status.
            status: "published",
          })
        ).toObject();
      }
    } else {
      console.log(`  = partner "${company}" already registered`);
    }

    // Oldest first, so `positions[0]` is where the story at this company began.
    const positions = [...entries]
      .sort((a, b) => new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime())
      .map((entry) => ({
        position: { en: entry.position?.en ?? "", id: entry.position?.id ?? "" },
        employmentType: entry.employmentType ?? "full-time",
        locationType: entry.locationType ?? "onsite",
        location: entry.location ?? "",
        startDate: entry.startDate ?? null,
        endDate: entry.endDate ?? null,
        current: Boolean(entry.current),
        highlights: { en: entry.highlights?.en ?? [], id: entry.highlights?.id ?? [] },
        skills: entry.techStack ?? [],
        media: [],
      }));

    for (const position of positions) {
      console.log(`      · ${position.position.en || "(untitled)"} — ${position.skills.length} skills`);
    }

    // The most recent document becomes the company; the rest are folded into it
    // and removed, so the ids that survive are the ones most likely bookmarked.
    const [keep, ...fold] = entries;

    console.log(
      `    → 1 company document with ${positions.length} positions` +
        (fold.length > 0 ? `, removing ${fold.length} folded document(s)` : ""),
    );

    if (dryRun) continue;

    await collection.updateOne(
      { _id: keep._id },
      {
        $set: {
          partner: partner?._id,
          positions,
          status: keep.status ?? "published",
        },
        $unset: {
          company: "",
          companyUrl: "",
          logo: "",
          position: "",
          employmentType: "",
          locationType: "",
          location: "",
          startDate: "",
          endDate: "",
          current: "",
          highlights: "",
          techStack: "",
        },
      },
    );

    if (fold.length > 0) {
      await collection.deleteMany({ _id: { $in: fold.map((entry) => entry._id) } });
    }
  }

  if (!dryRun) {
    // The index moved from startDate to order when positions became nested.
    await Experience.syncIndexes();
    console.log("\nindexes synced");
  }

  console.log(dryRun ? "\nDry run complete — nothing was written." : "\nMigration complete.");
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
