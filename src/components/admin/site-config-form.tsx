"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveSiteConfig, type ConfigState } from "@/lib/actions/site-config";

const inputClass =
  "border-input bg-card focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

type Social = { platform: string; url: string; handle: string };
type Stat = { key: string; value: number | string; suffix: string };

/** Keys the About section knows how to label. Anything else is ignored there. */
const STAT_KEYS = ["years", "projects", "students", "stack"] as const;

export function SiteConfigForm({ config }: { config: Record<string, unknown> }) {
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(saveSiteConfig, {});

  const [socials, setSocials] = useState<Social[]>(
    (config.socials as Social[] | undefined)?.length
      ? (config.socials as Social[])
      : [{ platform: "", url: "", handle: "" }],
  );
  const [stats, setStats] = useState<Stat[]>(
    (config.stats as Stat[] | undefined)?.length
      ? (config.stats as Stat[])
      : [{ key: "years", value: 0, suffix: "+" }],
  );

  const localized = (field: string, locale: "en" | "id") =>
    String((config[field] as Record<string, string> | undefined)?.[locale] ?? "");

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-8">
      <section className="grid gap-4 sm:grid-cols-2">
        <Text name="name" label="Name" defaultValue={String(config.name ?? "")} error={state.errors?.name} />
        <Text name="email" label="Email" defaultValue={String(config.email ?? "")} error={state.errors?.email} />
        <Text name="location" label="Location" defaultValue={String(config.location ?? "")} />
        <Text name="resumeUrl" label="Resume URL" defaultValue={String(config.resumeUrl ?? "")} error={state.errors?.resumeUrl} />
      </section>

      <Bilingual label="Tagline" name="tagline" get={localized} />
      <Bilingual label="Bio" name="bio" get={localized} textarea />

      <section>
        <Legend>Socials</Legend>
        <div className="space-y-2">
          {socials.map((social, index) => (
            <div key={index} className="flex gap-2">
              <input name={`socials.${index}.platform`} defaultValue={social.platform} placeholder="github" className={inputClass} />
              <input name={`socials.${index}.url`} defaultValue={social.url} placeholder="https://…" className={inputClass} />
              <input name={`socials.${index}.handle`} defaultValue={social.handle} placeholder="handle" className={inputClass} />
              <RemoveButton onClick={() => setSocials(socials.filter((_, i) => i !== index))} />
            </div>
          ))}
        </div>
        <AddButton onClick={() => setSocials([...socials, { platform: "", url: "", handle: "" }])} />
      </section>

      <section>
        <Legend>Stats</Legend>
        <p className="text-muted-foreground mb-2 text-xs">
          Only publish numbers you can substantiate. Clearing the key removes the row.
        </p>
        <div className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className="flex gap-2">
              <select name={`stats.${index}.key`} defaultValue={stat.key} className={inputClass}>
                <option value="">— remove —</option>
                {STAT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <input name={`stats.${index}.value`} type="number" defaultValue={String(stat.value)} className={inputClass} />
              <input name={`stats.${index}.suffix`} defaultValue={stat.suffix} placeholder="+" className={inputClass} />
              <RemoveButton onClick={() => setStats(stats.filter((_, i) => i !== index))} />
            </div>
          ))}
        </div>
        <AddButton onClick={() => setStats([...stats, { key: "", value: 0, suffix: "" }])} />
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
        {state.message && (
          <p role="status" className={state.ok ? "text-signal text-sm" : "text-destructive text-sm"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <h2 className="lab-label text-muted-foreground mb-3">{children}</h2>;
}

function Text({
  name,
  label,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="lab-label text-muted-foreground block">
        {label}
      </label>
      <input id={name} name={name} defaultValue={defaultValue} className={inputClass} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function Bilingual({
  label,
  name,
  get,
  textarea,
}: {
  label: string;
  name: string;
  get: (field: string, locale: "en" | "id") => string;
  textarea?: boolean;
}) {
  return (
    <section>
      <Legend>{label}</Legend>
      <div className="grid gap-3 md:grid-cols-2">
        {(["en", "id"] as const).map((locale) => (
          <div key={locale} className="space-y-1">
            <span className="lab-label text-muted-foreground/70">{locale}</span>
            {textarea ? (
              <textarea name={`${name}.${locale}`} defaultValue={get(name, locale)} rows={6} className={`${inputClass} resize-y`} />
            ) : (
              <input name={`${name}.${locale}`} defaultValue={get(name, locale)} className={inputClass} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground mt-2 inline-flex items-center gap-1.5 text-xs"
    >
      <Plus className="size-3.5" />
      Add row
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove row"
      className="text-muted-foreground hover:text-destructive shrink-0 px-1"
    >
      <X className="size-4" />
    </button>
  );
}
