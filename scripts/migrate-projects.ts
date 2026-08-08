/**
 * Moves existing project documents onto the expanded schema.
 *
 *   pnpm migrate:projects            # apply
 *   pnpm migrate:projects --dry-run  # report what would change, write nothing
 *
 * MongoDB has no migration runner in this repo, so schema changes that need to
 * touch stored data live here as one-off scripts. This one is idempotent: it
 * only acts on documents that still carry the old fields, so re-running it is
 * harmless.
 *
 * What it does:
 *   category  → platforms[]   (backend becomes api; the rest keep their name)
 *   repoUrl   → links[{ kind: "repo", access: "public" }]
 *   liveUrl   → links[{ kind: "live", access: "public" }]
 *   lifecycle → "live" where absent
 *   then unsets category / repoUrl / liveUrl.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

// Next.js loads .env.local automatically; a standalone script does not.
config({ path: [".env.local", ".env"] });

import { connectDB } from "../src/lib/db";
import { Partner, Project } from "../src/lib/models";

const dryRun = process.argv.includes("--dry-run");

const CATEGORY_TO_PLATFORM: Record<string, string> = {
  web: "web",
  mobile: "mobile",
  backend: "api",
  devops: "devops",
  other: "other",
};

type LegacyProject = {
  _id: unknown;
  slug?: string;
  category?: string;
  repoUrl?: string;
  liveUrl?: string;
  platforms?: string[];
  lifecycle?: string;
  links?: unknown[];
};

async function migrate() {
  await connectDB();
  console.log(`connected${dryRun ? " (dry run — nothing will be written)" : ""}\n`);

  // Raw collection access on purpose: the Mongoose schema no longer declares
  // `category`, `repoUrl` or `liveUrl`, so a modelled read would not return
  // them and there would be nothing to migrate.
  const collection = Project.collection;

  const docs = (await collection
    .find({
      $or: [
        { category: { $exists: true } },
        { repoUrl: { $exists: true } },
        { liveUrl: { $exists: true } },
        { lifecycle: { $exists: false } },
      ],
    })
    .toArray()) as LegacyProject[];

  if (docs.length === 0) {
    console.log("nothing to migrate — every project is already on the new shape");
  }

  for (const doc of docs) {
    const set: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    if (doc.category) {
      // Never overwrite platforms an editor has already set by hand.
      if (!doc.platforms?.length) {
        set.platforms = [CATEGORY_TO_PLATFORM[doc.category] ?? "other"];
      }
      unset.category = "";
    }

    const links = Array.isArray(doc.links) ? [...doc.links] : [];
    const kinds = new Set(
      links.map((link) => (link as { kind?: string })?.kind).filter(Boolean) as string[],
    );

    if (doc.liveUrl && !kinds.has("live")) {
      links.push({ kind: "live", access: "public", url: doc.liveUrl, label: { en: "", id: "" } });
    }
    if (doc.repoUrl && !kinds.has("repo")) {
      links.push({ kind: "repo", access: "public", url: doc.repoUrl, label: { en: "", id: "" } });
    }
    if (doc.liveUrl) unset.liveUrl = "";
    if (doc.repoUrl) unset.repoUrl = "";
    if (links.length !== (doc.links?.length ?? 0)) set.links = links;

    if (!doc.lifecycle) set.lifecycle = "live";

    if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) continue;

    const summary = [
      set.platforms && `platforms=${JSON.stringify(set.platforms)}`,
      set.links && `links=${(set.links as unknown[]).length}`,
      set.lifecycle && `lifecycle=${set.lifecycle}`,
      Object.keys(unset).length > 0 && `unset ${Object.keys(unset).join(", ")}`,
    ]
      .filter(Boolean)
      .join("  ");

    console.log(`  ${doc.slug ?? doc._id}: ${summary}`);

    if (dryRun) continue;

    await collection.updateOne(
      { _id: doc._id as never },
      {
        ...(Object.keys(set).length > 0 && { $set: set }),
        ...(Object.keys(unset).length > 0 && { $unset: unset }),
      },
    );
  }

  if (!dryRun) {
    // Indexes are declared on the schemas but only ever built on demand — the
    // new partner lookup index would otherwise never exist in an existing
    // database, and the old category index would linger.
    await Promise.all([Project.syncIndexes(), Partner.syncIndexes()]);
    console.log("\nindexes synced");
  }

  await mongoose.disconnect();
  console.log(dryRun ? "\ndry run complete" : "done");
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
