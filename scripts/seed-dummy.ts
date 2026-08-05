/**
 * Dummy content for feature testing only.
 *
 *   pnpm seed:dummy          # insert
 *   pnpm seed:dummy --remove # delete everything this script created
 *
 * EVERY record here is fabricated. Testimonials name no real person, the
 * articles are filler, and the open-source entries point at repositories that
 * are not Zulkifli's. All of them carry `[DUMMY]` in a visible field so they
 * cannot be mistaken for real content in the CMS, and `--remove` deletes them
 * by that marker rather than by guessing.
 *
 * This exists so comments, likes, moderation and the article layouts can be
 * exercised. Delete it all before launch.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: [".env.local", ".env"] });

const MARK = "[DUMMY]";
const remove = process.argv.includes("--remove");

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const articles = [
  {
    slug: "dummy-shipping-nextjs-16",
    title: {
      en: `${MARK} What changed when we moved to Next.js 16`,
      id: `${MARK} Apa yang berubah saat pindah ke Next.js 16`,
    },
    excerpt: {
      en: "Middleware became Proxy, request APIs went async, and caching turned opt-in. Notes from the migration.",
      id: "Middleware menjadi Proxy, API request jadi async, dan caching berubah opt-in. Catatan dari migrasi.",
    },
    content: {
      en: "<h2>Middleware is now Proxy</h2><p>The rename is not cosmetic. Keeping the old filename means the locale never resolves, and the error message points nowhere useful.</p><h2>Request APIs are async</h2><p>Synchronous access to <code>params</code>, <code>cookies()</code> and <code>headers()</code> was removed, not deprecated. Every page signature changes.</p><h2>Caching is opt-in</h2><p>Cache Components makes everything dynamic by default. That is the right default, but it inverts what you have to think about.</p>",
      id: "<h2>Middleware kini Proxy</h2><p>Penggantian nama ini bukan kosmetik. Mempertahankan nama file lama membuat locale tidak pernah ter-resolve, dan pesan errornya tidak menunjuk ke mana-mana.</p><h2>API request kini async</h2><p>Akses sinkron ke <code>params</code>, <code>cookies()</code>, dan <code>headers()</code> dihapus, bukan sekadar deprecated. Semua signature halaman berubah.</p><h2>Caching jadi opt-in</h2><p>Cache Components membuat semuanya dynamic secara default. Itu default yang benar, tapi membalik apa yang harus Anda pikirkan.</p>",
    },
    tags: ["nextjs", "migration"],
    readingTime: 6,
    publishedAt: daysAgo(4),
    order: 1,
    status: "published",
  },
  {
    slug: "dummy-mongoose-in-serverless",
    title: {
      en: `${MARK} Mongoose in a serverless runtime`,
      id: `${MARK} Mongoose di runtime serverless`,
    },
    excerpt: {
      en: "Why the cached connection promise is not optional, and what happens the day you forget the model guard.",
      id: "Mengapa cached connection promise bukan opsional, dan apa yang terjadi saat Anda lupa model guard.",
    },
    content: {
      en: "<p>Serverless instances are ephemeral. Every cold start opens a new pool, and without a cached promise a busy dev session will exhaust the connection limit within minutes.</p><h2>The model guard</h2><p>Hot reload re-executes the module. Re-registering a schema either throws or silently rebinds the model to a stale one — the second failure mode is the dangerous one, because it looks like missing data rather than an error.</p>",
      id: "<p>Instance serverless bersifat sementara. Setiap cold start membuka pool baru, dan tanpa cached promise sesi development yang sibuk akan menghabiskan batas koneksi dalam hitungan menit.</p><h2>Model guard</h2><p>Hot reload menjalankan ulang modul. Mendaftarkan schema dua kali akan error atau diam-diam mengikat model ke schema usang — mode kegagalan kedua ini yang berbahaya, karena tampak seperti data hilang, bukan seperti error.</p>",
    },
    tags: ["mongodb", "serverless"],
    readingTime: 4,
    publishedAt: daysAgo(18),
    order: 2,
    status: "published",
  },
  {
    slug: "dummy-liquid-glass-on-the-web",
    title: {
      en: `${MARK} Recreating Liquid Glass in the browser`,
      id: `${MARK} Membuat ulang Liquid Glass di browser`,
    },
    excerpt: {
      en: "Blur is not a lens. What actually sells the effect, and what genuinely cannot be done without Metal.",
      id: "Blur bukan lensa. Apa yang benar-benar menjual efeknya, dan apa yang memang mustahil tanpa Metal.",
    },
    content: {
      en: "<p>The mistake is reaching for a single <code>backdrop-filter: blur()</code>. Real glass is a tint, a blurred backdrop, an inset bevel, a gradient rim and a specular highlight — and the bevel sells thickness more than the blur does.</p><h2>Filter order matters</h2><p>Displacement has to run before the blur. Blur first and there are no crisp edges left to bend, so the panel just looks slightly brighter.</p>",
      id: "<p>Kesalahannya adalah mengandalkan satu <code>backdrop-filter: blur()</code>. Kaca sungguhan terdiri dari tint, backdrop yang di-blur, bevel di dalam, rim gradien, dan sorotan specular — dan bevel-lah yang menjual ketebalan, bukan blur-nya.</p><h2>Urutan filter menentukan</h2><p>Displacement harus dijalankan sebelum blur. Kalau blur duluan, tidak ada tepi tajam tersisa untuk dibengkokkan, dan panelnya cuma terlihat sedikit lebih terang.</p>",
    },
    tags: ["css", "design"],
    readingTime: 8,
    publishedAt: daysAgo(31),
    order: 3,
    status: "published",
  },
  {
    slug: "dummy-draft-post",
    title: { en: `${MARK} An unfinished draft`, id: `${MARK} Draf yang belum selesai` },
    excerpt: {
      en: "Exists so the draft/published filter has something to hide.",
      id: "Ada agar filter draft/published punya sesuatu untuk disembunyikan.",
    },
    content: { en: "<p>Not published.</p>", id: "<p>Belum dipublikasikan.</p>" },
    tags: ["draft"],
    readingTime: 1,
    publishedAt: null,
    order: 4,
    status: "draft",
  },
];

const testimonials = [
  {
    name: `${MARK} Former student`,
    role: { en: "Frontend Engineer", id: "Frontend Engineer" },
    company: `${MARK} Fictional Co.`,
    quote: {
      en: "Placeholder testimonial for layout testing. Replace with a real quote, published only with that person's written permission.",
      id: "Testimoni placeholder untuk menguji layout. Ganti dengan kutipan asli, dipublikasikan hanya dengan izin tertulis orang tersebut.",
    },
    relationship: "student",
    rating: 5,
    featured: true,
    order: 1,
    status: "published",
  },
  {
    name: `${MARK} Client contact`,
    role: { en: "Product Manager", id: "Product Manager" },
    company: `${MARK} Fictional Agency`,
    quote: {
      en: "Second placeholder, so the grid can be checked at more than one card. Not a real endorsement.",
      id: "Placeholder kedua, agar grid bisa diperiksa dengan lebih dari satu kartu. Bukan rekomendasi nyata.",
    },
    relationship: "client",
    rating: 5,
    featured: true,
    order: 2,
    status: "published",
  },
  {
    name: `${MARK} Team colleague`,
    role: { en: "Backend Engineer", id: "Backend Engineer" },
    company: `${MARK} Fictional Studio`,
    quote: {
      en: "Third placeholder, filling the three-column layout. Not a real endorsement.",
      id: "Placeholder ketiga, mengisi layout tiga kolom. Bukan rekomendasi nyata.",
    },
    relationship: "colleague",
    rating: 4,
    featured: false,
    order: 3,
    status: "published",
  },
];

const openSource = [
  {
    name: `${MARK} example/starter-kit`,
    description: {
      en: "Placeholder contribution. Replace with a real repository and what you actually changed in it.",
      id: "Kontribusi placeholder. Ganti dengan repositori nyata dan apa yang benar-benar Anda ubah di dalamnya.",
    },
    repoUrl: "https://github.com/",
    role: "contributor",
    language: "TypeScript",
    stars: 128,
    topics: ["placeholder"],
    order: 1,
    status: "published",
  },
  {
    name: `${MARK} example/cli-tool`,
    description: {
      en: "Second placeholder so the grid has more than one card.",
      id: "Placeholder kedua agar grid punya lebih dari satu kartu.",
    },
    repoUrl: "https://github.com/",
    role: "maintainer",
    language: "Go",
    stars: 42,
    topics: ["placeholder"],
    order: 2,
    status: "published",
  },
];

async function main() {
  const { connectDB } = await import("../src/lib/db");
  const { Article, Comment, Like, OpenSource, Testimonial } = await import("../src/lib/models");

  await connectDB();

  if (remove) {
    // Delete by the marker, so nothing real is ever caught by accident.
    const marker = { $regex: MARK.replace(/[[\]]/g, "\\$&") };

    const dummyArticles = await Article.find({ "title.en": marker }).select("_id");
    const ids = dummyArticles.map((a) => a._id);
    const comments = await Comment.deleteMany({ articleId: { $in: ids } });
    const likes = await Like.deleteMany({ articleId: { $in: ids } });
    const articlesRemoved = await Article.deleteMany({ "title.en": marker });
    const testimonialsRemoved = await Testimonial.deleteMany({ name: marker });
    const openSourceRemoved = await OpenSource.deleteMany({ name: marker });

    console.log(`removed ${articlesRemoved.deletedCount} articles`);
    console.log(`removed ${comments.deletedCount} comments, ${likes.deletedCount} likes`);
    console.log(`removed ${testimonialsRemoved.deletedCount} testimonials`);
    console.log(`removed ${openSourceRemoved.deletedCount} open-source entries`);
    await mongoose.disconnect();
    return;
  }

  const collections = [
    { model: Article, data: articles, name: "Article", key: "title.en" },
    { model: Testimonial, data: testimonials, name: "Testimonial", key: "name" },
    { model: OpenSource, data: openSource, name: "OpenSource", key: "name" },
  ];

  for (const { model, data, name, key } of collections) {
    const existing = await model.countDocuments({
      [key]: { $regex: MARK.replace(/[[\]]/g, "\\$&") },
    });
    if (existing > 0) {
      console.log(`  ${name}: ${existing} dummy record(s) already present, skipping`);
      continue;
    }
    await model.insertMany(data);
    console.log(`  ${name}: inserted ${data.length}`);
  }

  // A pending and an approved comment, so the moderation queue is not empty.
  const first = await Article.findOne({ slug: "dummy-shipping-nextjs-16" }).select("_id");
  if (first && (await Comment.countDocuments({ articleId: first._id })) === 0) {
    await Comment.insertMany([
      {
        articleId: first._id,
        authorName: `${MARK} Approved commenter`,
        authorEmailHash: "0".repeat(64),
        body: "This one is already approved, so it renders on the public article page.",
        ipHash: "0".repeat(64),
        status: "approved",
      },
      {
        articleId: first._id,
        authorName: `${MARK} Pending commenter`,
        authorEmailHash: "1".repeat(64),
        body: "This one is still pending, so it should only be visible in the admin queue.",
        ipHash: "1".repeat(64),
        status: "pending",
      },
    ]);
    await Article.updateOne({ _id: first._id }, { commentCount: 1 });
    console.log("  Comment: inserted 2 (1 approved, 1 pending)");
  }

  await mongoose.disconnect();
  console.log("\ndone — everything above is dummy data, remove it with: pnpm seed:dummy --remove");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
