import { z } from "zod";

import type { Field } from "./fields";

const localizedText = (required: boolean) => {
  const part = required ? z.string().trim().min(1, "Required") : z.string().trim().default("");
  return z.object({ en: part, id: part });
};

/** Empty strings mean "no image", which must round-trip as undefined. */
const storedImage = z
  .object({
    url: z.string().trim(),
    publicId: z.string().trim(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .transform((value) => (value.url ? value : undefined))
  .optional();

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
 * Turns submitted FormData into the shape `schemaFor` expects.
 *
 * Localized fields arrive as `title.en` / `title.id`; lists arrive newline
 * separated; checkboxes are absent rather than false when unchecked.
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

    switch (field.type) {
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
