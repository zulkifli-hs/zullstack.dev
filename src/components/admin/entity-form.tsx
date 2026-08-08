"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { GalleryField } from "@/components/admin/gallery-field";
import { ImageField } from "@/components/admin/image-field";
import { MultiSelectField } from "@/components/admin/multiselect-field";
import { RepeaterField } from "@/components/admin/repeater-field";
import { RichTextField } from "@/components/admin/rich-text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveEntity, type ActionState } from "@/lib/actions/content";
import { LOCALIZED_TYPES, SELF_LABELLED_TYPES, type Field } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

/**
 * Splits fields into sections, preserving declaration order.
 *
 * A project descriptor is over twenty fields; as one flat grid it read as a
 * wall, and the relationship between, say, a start date and an end date was
 * left entirely to the reader. Ungrouped resources keep their single untitled
 * section, so nothing changes for them.
 */
function groupFields(fields: Field[]): { title: string | null; fields: Field[] }[] {
  const groups: { title: string | null; fields: Field[] }[] = [];

  for (const field of fields) {
    const title = field.group ?? null;
    const last = groups.at(-1);

    if (last && last.title === title) last.fields.push(field);
    else groups.push({ title, fields: [field] });
  }

  return groups;
}

export function EntityForm({
  resource,
  resourceLabel,
  id,
  fields,
  values,
}: {
  resource: string;
  resourceLabel: string;
  id: string | null;
  fields: Field[];
  values: Record<string, unknown>;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveEntity.bind(null, resource, id),
    {},
  );

  const groups = groupFields(fields);

  return (
    <form action={formAction}>
      {/* Sticky: these forms are now long enough that a save button pinned to
          the top of the document would scroll out of reach for most of the
          editing session. */}
      <div className="bg-background/80 sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-4 px-4 py-4 backdrop-blur-sm">
        <div>
          <Link
            href={`/admin/${resource}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
          >
            <ArrowLeft className="size-3.5" />
            {resourceLabel}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {id ? "Edit" : "New"} {resourceLabel.toLowerCase()}
          </h1>
        </div>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </div>

      {state.message && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {state.message}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {groups.map((group, index) => (
          <section
            key={group.title ?? `group-${index}`}
            className={cn(group.title && "border-hairline rounded-xl border p-5 sm:p-6")}
          >
            {group.title && (
              <h2 className="lab-label text-muted-foreground mb-5">{group.title}</h2>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {group.fields.map((field) => (
                <FieldControl
                  key={field.name}
                  field={field}
                  value={values[field.name]}
                  errors={state.errors}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </form>
  );
}

function FieldControl({
  field,
  value,
  errors,
}: {
  field: Field;
  value: unknown;
  errors?: Record<string, string>;
}) {
  const localized = LOCALIZED_TYPES.has(field.type);
  const wide = field.wide || localized;

  // These bring their own label, layout and hidden inputs, so wrapping them in
  // the generic label/help shell would produce two labels. They take `help` and
  // the error message as props instead — previously `ImageField` took neither,
  // so a descriptor could set `help` on an image and it would never appear.
  if (SELF_LABELLED_TYPES.has(field.type)) {
    const error = errors?.[field.name];

    return (
      <>
        {field.type === "image" && (
          <ImageField
            name={field.name}
            label={field.label}
            help={field.help}
            error={error}
            value={value as { url: string; publicId: string } | undefined}
          />
        )}
        {field.type === "gallery" && (
          <GalleryField name={field.name} label={field.label} help={field.help} value={value} />
        )}
        {field.type === "repeater" && (
          <RepeaterField
            name={field.name}
            label={field.label}
            help={field.help}
            addLabel={field.addLabel}
            itemFields={field.itemFields ?? []}
            value={value}
          />
        )}
        {field.type !== "image" && error && (
          <p className="text-destructive -mt-1 text-xs sm:col-span-2">{error}</p>
        )}
      </>
    );
  }

  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <Label htmlFor={localized ? `${field.name}.en` : field.name}>
        {field.label}
        {field.required && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
      </Label>

      {field.help && <p className="text-muted-foreground text-xs">{field.help}</p>}

      {localized ? (
        // EN and ID side by side. Editing both languages in one form is the
        // whole reason both live on a single document.
        <div className="grid gap-3 md:grid-cols-2">
          {(["en", "id"] as const).map((locale) => (
            <div key={locale} className="space-y-1">
              <span className="lab-label text-muted-foreground/70">{locale}</span>
              <LocalizedInput field={field} locale={locale} value={value} />
              <FieldError message={errors?.[`${field.name}.${locale}`]} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <PlainInput field={field} value={value} />
          <FieldError message={errors?.[field.name]} />
        </>
      )}
    </div>
  );
}

function LocalizedInput({
  field,
  locale,
  value,
}: {
  field: Field;
  locale: "en" | "id";
  value: unknown;
}) {
  const name = `${field.name}.${locale}`;
  const record = (value ?? {}) as Record<string, unknown>;
  const raw = record[locale];

  // Lists round-trip as one item per line, which is far easier to edit than
  // comma-separated prose that may itself contain commas.
  const text = Array.isArray(raw) ? raw.join("\n") : String(raw ?? "");

  if (field.type === "localized-richtext") {
    return <RichTextField name={name} locale={locale} defaultValue={text} />;
  }

  if (field.type === "localized-text") {
    return <Input id={name} name={name} defaultValue={text} />;
  }

  return (
    <Textarea id={name} name={name} defaultValue={text} rows={4} />
  );
}

function PlainInput({ field, value }: { field: Field; value: unknown }) {
  const common = { id: field.name, name: field.name };

  switch (field.type) {
    case "boolean":
      return <Checkbox id={field.name} name={field.name} defaultChecked={Boolean(value)} />;

    case "multiselect":
      return (
        <MultiSelectField
          name={field.name}
          options={field.options ?? []}
          value={Array.isArray(value) ? value.map(String) : []}
        />
      );

    case "select":
      return (
        <NativeSelect {...common} defaultValue={String(value ?? field.options?.[0] ?? "")}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
      );

    case "number":
      return <Input {...common} type="number" defaultValue={value == null ? "" : String(value)} />;

    case "date":
      return (
        <Input
          {...common}
          type="date"
          // <input type="date"> only accepts YYYY-MM-DD, never a full ISO string.
          defaultValue={value ? new Date(String(value)).toISOString().slice(0, 10) : ""}
        />
      );

    case "tags":
      return (
        <Input
          {...common}
          defaultValue={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          placeholder="Comma separated"
        />
      );

    case "textarea":
      return <Textarea {...common} rows={4} defaultValue={String(value ?? "")} />;

    case "code":
      return (
        <Textarea
          {...common}
          rows={14}
          defaultValue={String(value ?? "")}
          spellCheck={false}
          className="font-mono text-xs"
        />
      );

    default:
      return <Input {...common} type="text" defaultValue={String(value ?? "")} />;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}
