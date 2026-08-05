"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { ImageField } from "@/components/admin/image-field";
import { RichTextField } from "@/components/admin/rich-text-field";
import { Button } from "@/components/ui/button";
import { saveEntity, type ActionState } from "@/lib/actions/content";
import { LOCALIZED_TYPES, type Field } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

const inputClass =
  "border-input bg-card focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

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

  return (
    <form action={formAction}>
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <p role="alert" className="text-destructive mt-6 text-sm">
          {state.message}
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldControl
            key={field.name}
            field={field}
            value={values[field.name]}
            errors={state.errors}
          />
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

  // Images bring their own label and upload UI, so they bypass the generic
  // label/help wrapper entirely.
  if (field.type === "image") {
    return (
      <ImageField
        name={field.name}
        label={field.label}
        value={value as { url: string; publicId: string } | undefined}
      />
    );
  }

  return (
    <div className={cn("space-y-2", wide && "sm:col-span-2")}>
      <label htmlFor={localized ? `${field.name}.en` : field.name} className="block">
        <span className="lab-label text-muted-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </span>
      </label>

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
    return <input id={name} name={name} defaultValue={text} className={inputClass} />;
  }

  return (
    <textarea
      id={name}
      name={name}
      defaultValue={text}
      rows={4}
      className={cn(inputClass, "resize-y")}
    />
  );
}

function PlainInput({ field, value }: { field: Field; value: unknown }) {
  const common = { id: field.name, name: field.name, className: inputClass };

  switch (field.type) {
    case "boolean":
      return (
        <input
          id={field.name}
          name={field.name}
          type="checkbox"
          defaultChecked={Boolean(value)}
          className="accent-primary size-4"
        />
      );

    case "select":
      return (
        <select {...common} defaultValue={String(value ?? field.options?.[0] ?? "")}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "number":
      return <input {...common} type="number" defaultValue={value == null ? "" : String(value)} />;

    case "date":
      return (
        <input
          {...common}
          type="date"
          // <input type="date"> only accepts YYYY-MM-DD, never a full ISO string.
          defaultValue={value ? new Date(String(value)).toISOString().slice(0, 10) : ""}
        />
      );

    case "tags":
      return (
        <input
          {...common}
          defaultValue={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
          placeholder="Comma separated"
        />
      );

    case "textarea":
      return <textarea {...common} rows={4} defaultValue={String(value ?? "")} />;

    case "code":
      return (
        <textarea
          {...common}
          rows={14}
          defaultValue={String(value ?? "")}
          spellCheck={false}
          className={cn(inputClass, "resize-y font-mono text-xs")}
        />
      );

    default:
      return <input {...common} type="text" defaultValue={String(value ?? "")} />;
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}
