/**
 * Field descriptors.
 *
 * Every admin screen is the same shape — a list and a form over one collection —
 * so the screens are generated from these descriptors rather than hand-written
 * ten times. Adding a field to a model means adding one line here, and the list
 * view, the form, and the Server Action all pick it up.
 */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "tags"
  | "url"
  | "code"
  | "image"
  /** Renders paired EN/ID inputs. */
  | "localized-text"
  | "localized-textarea"
  | "localized-richtext"
  /** Paired EN/ID lists, one item per line. */
  | "localized-list"
  /** Several values from a fixed set, as toggleable chips. */
  | "multiselect"
  /** A pointer to a document in another resource, picked from a list. */
  | "reference"
  /** A reorderable list of rows, each row described by `itemFields`. */
  | "repeater"
  /** Several images with captions, reorderable. */
  | "gallery";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  options?: readonly string[];
  /** Full width in the form grid. Long text should always be wide. */
  wide?: boolean;
  /**
   * Section heading this field is filed under in the form. Fields keep their
   * declared order within a group, and groups appear in the order they are
   * first mentioned. Ungrouped fields fall into a leading untitled section.
   */
  group?: string;
  /** `repeater`: the shape of one row. Rendered with the same controls. */
  itemFields?: Field[];
  /** `repeater`: text on the add button, e.g. "Add link". */
  addLabel?: string;
  /**
   * `reference`: the resource being pointed at.
   *
   * Typed as `string` rather than `ResourceKey` on purpose — `resources.ts`
   * imports this module, so importing the key type back would be a cycle.
   * `listReferenceOptions` validates the value at the boundary instead.
   */
  relationTo?: string;
};

export const LOCALIZED_TYPES: ReadonlySet<FieldType> = new Set([
  "localized-text",
  "localized-textarea",
  "localized-richtext",
  "localized-list",
]);

/**
 * Types whose client component owns its own label, layout and hidden inputs,
 * so the generic label/help/error wrapper must not also wrap them.
 */
export const SELF_LABELLED_TYPES: ReadonlySet<FieldType> = new Set([
  "image",
  "gallery",
  "repeater",
]);

/**
 * Types that submit their whole value as one JSON blob in a hidden input.
 *
 * The admin form already cannot function without JavaScript — the Cloudinary
 * uploader and the TipTap editor both require it — so nothing is lost by
 * serialising nested structures this way, and it avoids reconstructing arrays
 * from index-mangled field names like `partners.0.url` on the server.
 */
export const JSON_TYPES: ReadonlySet<FieldType> = new Set(["repeater", "gallery"]);

export const STATUS_FIELD: Field = {
  name: "status",
  label: "Status",
  type: "select",
  options: ["draft", "published"],
  required: true,
};

export const ORDER_FIELD: Field = {
  name: "order",
  label: "Order",
  type: "number",
  help: "Lower numbers appear first.",
};
