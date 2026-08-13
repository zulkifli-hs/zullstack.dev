/**
 * The content vocabulary: every closed set of values, and the plain shapes
 * built from them.
 *
 * Kept out of `models/shared.ts` because that module constructs Mongoose
 * schemas, and importing a *runtime* value from it — an option list for a chip
 * group, say — pulls the whole driver into the browser bundle. Type-only
 * imports are erased and would have been harmless; `CROP_RATIOS` is not.
 *
 * `models/shared.ts` re-exports all of this, so server code can keep importing
 * from one place.
 */

export type Localized = { en: string; id: string };

/**
 * An image stored in Cloudinary. `publicId` is what lets us delete/transform it.
 *
 * `crop` lives here rather than only on gallery images: a cover is rendered
 * into a fixed 16:9 frame, so without one the only way to fix a badly-shaped
 * upload was to re-crop it outside the CMS and upload it again.
 */
export type StoredImage = {
  url: string;
  publicId: string;
  alt?: Localized;
  width?: number;
  height?: number;
  crop?: CropRect | null;
  ratio?: CropRatio;
};

export type PublishStatus = "draft" | "published";

/* ── Gallery ──────────────────────────────────────────────────────────────── */

/** Aspect ratios offered in the crop tool. `original` means no crop at all. */
export const CROP_RATIOS = [
  "original",
  "16:9",
  "4:3",
  "1:1",
  "3:4",
  "9:16",
  "21:9",
  "free",
] as const;
export type CropRatio = (typeof CROP_RATIOS)[number];

/**
 * Placement on the gallery grid: columns wide by rows tall.
 *
 * Two axes, not one. A single "width" could only ever produce rows that flow
 * left to right — so the common case of two stacked landscape shots beside one
 * tall portrait was impossible to express. With a row span the grid becomes a
 * real bento: that arrangement is two 4×1 cells and one 2×2.
 */
/**
 * Twelve columns, because that is the smallest track that divides cleanly by
 * two, three *and* four — halves, thirds and quarters all land on whole
 * columns. Twenty-four rows so a full-page screenshot has somewhere to go.
 */
export const GALLERY_COLUMN_COUNT = 12;
export const GALLERY_ROW_COUNT = 24;

export const GALLERY_COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
// prettier-ignore
export const GALLERY_ROWS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
  13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

export type GalleryCols = (typeof GALLERY_COLS)[number];
export type GalleryRows = (typeof GALLERY_ROWS)[number];

/** Half width, 16:9-ish at the grid's row height. */
export const DEFAULT_GALLERY_COLS: GalleryCols = 6;
export const DEFAULT_GALLERY_ROWS: GalleryRows = 6;

/**
 * How the image sits in its cell.
 *
 * `cover` scales the image until it fills the cell and hides only what will not
 * fit — evenly at the sides, and from the bottom only, so the top of a
 * screenshot is always the part that survives. `contain` shows the whole image
 * and fills the remainder with a blurred enlargement of the image itself, so
 * the cell still reads as a card rather than as empty space.
 */
export const GALLERY_FITS = ["cover", "contain"] as const;
export type GalleryFit = (typeof GALLERY_FITS)[number];

/** Superseded by `cols`. Still read so existing documents keep their layout. */
export const GALLERY_SPANS = ["third", "half", "full"] as const;
export type GallerySpan = (typeof GALLERY_SPANS)[number];

export const SPAN_TO_COLS: Record<GallerySpan, GalleryCols> = {
  third: 4,
  half: 6,
  full: 12,
};

/** Whether the public gallery is one flat run or split into named sections. */
export const GALLERY_DISPLAYS = ["flat", "grouped"] as const;
export type GalleryDisplay = (typeof GALLERY_DISPLAYS)[number];

/**
 * A rectangle as fractions of the original image, not pixels.
 *
 * Normalised so the crop survives the asset being replaced at a different
 * resolution, and so it can be reasoned about without loading the image.
 */
export type CropRect = { x: number; y: number; w: number; h: number };

export type GalleryImage = StoredImage & {
  caption?: Localized;
  cols?: GalleryCols;
  rows?: GalleryRows;
  fit?: GalleryFit;
  /** @deprecated Read only, to migrate documents written before `cols`. */
  span?: GallerySpan;
  /** Key into the project's `galleryGroups`. Empty means ungrouped. */
  group?: string;
  /**
   * Kept, but not published.
   *
   * A screenshot is often not ready to show long before it is worth deleting —
   * an unreleased screen, a client who has not announced yet, a shot waiting on
   * a better crop. Deleting it to hide it loses the crop, the cell size, the
   * captions and its place in the order, all of which have to be redone when it
   * is finally publishable. The read layer drops these before they leave the
   * server, so a hidden image is not merely invisible: its URL never reaches
   * the page at all.
   */
  hidden?: boolean;
};

export type GalleryGroup = { key: string; label: Localized };

/* ── Team ─────────────────────────────────────────────────────────────────── */

/**
 * One group of people on a project, and whether I was one of them.
 *
 * A single headcount could not answer the question it appeared to: "5 people"
 * never said whether that meant the whole engagement — designers, PM, QA — or
 * only the engineers on the web build. Counting by group answers both at once,
 * and `self` says where I actually sat.
 *
 * `role` is free text rather than an enum on purpose: the next project will
 * have a title this list has never seen, and a closed set would mean a schema
 * change every time that happens. Same register as `techStack`, which is also
 * plain strings and also not translated — these are industry terms that read
 * the same in both languages.
 */
export type TeamMember = {
  role: string;
  count: number;
  /** Marks the group I was part of. More than one may be true. */
  self?: boolean;
};

/* ── Links ────────────────────────────────────────────────────────────────── */

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

/* ── Partners ─────────────────────────────────────────────────────────────── */

export const PARTNER_ROLES = ["collaboration", "client"] as const;
export type PartnerRole = (typeof PARTNER_ROLES)[number];

/**
 * `employer` makes this collection the one company directory.
 *
 * A company you worked *at* is not a partner in the same sense as an agency you
 * delivered *through* — but it is the same record: a name, a logo, a website.
 * Keeping one directory is what lets the Experience timeline show a logo without
 * a second collection that would drift out of step with this one. The public
 * partners page filters employers out; they belong on `/experience`.
 */
export const PARTNER_KINDS = ["agency", "client", "both", "employer"] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

/** Kinds the public partners page is about. */
export const PUBLIC_PARTNER_KINDS = ["agency", "client", "both"] as const;

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

/* ── Experience ───────────────────────────────────────────────────────────── */

export const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
  "internship",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const LOCATION_TYPES = ["onsite", "hybrid", "remote"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

/**
 * One title held at one company.
 *
 * Positions are nested inside a company rather than stored as siblings because
 * two jobs held at once interleave by date, and a flat list sorted by start date
 * splits both employers into fragments. Grouping is the shape of the fact, not a
 * presentation trick.
 *
 * `skills` rather than `techStack`: what a role taught is not always a
 * technology, and curriculum design or mentoring has no npm package.
 */
export type ExperiencePosition = {
  position: Localized;
  employmentType: EmploymentType;
  locationType: LocationType;
  location: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  highlights: { en: string[]; id: string[] };
  skills: string[];
  media: GalleryImage[];
};

/* ── Project ──────────────────────────────────────────────────────────────── */

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
