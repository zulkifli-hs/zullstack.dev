/**
 * Removes artefacts left behind by automated verification runs.
 *
 * Wrapped in an async main() rather than using top-level await: tsx compiles
 * these scripts to CJS, which has no top-level await.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: [".env.local", ".env"] });

async function main() {
  const { connectDB } = await import("../src/lib/db");
  const { Article, Comment, Like, Project } = await import("../src/lib/models");

  await connectDB();

  const article = await Article.findOne({ slug: "phase-3-smoke" }).select("_id");
  if (article) {
    const comments = await Comment.deleteMany({ articleId: article._id });
    const likes = await Like.deleteMany({ articleId: article._id });
    await article.deleteOne();
    console.log(
      `removed article phase-3-smoke (+${comments.deletedCount} comments, ${likes.deletedCount} likes)`,
    );
  }

  for (const slug of ["cdp-smoke-test", "upload-smoke-test"]) {
    const doc = await Project.findOne({ slug }).select("coverImage");
    if (!doc) continue;

    // Delete the Cloudinary asset too, or verification runs slowly fill the
    // account with orphaned images no document references.
    const publicId = doc.coverImage?.publicId;
    if (publicId) {
      const { v2: cloudinary } = await import("cloudinary");
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const destroyed = await cloudinary.uploader.destroy(publicId);
      console.log(`  cloudinary ${publicId}: ${destroyed.result}`);
    }

    await doc.deleteOne();
    console.log(`removed project ${slug}`);
  }

  await mongoose.disconnect();
  console.log("cleanup done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
