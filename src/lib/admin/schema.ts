import { z } from "zod";

import {
  CROP_RATIOS,
  DEFAULT_GALLERY_COLS,
  DEFAULT_GALLERY_ROWS,
  GALLERY_COLUMN_COUNT,
  GALLERY_FITS,
  GALLERY_ROW_COUNT,
} from "@/lib/content-enums";

import { JSON_TYPES, type Field } from "./fields";

const localizedText = (required: boolean) => {
  const part = required ? z.string().trim().min(1, "Required") : z.string().trim().default("");
  return z.object({ en: part, id: part });
};

/**
 * A crop rectangle, as fractions of the original.
 *
 * Clamped rather than rejected: a rectangle a pixel outside the image is a
 * rounding artefact of the drag, not something worth failing a save over.
 */
const cropRect = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0).max(1),
    h: z.number().min(0).max(1),
  })
  .nullable()
  .optional();

const imageFields = {
  url: z.string().trim(),
  publicId: z.string().trim(),
  width: z.number().optional(),
  height: z.number().optional(),
  // Previously omitted, which meant every save wrote the document back without
  // an `alt` and silently erased whatever was there.
  alt: localizedText(false).optional(),
  crop: cropRect,
  ratio: z.enum(CROP_RATIOS).default("original"),
};

/** Empty strings mean "no image", which must round-trip as undefined. */
const storedImage = z
  .object(imageFields)
  .transform((value) => (value.url ? value : undefined))
  .optional();

/** Same as a stored image, plus layout, and never optional inside an array. */
const galleryImage = z.object({
  ...imageFields,
  caption: localizedText(false).optional(),
  cols: z.number().int().min(1).max(GALLERY_COLUMN_COUNT).default(DEFAULT_GALLERY_COLS),
  rows: z.number().int().min(1).max(GALLERY_ROW_COUNT).default(DEFAULT_GALLERY_ROWS),
  fit: z.enum(GALLERY_FITS).default("cover"),
  group: z.string().trim().default(""),
});

const localizedList = z.object({
  en: z.array(z.string().trim().min(1)).default([]),
  id: z.array(z.string().trim().min(1)).default([]),
});

/**
 * Builds a Zod schema from the same field descriptors that render the form.
 *
 * Deriving it rather than maintaining a parallel schema means a field can never
 * be added to the form but forgotten in validation — the usual way a CMS ends
 * up writing unvalidated data.
 */
export function schemaFor(fields: Field[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    const required = Boolean(field.required);

    switch (field.type) {
      case "localized-text":
      case "localized-textarea":
      case "localized-richtext":
        shape[field.name] = localizedText(required);
        break;

      case "localized-list":
        shape[field.name] = localizedList;
        break;

      case "number":
        shape[field.name] = required
          ? z.number({ error: "Must be a number" })
          : z.number().optional();
        break;

      case "boolean":
        shape[field.name] = z.boolean().default(false);
        break;

      case "image":
        shape[field.name] = storedImage;
        break;

      case "gallery":
        shape[field.name] = z.array(galleryImage).default([]);
        break;

      // Recursing means a row's fields are validated by exactly the same rules
      // as a top-level field of the same type — there is no second dialect.
      case "repeater":
        shape[field.name] = z.array(schemaFor(field.itemFields ?? [])).default([]);
        break;

      case "multiselect":
        shape[field.name] = (
          field.options?.length
            ? z.array(z.enum(field.options as [string, ...string[]]))
            : z.array(z.string().trim().min(1))
        )
          .default([])
          .refine((value) => !required || value.length > 0, "Pick at least one");
        break;

      // An ObjectId as a string. Mongoose casts it; an empty one would throw,
      // so a required reference must be caught here.
      case "reference":
        shape[field.name] = required
          ? z.string().trim().min(1, "Required")
          : z.string().trim().default("");
        break;

      case "tags":
        shape[field.name] = z.array(z.string().trim().min(1)).default([]);
        break;

      case "date":
        // Empty string means "no date" (an ongoing role), which is distinct
        // from an invalid date and must round-trip as null, not today.
        shape[field.name] = z.coerce.date().nullable().optional();
        break;

      case "url":
        shape[field.name] = required
          ? z.url("Must be a valid URL")
          : z.union([z.url("Must be a valid URL"), z.literal("")]).optional();
        break;

      case "select":
        shape[field.name] = field.options?.length
          ? z.enum(field.options as [string, ...string[]])
          : z.string();
        break;

      default:
        shape[field.name] = required
          ? z.string().trim().min(1, "Required")
          : z.string().trim().default("");
    }
  }

  return z.object(shape);
}

/**
 * Reads a `repeater`/`gallery` value.
 *
 * A malformed blob is treated as empty rather than thrown: the alternative is a
 * 500 from a Server Action, where an empty array surfaces as an ordinary
 * "Required" validation error the editor can actually act on.
 */
function jsonArray(value: string): unknown[] {
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Same tolerance for a single JSON object, e.g. an image's crop rectangle. */
function jsonObject(value: string): unknown {
  if (!value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Turns submitted FormData into the shape `schemaFor` expects.
 *
 * Localized fields arrive as `title.en` / `title.id`; lists arrive newline
 * separated; checkboxes are absent rather than false when unchecked; nested
 * structures arrive as one JSON blob (see `JSON_TYPES`).
 */
export function parseFormData(fields: Field[], formData: FormData) {
  const lines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const raw: Record<string, unknown> = {};

  for (const field of fields) {
    const get = (key: string) => String(formData.get(key) ?? "");

    if (JSON_TYPES.has(field.type)) {
      raw[field.name] = jsonArray(get(field.name));
      continue;
    }

    switch (field.type) {
      // One checked input per selected option, all sharing the field name.
      case "multiselect":
        raw[field.name] = formData.getAll(field.name).map(String);
        break;

      case "localized-text":
      case "localized-textarea":
      case "localized-richtext":
        raw[field.name] = { en: get(`${field.name}.en`), id: get(`${field.name}.id`) };
        break;

      case "localized-list":
        raw[field.name] = {
          en: lines(get(`${field.name}.en`)),
          id: lines(get(`${field.name}.id`)),
        };
        break;

      case "tags":
        raw[field.name] = get(field.name)
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        break;

      case "number": {
        const value = get(field.name);
        raw[field.name] = value === "" ? undefined : Number(value);
        break;
      }

      case "boolean":
        // An unchecked checkbox submits nothing at all.
        raw[field.name] = formData.get(field.name) != null;
        break;

      case "image": {
        const num = (key: string) => {
          const value = get(key);
          return value === "" ? undefined : Number(value);
        };
        raw[field.name] = {
          url: get(`${field.name}.url`),
          publicId: get(`${field.name}.publicId`),
          width: num(`${field.name}.width`),
          height: num(`${field.name}.height`),
          alt: { en: get(`${field.name}.alt.en`), id: get(`${field.name}.alt.id`) },
          // The crop is an object rather than a scalar, so it travels as JSON in
          // one hidden input instead of four that could disagree with each other.
          crop: jsonObject(get(`${field.name}.crop`)),
          ratio: get(`${field.name}.ratio`) || "original",
        };
        break;
      }

      case "date": {
        const value = get(field.name);
        raw[field.name] = value === "" ? null : value;
        break;
      }

      default:
        raw[field.name] = get(field.name);
    }
  }

  return raw;
}
