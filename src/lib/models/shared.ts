import { Schema, type SchemaDefinitionProperty } from "mongoose";

import type {
  GalleryGroup,
  GalleryImage,
  Localized,
  ProjectLink,
  StoredImage,
  TeamMember,
} from "@/lib/content-enums";
import {
  CROP_RATIOS,
  DEFAULT_GALLERY_COLS,
  DEFAULT_GALLERY_ROWS,
  GALLERY_COLS,
  GALLERY_FITS,
  GALLERY_ROWS,
  LINK_ACCESS,
  LINK_KINDS,
  PARTNER_ROLES,
} from "@/lib/content-enums";

/**
 * Mongoose building blocks.
 *
 * The vocabulary itself — every enum and plain shape — lives in
 * `lib/content-enums.ts` so client components can import an option list without
 * dragging the driver into the browser bundle. Re-exported here so server code
 * has a single import site.
 */
export * from "@/lib/content-enums";

/**
 * Bilingual field factory.
 *
 * Both languages live on the same document rather than in a translations
 * collection or parallel per-locale documents. The admin edits EN and ID side by
 * side in one form, so one document means one query, one save, and one atomic
 * validation — and slugs and publish state cannot drift apart between locales.
 *
 * Trade-off: no independent per-locale publishing. If that is ever needed, add
 * `publishedLocales: [String]` to `baseFields` — it is purely additive.
 */
export const localized = (required = true): SchemaDefinitionProperty<Localized> =>
  ({
    _id: false,
    type: {
      en: { type: String, required, trim: true, default: required ? undefined : "" },
      id: { type: String, required, trim: true, default: required ? undefined : "" },
    },
    required,
  }) as unknown as SchemaDefinitionProperty<Localized>;

/** A bilingual list, e.g. bullet points on a role. */
export const localizedList = () =>
  ({
    _id: false,
    type: {
      en: { type: [String], default: [] },
      id: { type: [String], default: [] },
    },
    default: () => ({ en: [], id: [] }),
  }) as unknown as SchemaDefinitionProperty<{ en: string[]; id: string[] }>;

export const imageSchema = new Schema<StoredImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: {
      _id: false,
      type: { en: { type: String, default: "" }, id: { type: String, default: "" } },
      required: false,
    },
    width: Number,
    height: Number,
    // Cropping is non-destructive: only the rectangle is stored and Cloudinary
    // applies it at delivery, so it can be adjusted or removed at any time
    // without the original ever having been overwritten.
    crop: {
      _id: false,
      type: { x: Number, y: Number, w: Number, h: Number },
      required: false,
      default: null,
    },
    ratio: { type: String, enum: CROP_RATIOS, default: "original" },
  },
  { _id: false },
);

/**
 * A gallery image carries a caption on top of everything a stored image has.
 *
 * `width`/`height` are not decoration here — the public gallery lays images out
 * at their real aspect ratio so a 16:9 desktop capture and a 9:16 phone capture
 * can sit side by side uncropped, and that is impossible without the dimensions
 * Cloudinary returns at upload time.
 */
export const galleryImageSchema = new Schema<GalleryImage>(
  {
    ...imageSchema.obj,
    caption: {
      _id: false,
      type: { en: { type: String, default: "" }, id: { type: String, default: "" } },
      required: false,
    },
    // Columns and rows, so placement is two-dimensional rather than a single
    // width that can only ever flow left to right.
    cols: { type: Number, enum: GALLERY_COLS, default: DEFAULT_GALLERY_COLS },
    rows: { type: Number, enum: GALLERY_ROWS, default: DEFAULT_GALLERY_ROWS },
    fit: { type: String, enum: GALLERY_FITS, default: "cover" },
    group: { type: String, default: "" },
  },
  { _id: false },
);

export const galleryGroupSchema = new Schema<GalleryGroup>(
  {
    key: { type: String, required: true, trim: true },
    label: {
      _id: false,
      type: { en: { type: String, default: "" }, id: { type: String, default: "" } },
      required: false,
    },
  },
  { _id: false },
);

export const teamMemberSchema = new Schema<TeamMember>(
  {
    role: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
    self: { type: Boolean, default: false },
  },
  { _id: false },
);

export const projectLinkSchema = new Schema<ProjectLink>(
  {
    kind: { type: String, enum: LINK_KINDS, default: "live" },
    // Empty falls back to the translated label for `kind`, so the common case
    // needs no typing and stays bilingual for free.
    label: {
      _id: false,
      type: { en: { type: String, default: "" }, id: { type: String, default: "" } },
      required: false,
    },
    url: { type: String, default: "" },
    access: { type: String, enum: LINK_ACCESS, default: "public" },
  },
  { _id: false },
);

export const projectPartnerSchema = new Schema(
  {
    partner: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    role: { type: String, enum: PARTNER_ROLES, default: "client" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

export const baseFields = {
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  order: { type: Number, default: 0 },
};

/**
 * `toJSON` transform normalises `_id` to a string `id` and drops `__v`, so
 * documents cross the Server Component boundary as plain serialisable objects.
 * Without this, Next throws on passing Mongoose ObjectIds to Client Components.
 */
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
} as const;
