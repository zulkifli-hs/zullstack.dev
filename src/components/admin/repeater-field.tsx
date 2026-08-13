"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useId, useState } from "react";

import { ReferenceField } from "@/components/admin/reference-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { LOCALIZED_TYPES, type Field } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

/** A row plus a client-only identity, so React keys survive reordering. */
type Row = Record<string, unknown> & { __uid: string };

let uid = 0;
const nextUid = () => `row-${++uid}`;

/** Drops the client-only key before the row is serialised for the server. */
function withoutUid(row: Row): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key !== "__uid") data[key] = value;
  }
  return data;
}

/**
 * A reorderable list of rows, each shaped by `itemFields`.
 *
 * Rows are held in React state and submitted as a single JSON hidden input
 * rather than as `links.0.url`-style names. The admin form already requires
 * JavaScript — the Cloudinary uploader and the rich-text editor both do — so
 * nothing degrades, and the server is spared reassembling arrays from flattened
 * keys, which is where off-by-one bugs live when a middle row is deleted.
 */
export function RepeaterField({
  name,
  label,
  help,
  addLabel,
  itemFields,
  value,
}: {
  name: string;
  label: string;
  help?: string;
  addLabel?: string;
  itemFields: Field[];
  value?: unknown;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    (Array.isArray(value) ? value : []).map((entry) =>
      adopt(itemFields, entry as Record<string, unknown>),
    ),
  );

  function update(rowUid: string, patch: Record<string, unknown>) {
    setRows((current) =>
      current.map((row) => (row.__uid === rowUid ? { ...row, ...patch } : row)),
    );
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="lab-label text-muted-foreground block">{label}</span>
          {help && <p className="text-muted-foreground mt-1 max-w-prose text-xs">{help}</p>}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setRows((current) => [...current, blankRow(itemFields)])}
        >
          <Plus className="size-3.5" />
          {addLabel ?? "Add"}
        </Button>
      </div>

      {/* `__uid` is stripped here rather than at save time so the server schema
          never has to know this component exists. */}
      <input type="hidden" name={name} value={JSON.stringify(rows.map(withoutUid))} />

      {rows.length === 0 ? (
        <p className="border-hairline text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
          Nothing here yet.
        </p>
      ) : (
        <Reorder.Group axis="y" values={rows} onReorder={setRows} className="space-y-3">
          {rows.map((row) => (
            <RepeaterRow
              key={row.__uid}
              row={row}
              itemFields={itemFields}
              onChange={(patch) => update(row.__uid, patch)}
              onRemove={() =>
                setRows((current) => current.filter((entry) => entry.__uid !== row.__uid))
              }
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

/**
 * Takes a stored row into editor state.
 *
 * Only `select` and `boolean` are filled in, and only when the row has no value
 * for them, because those two controls *assert* a value the row may not hold: a
 * select with nothing to show renders its first option, and a checkbox renders
 * unchecked. The hidden JSON meanwhile still posts nothing, and `schemaFor`
 * gives a select no default — so the save is rejected for a field the editor can
 * see is answered, which is unarguable from the screen. `.lean()` applies no
 * schema defaults, so any row written before a field existed arrives this way.
 *
 * Text fields are deliberately left alone: they render empty *and* post empty,
 * so what is on screen is already the truth. Dates especially — `z.coerce.date()`
 * reads `""` as an invalid date and would fail the save outright.
 */
function adopt(itemFields: Field[], row: Record<string, unknown>): Row {
  const adopted: Row = { ...row, __uid: nextUid() };

  for (const field of itemFields) {
    if (adopted[field.name] != null) continue;
    if (field.type === "select") adopted[field.name] = field.options?.[0] ?? "";
    else if (field.type === "boolean") adopted[field.name] = false;
  }

  return adopted;
}

function blankRow(itemFields: Field[]): Row {
  const row: Row = { __uid: nextUid() };

  for (const field of itemFields) {
    if (LOCALIZED_TYPES.has(field.type)) row[field.name] = { en: "", id: "" };
    else if (field.type === "boolean") row[field.name] = false;
    // Selects default to their first option so a new row is already valid,
    // matching what the collapsed <select> shows before it is touched.
    else if (field.type === "select") row[field.name] = field.options?.[0] ?? "";
    else row[field.name] = "";
  }

  return row;
}

function RepeaterRow({
  row,
  itemFields,
  onChange,
  onRemove,
}: {
  row: Row;
  itemFields: Field[];
  onChange: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  // Dragging is confined to the handle: the row is full of inputs, and a drag
  // that starts on a text field would fight text selection.
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="border-hairline bg-background/40 rounded-lg border p-3"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onPointerDown={(event) => controls.start(event)}
          aria-label="Reorder"
          className="text-muted-foreground hover:text-foreground mt-1.5 cursor-grab touch-none transition-colors active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          {itemFields.map((field) => (
            <RowControl
              key={field.name}
              field={field}
              value={row[field.name]}
              onChange={(next) => onChange({ [field.name]: next })}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove row"
          className="hover:text-destructive shrink-0"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Reorder.Item>
  );
}

/**
 * One control inside a row.
 *
 * Controlled, unlike the top-level form's inputs — a row's value lives in React
 * state because it has to be serialised into the hidden JSON input on every
 * keystroke.
 */
function RowControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = useId();
  const localized = LOCALIZED_TYPES.has(field.type);
  const wide = field.wide || localized;

  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <Label htmlFor={localized ? `${id}-en` : id} className="text-xs">
        {field.label}
      </Label>

      {localized ? (
        <div className="grid gap-2 md:grid-cols-2">
          {(["en", "id"] as const).map((locale) => {
            const record = (value ?? {}) as Record<string, unknown>;
            const text = String(record[locale] ?? "");
            const common = {
              id: `${id}-${locale}`,
              value: text,
              placeholder: locale,
              onChange: (event: { target: { value: string } }) =>
                onChange({ ...record, [locale]: event.target.value }),
            };

            return field.type === "localized-textarea" ? (
              <Textarea key={locale} {...common} rows={3} />
            ) : (
              <Input key={locale} {...common} />
            );
          })}
        </div>
      ) : (
        <PlainRowInput id={id} field={field} value={value} onChange={onChange} />
      )}
    </div>
  );
}

function PlainRowInput({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (field.type) {
    case "reference":
      return (
        <ReferenceField
          value={value ? String(value) : undefined}
          relationTo={field.relationTo ?? ""}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <NativeSelect
          id={id}
          value={String(value ?? field.options?.[0] ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
      );

    case "boolean":
      return (
        <Checkbox
          id={id}
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        />
      );

    case "number":
      return (
        <Input
          id={id}
          type="number"
          value={value == null ? "" : String(value)}
          onChange={(event) =>
            onChange(event.target.value === "" ? undefined : Number(event.target.value))
          }
        />
      );

    case "textarea":
      return (
        <Textarea
          id={id}
          rows={3}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      );

    default:
      return (
        <Input
          id={id}
          type={field.type === "url" ? "url" : "text"}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}
