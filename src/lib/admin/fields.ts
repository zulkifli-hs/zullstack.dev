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
  | "localized-list";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  options?: readonly string[];
  /** Full width in the form grid. Long text should always be wide. */
  wide?: boolean;
};

export const LOCALIZED_TYPES: ReadonlySet<FieldType> = new Set([
  "localized-text",
  "localized-textarea",
  "localized-richtext",
  "localized-list",
]);

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
