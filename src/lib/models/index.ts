import { model, models, Schema } from "mongoose";

import { baseFields, baseSchemaOptions, imageSchema, localized, localizedList } from "./shared";

/**
 * Every model below is registered through `models.X ?? model('X', …)`.
 *
 * This guard is mandatory, not defensive: Next's dev server hot-reloads this
 * module on every edit, and re-registering an existing schema name either
 * throws OverwriteModelError or — worse — silently rebinds the model to a
 * stale schema, corrupting field mapping in ways that only show up as missing
 * data at runtime.
 */

/* ── Projects ─────────────────────────────────────────────────────────────── */
const projectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: localized(),
    summary: localized(),
    description: localized(),
    category: {
      type: String,
      enum: ["web", "mobile", "backend", "devops", "other"],
      default: "web",
    },
    techStack: { type: [String], default: [] },
    role: localized(false),
    coverImage: { type: imageSchema, required: false },
    gallery: { type: [imageSchema], default: [] },
    repoUrl: String,
    liveUrl: String,
    featured: { type: Boolean, default: false, index: true },
    year: { type: Number, default: () => new Date().getFullYear() },
    ...baseFields,
  },
  baseSchemaOptions,
);
// Listing pages always filter by status then sort by order/year — a compound
// index matching that access pattern keeps it an index scan, not a collscan.
projectSchema.index({ status: 1, featured: -1, order: 1, year: -1 });

/* ── Experience ───────────────────────────────────────────────────────────── */
const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true },
    companyUrl: String,
    logo: { type: imageSchema, required: false },
    position: localized(),
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelance", "internship"],
      default: "full-time",
    },
    location: { type: String, default: "" },
    locationType: { type: String, enum: ["onsite", "hybrid", "remote"], default: "onsite" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    highlights: localizedList(),
    techStack: { type: [String], default: [] },
    ...baseFields,
  },
  baseSchemaOptions,
);
experienceSchema.index({ status: 1, startDate: -1 });

/* ── Mentoring ────────────────────────────────────────────────────────────── */
const mentoringTrackSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    track: localized(),
    description: localized(),
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    topics: localizedList(),
    format: { type: String, enum: ["1-on-1", "group", "workshop", "async"], default: "1-on-1" },
    duration: localized(false),
    outcomes: localizedList(),
    icon: { type: String, default: "code" },
    ...baseFields,
  },
  baseSchemaOptions,
);
mentoringTrackSchema.index({ status: 1, order: 1 });

/* ── Articles ─────────────────────────────────────────────────────────────── */
const articleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: localized(),
    excerpt: localized(),
    // HTML rendered by the admin editor at save time, so reads never pay for
    // markdown/MDX compilation.
    content: localized(),
    coverImage: { type: imageSchema, required: false },
    tags: { type: [String], default: [], index: true },
    readingTime: { type: Number, default: 1 },
    publishedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    ...baseFields,
  },
  baseSchemaOptions,
);
articleSchema.index({ status: 1, publishedAt: -1 });
// Atlas Search is unavailable on the free tier, so site search uses a plain
// text index. Weighted so a title match outranks a body match.
articleSchema.index(
  { "title.en": "text", "title.id": "text", "excerpt.en": "text", "excerpt.id": "text" },
  { weights: { "title.en": 10, "title.id": 10, "excerpt.en": 4, "excerpt.id": 4 } },
);

/* ── Comments & likes ─────────────────────────────────────────────────────── */
const commentSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: "Article", required: true, index: true },
    authorName: { type: String, required: true, trim: true, maxlength: 80 },
    // Stored as a hash only — used for the gravatar and for rate limiting.
    // The plaintext address is never persisted and never rendered.
    authorEmailHash: { type: String, required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "spam"],
      default: "pending",
      index: true,
    },
    ipHash: { type: String, required: true },
  },
  baseSchemaOptions,
);
commentSchema.index({ articleId: 1, status: 1, createdAt: -1 });

const likeSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: "Article", required: true },
    visitorHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
// Makes a duplicate like a database-level impossibility rather than something
// the application has to remember to check.
likeSchema.index({ articleId: 1, visitorHash: 1 }, { unique: true });

/* ── Testimonials ─────────────────────────────────────────────────────────── */
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: localized(false),
    company: { type: String, default: "" },
    avatar: { type: imageSchema, required: false },
    quote: localized(),
    relationship: {
      type: String,
      enum: ["client", "student", "colleague"],
      default: "client",
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    featured: { type: Boolean, default: false },
    ...baseFields,
  },
  baseSchemaOptions,
);
testimonialSchema.index({ status: 1, featured: -1, order: 1 });

/* ── Resources ────────────────────────────────────────────────────────────── */
const resourceSchema = new Schema(
  {
    title: localized(),
    description: localized(),
    type: {
      type: String,
      enum: ["article", "video", "course", "tool", "book", "documentation"],
      default: "article",
      index: true,
    },
    url: { type: String, required: true },
    tags: { type: [String], default: [] },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    free: { type: Boolean, default: true },
    ...baseFields,
  },
  baseSchemaOptions,
);
resourceSchema.index({ status: 1, order: 1 });

/* ── Open source ──────────────────────────────────────────────────────────── */
const openSourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: localized(),
    repoUrl: { type: String, required: true },
    role: {
      type: String,
      enum: ["author", "maintainer", "contributor"],
      default: "contributor",
    },
    language: { type: String, default: "" },
    stars: { type: Number, default: 0 },
    topics: { type: [String], default: [] },
    ...baseFields,
  },
  baseSchemaOptions,
);
openSourceSchema.index({ status: 1, order: 1 });

/* ── Snippets / playground ────────────────────────────────────────────────── */
const snippetSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: localized(),
    description: localized(),
    language: { type: String, default: "typescript" },
    code: { type: String, default: "" },
    embedProvider: {
      type: String,
      enum: ["codesandbox", "replit", "stackblitz", "none"],
      default: "none",
    },
    embedUrl: String,
    tags: { type: [String], default: [] },
    ...baseFields,
  },
  baseSchemaOptions,
);
snippetSchema.index({ status: 1, order: 1 });

/* ── Site config (singleton) ──────────────────────────────────────────────── */
const siteConfigSchema = new Schema(
  {
    // Fixed key makes the singleton enforceable by the database rather than by
    // convention — there can only ever be one document.
    key: { type: String, default: "site", unique: true, immutable: true },
    name: { type: String, default: "Zulkifli" },
    tagline: localized(false),
    bio: localized(false),
    avatar: { type: imageSchema, required: false },
    resumeUrl: String,
    email: { type: String, default: "" },
    location: { type: String, default: "" },
    socials: {
      type: [
        new Schema(
          { platform: String, url: String, handle: String },
          { _id: false },
        ),
      ],
      default: [],
    },
    stats: {
      type: [new Schema({ key: String, value: Number, suffix: String }, { _id: false })],
      default: [],
    },
  },
  baseSchemaOptions,
);

export const Project = models.Project ?? model("Project", projectSchema);
export const Experience = models.Experience ?? model("Experience", experienceSchema);
export const MentoringTrack = models.MentoringTrack ?? model("MentoringTrack", mentoringTrackSchema);
export const Article = models.Article ?? model("Article", articleSchema);
export const Comment = models.Comment ?? model("Comment", commentSchema);
export const Like = models.Like ?? model("Like", likeSchema);
export const Testimonial = models.Testimonial ?? model("Testimonial", testimonialSchema);
export const Resource = models.Resource ?? model("Resource", resourceSchema);
export const OpenSource = models.OpenSource ?? model("OpenSource", openSourceSchema);
export const Snippet = models.Snippet ?? model("Snippet", snippetSchema);
export const SiteConfig = models.SiteConfig ?? model("SiteConfig", siteConfigSchema);
