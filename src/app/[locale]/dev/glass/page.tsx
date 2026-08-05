import { GlassPanel } from "@/components/glass/glass-panel";
import { LensFilter } from "@/components/glass/lens-filter";
import { LabBackground } from "@/components/lab/lab-background";
import { resolveLocale } from "@/i18n/resolve-locale";

export const metadata = { title: "Glass harness", robots: { index: false, follow: false } };

/**
 * Visual harness for the glass material. Not linked from anywhere — it exists so
 * the material can be tuned against every background and degradation state at
 * once, instead of eyeballing one panel on one page.
 *
 * Check here first when changing any `--glass-*` token.
 */
export default async function GlassHarnessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await resolveLocale(params);

  return (
    <main className="relative min-h-dvh px-6 py-16">
      <LabBackground />
      <LensFilter />

      <div className="mx-auto max-w-5xl space-y-16">
        <header>
          <p className="lab-label text-signal">{"// harness"}</p>
          <h1 className="mt-3 text-3xl font-semibold">Glass material</h1>
          <p className="text-muted-foreground mt-2 max-w-prose text-sm">
            Toggle theme and the DevTools rendering emulations (reduced transparency, increased
            contrast, forced colors) and confirm each panel degrades rather than breaks.
          </p>
        </header>

        <Section
          title="Variants"
          note="lens is Chromium-only — in Safari and Firefox it must look identical to glass, not broken."
        >
          <div className="grid gap-6 sm:grid-cols-3">
            <GlassPanel variant="glass" interactive grain>
              <Label>glass</Label>
              <Body>Blur, saturate, rim, sheen, grain.</Body>
            </GlassPanel>

            <GlassPanel variant="lens" interactive grain>
              <Label>glass + lens</Label>
              <Body>Grid lines should bend at the rim.</Body>
            </GlassPanel>

            <GlassPanel variant="flat">
              <Label>flat</Label>
              <Body>No backdrop-filter. For repeated cards.</Body>
            </GlassPanel>
          </div>
        </Section>

        <Section
          title="Over a bright surface"
          note="Worst case for legibility: light text on glass over bright content needs ~0.6 tint alpha to clear WCAG AA. Panels here carry labels only — never body copy."
        >
          <div className="from-accent-250 via-brand-300 to-brand-600 rounded-3xl bg-linear-to-br p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <GlassPanel variant="glass" interactive>
                <Label>glass over bright</Label>
                <Body>Short label strings only.</Body>
              </GlassPanel>
              <GlassPanel variant="lens" interactive>
                <Label>lens over bright</Label>
                <Body>Short label strings only.</Body>
              </GlassPanel>
            </div>
          </div>
        </Section>

        <Section title="Padding scale">
          <div className="grid gap-6 sm:grid-cols-4">
            {(["none", "sm", "md", "lg"] as const).map((padding) => (
              <GlassPanel key={padding} padding={padding} className="min-h-24">
                <Label>{padding}</Label>
              </GlassPanel>
            ))}
          </div>
        </Section>

        <Section
          title="Density budget"
          note="Six glass surfaces in one viewport is over budget — cap at ~3 in real pages. This block exists to make the cost visible while scrolling."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <GlassPanel key={i} padding="sm">
                <Label>{`0${i + 1}`}</Label>
              </GlassPanel>
            ))}
          </div>
        </Section>

        <Section title="Colour tokens">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
            {[
              ["brand-400", "bg-brand-400"],
              ["brand-600", "bg-brand-600"],
              ["brand-700", "bg-brand-700"],
              ["accent-250", "bg-accent-250"],
              ["accent-700", "bg-accent-700"],
              ["ink-950", "bg-ink-950"],
            ].map(([name, klass]) => (
              <div key={name} className="space-y-2">
                <div className={`h-14 rounded-lg ${klass}`} />
                <p className="lab-label text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-1">
            <p className="text-link text-sm font-medium">
              --link : legible in both themes (brand-700 / brand-400)
            </p>
            <p className="text-signal text-sm font-medium">
              --signal : the green, made legible per theme (accent-700 / accent-250)
            </p>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {note && <p className="text-muted-foreground mt-1 max-w-prose text-xs">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/* Glass carries labels: mono, uppercase, weight >= 500. */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="lab-label text-signal">{children}</p>;
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm font-medium">{children}</p>;
}
