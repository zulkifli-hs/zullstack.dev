/**
 * Seeds the database from `seed-data.ts`, which holds Zulkifli's real content
 * transcribed from the CV and client portfolio deck.
 *
 *   pnpm seed          # insert only into collections that are still empty
 *   pnpm seed --reset  # wipe content collections first, then insert
 *
 * `--reset` is what you want after editing seed-data.ts. Without it, existing
 * documents are left alone so a re-run never clobbers CMS edits.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

// Next.js loads .env.local automatically; a standalone script does not.
// Later files do not override earlier ones, so .env.local wins.
config({ path: [".env.local", ".env"] });

import { connectDB } from "../src/lib/db";
import {
  Article,
  Experience,
  MentoringTrack,
  OpenSource,
  Project,
  Resource,
  SiteConfig,
  Snippet,
  Testimonial,
} from "../src/lib/models";
import {
  articles,
  experience,
  mentoringTracks,
  openSource,
  projects,
  resources,
  siteConfig,
  snippets,
  testimonials,
} from "./seed-data";

const reset = process.argv.includes("--reset");

async function seed() {
  await connectDB();
  console.log(`connected${reset ? " (reset mode)" : ""}\n`);

  const collections = [
    { model: SiteConfig, data: [siteConfig], name: "SiteConfig" },
    { model: Project, data: projects, name: "Project" },
    { model: Experience, data: experience, name: "Experience" },
    { model: MentoringTrack, data: mentoringTracks, name: "MentoringTrack" },
    { model: Resource, data: resources, name: "Resource" },
    { model: Snippet, data: snippets, name: "Snippet" },
    { model: Article, data: articles, name: "Article" },
    { model: Testimonial, data: testimonials, name: "Testimonial" },
    { model: OpenSource, data: openSource, name: "OpenSource" },
  ];

  for (const { model, data, name } of collections) {
    if (reset) {
      const { deletedCount } = await model.deleteMany({});
      if (deletedCount) console.log(`  ${name}: cleared ${deletedCount}`);
    }

    if (data.length === 0) {
      console.log(`  ${name}: nothing to seed (add via the admin CMS)`);
      continue;
    }

    const existing = await model.countDocuments();
    if (existing > 0) {
      console.log(`  ${name}: ${existing} document(s) present, skipping — use --reset to replace`);
      continue;
    }

    await model.insertMany(data);
    console.log(`  ${name}: inserted ${data.length}`);
  }

  // Indexes are declared on the schemas but only built on demand.
  await Promise.all(collections.map(({ model }) => model.syncIndexes()));
  console.log("\nindexes synced");

  await mongoose.disconnect();
  console.log("done");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
