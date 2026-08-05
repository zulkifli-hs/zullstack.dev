import { Schema, type SchemaDefinitionProperty } from "mongoose";

/** A string that exists in both site languages. */
export type Localized = { en: string; id: string };

/** An image stored in Cloudinary. `publicId` is what lets us delete/transform it. */
export type StoredImage = {
  url: string;
  publicId: string;
  alt?: Localized;
  width?: number;
  height?: number;
};

export type PublishStatus = "draft" | "published";

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
  },
  { _id: false },
);

/** Fields every piece of content carries, so listing/ordering logic is uniform. */
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
