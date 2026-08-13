"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { FieldControl, groupFields } from "@/components/admin/field-control";
import { Button } from "@/components/ui/button";
import { useActionForm } from "@/hooks/use-action-form";
import { saveEntity, type ActionState } from "@/lib/actions/content";
import { type Field } from "@/lib/admin/fields";
import { cn } from "@/lib/utils";

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
  // `onSubmit`, not `action` — see `useActionForm`: the `action` prop resets
  // every field the moment the action returns, so a rejected save would empty
  // the form the editor was trying to correct.
  const { state, pending, onSubmit } = useActionForm<ActionState>(
    saveEntity.bind(null, resource, id),
    {},
  );

  const groups = groupFields(fields);

  return (
    <form onSubmit={onSubmit}>
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
