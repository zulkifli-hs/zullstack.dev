"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm } from "@/hooks/use-action-form";
import { submitComment, type CommentState } from "@/lib/actions/engagement";

export function CommentForm({ articleSlug }: { articleSlug: string }) {
  const t = useTranslations("comments");
  // `onSubmit`, not `action` — see `useActionForm`. A rejected comment used to
  // take the comment with it, which for someone who has just written several
  // paragraphs is the worst place in the site to lose text. Success needs no
  // reset: the form is replaced by the confirmation below.
  const { state, pending, onSubmit } = useActionForm<CommentState>(submitComment, {});

  if (state.ok) {
    return (
      <p role="status" className="border-signal/40 bg-signal/5 rounded-lg border px-4 py-3 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="articleSlug" value={articleSlug} />

      {/* Honeypot. Hidden from people, irresistible to bots. Not `display:none`,
          which some bots detect — off-screen with aria-hidden reads the same to
          assistive tech but survives naive scrapers. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="authorName" label={t("name")} required error={state.errors?.authorName}>
          {(control) => <Input {...control} name="authorName" required maxLength={80} />}
        </Field>

        <Field
          name="authorEmail"
          label={t("email")}
          hint={t("emailHint")}
          required
          error={state.errors?.authorEmail}
        >
          {(control) => <Input {...control} name="authorEmail" type="email" required />}
        </Field>
      </div>

      <Field name="body" label={t("comment")} required error={state.errors?.body}>
        {(control) => <Textarea {...control} name="body" required rows={4} maxLength={4000} />}
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
