"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { submitComment, type CommentState } from "@/lib/actions/engagement";

const inputClass =
  "border-input bg-card/60 focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

export function CommentForm({ articleSlug }: { articleSlug: string }) {
  const t = useTranslations("comments");
  const [state, formAction, pending] = useActionState<CommentState, FormData>(submitComment, {});

  if (state.ok) {
    return (
      <p role="status" className="border-signal/40 bg-signal/5 rounded-lg border px-4 py-3 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="articleSlug" value={articleSlug} />

      {/* Honeypot. Hidden from people, irresistible to bots. Not `display:none`,
          which some bots detect — off-screen with aria-hidden reads the same to
          assistive tech but survives naive scrapers. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="authorName" label={t("name")} error={state.errors?.authorName}>
          <input id="authorName" name="authorName" required maxLength={80} className={inputClass} />
        </Field>

        <Field
          name="authorEmail"
          label={t("email")}
          hint={t("emailHint")}
          error={state.errors?.authorEmail}
        >
          <input id="authorEmail" name="authorEmail" type="email" required className={inputClass} />
        </Field>
      </div>

      <Field name="body" label={t("comment")} error={state.errors?.body}>
        <textarea id="body" name="body" required rows={4} maxLength={4000} className={`${inputClass} resize-y`} />
      </Field>

      {state.message && (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {t("submit")}
      </Button>

      <p className="text-muted-foreground text-xs">{t("moderationNote")}</p>
    </form>
  );
}

function Field({
  name,
  label,
  hint,
  error,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="lab-label text-muted-foreground block">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
