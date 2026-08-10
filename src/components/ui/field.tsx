import { cn } from "@/lib/utils";

/**
 * Label + control + hint + error, in one place.
 *
 * Replaces three separately hand-rolled `Field` helpers (comment-form,
 * site-config-form, entity-form), each of which wired `htmlFor` by hand and
 * none of which associated the hint or the error with the control — so a screen
 * reader announced the label but never the validation message.
 *
 * `aria-describedby` is composed here, and the caller only has to spread
 * `controlProps` onto its input.
 */
export function Field({
  name,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (controlProps: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => React.ReactNode;
}) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden>
            *
          </span>
        )}
      </Label>

      {children({ id: name, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}

      {hint && (
        <p id={hintId} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("lab-label text-muted-foreground block", className)}
      {...props}
    />
  );
}
