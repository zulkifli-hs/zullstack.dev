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

/**
 * A gallery image carries a caption on top of everything a stored image has.
 *
 * `width`/`height` are not decoration here — the public gallery lays images out
 * at their real aspect ratio so a 16:9 desktop capture and a 9:16 phone capture
 * can sit side by side uncropped, and that is impossible without the dimensions
 * Cloudinary returns at upload time.
 */
export type GalleryImage = StoredImage & { caption?: Localized };

export const galleryImageSchema = new Schema<GalleryImage>(
  {
    ...imageSchema.obj,
    caption: {
      _id: false,
      type: { en: { type: String, default: "" }, id: { type: String, default: "" } },
      required: false,
    },
  },
  { _id: false },
);

/** What a project link points at. Drives the icon and the default label. */
export const LINK_KINDS = [
  "live",
  "repo",
  "demo",
  "case-study",
  "docs",
  "design",
  "app-store",
  "play-store",
  "other",
] as const;

/**
 * How reachable a link is.
 *
 * This is the field that lets a private project still be presented honestly.
 * `public` is an ordinary outbound link; `request` renders a "request demo"
 * button and never exposes the address; `internal` renders as a plain statement
 * that the work is not publicly reachable. The query layer strips the `url` of
 * anything that is not `public` before it can reach a rendered page.
 */
export const LINK_ACCESS = ["public", "request", "internal"] as const;

export type LinkKind = (typeof LINK_KINDS)[number];
export type LinkAccess = (typeof LINK_ACCESS)[number];

export type ProjectLink = {
  kind: LinkKind;
  label?: Localized;
  url?: string;
  access: LinkAccess;
};

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

export const PARTNER_ROLES = ["collaboration", "client"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

/**
 * A partner attached to one project.
 *
 * `url` overrides the partner's own site for this project only. Agencies
 * routinely publish the same work as their portfolio, so the useful destination
 * is that specific case-study page rather than their homepage — and it differs
 * per project even for the same partner.
 */
export type ProjectPartner = {
  partner: string;
  role: PartnerRole;
  url?: string;
};

export const projectPartnerSchema = new Schema(
  {
    partner: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    role: { type: String, enum: PARTNER_ROLES, default: "client" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

/** Where a project stands today. Independent of `status`, which is editorial. */
export const LIFECYCLES = ["live", "in-development", "sunsetted", "internal"] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];

export const PLATFORMS = [
  "web",
  "mobile",
  "cms",
  "api",
  "desktop",
  "devops",
  "design",
  "other",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PARTNER_KINDS = ["agency", "client", "both"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

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
