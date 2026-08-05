import { GlassPanel } from "@/components/glass/glass-panel";
import { LensFilter } from "@/components/glass/lens-filter";
import { Badge, BadgeButton } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { resolveLocale } from "@/i18n/resolve-locale";
import { DensityCounter } from "./density-counter";

export const metadata = { title: "Glass harness", robots: { index: false, follow: false } };

const TIERS = ["xs", "sm", "md", "lg"] as const;

/**
 * Visual harness for the glass system. Not linked from anywhere.
 *
 * This is where the material is tuned and where every degradation mode is
 * checked — a single page that shows all four tiers, all three surface kinds
 * and every control at once, so a token change can be judged in one look
 * instead of by hunting across the site.
 *
 * Check here first when changing any `--glass-*` or `--tier-*` token.
 */
export default async function GlassHarnessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await resolveLocale(params);

  return (
    <main className="relative min-h-dvh px-6 py-16">
      <LensFilter />
      <DensityCounter />

      <div className="mx-auto max-w-5xl space-y-16">
        <header>
          <p className="lab-label text-signal">{"// harness"}</p>
          <h1 className="mt-3 text-3xl font-semibold">Glass system</h1>
          <p className="text-muted-foreground mt-2 max-w-prose text-sm">
            Toggle theme, then the DevTools rendering emulations — reduced transparency, increased
            contrast, forced colors, reduced motion — and confirm every surface degrades rather
            than breaks. Verify against <code className="font-mono">pnpm start</code>, not{" "}
            <code className="font-mono">pnpm dev</code>: the CSS pipeline differs, and a dropped
            declaration has hidden there before.
          </p>
        </header>

        <Section
          title="Surface tiers"
          note="Blur, radius, rim and shadow scale together with size. Tint moves inversely — small controls need a denser tint to establish material at all."
        >
          <div className="grid gap-5 sm:grid-cols-4">
            {TIERS.map((tier) => (
              <GlassPanel key={tier} tier={tier} padding="sm" interactive>
                <p className="lab-label text-signal">{`surface-${tier}`}</p>
                <p className="mt-2 text-sm font-medium">Glass</p>
              </GlassPanel>
            ))}
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-4">
            {TIERS.map((tier) => (
              <Card key={tier} tier={tier === "xs" ? "sm" : tier} padding="sm">
                <p className="lab-label text-muted-foreground">{`flat / ${tier}`}</p>
                <p className="mt-2 text-sm font-medium">Content</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="No glass on glass"
          note="The inner panel should have NO backdrop blur — the cascade guard strips it and compensates with tint. Apple's rule, and mechanical: glass cannot sample other glass."
        >
          <GlassPanel tier="lg" padding="lg">
            <p className="lab-label text-signal">outer — real blur</p>
            <GlassPanel tier="sm" padding="sm" className="mt-4">
              <p className="lab-label">inner — blur suppressed</p>
            </GlassPanel>
          </GlassPanel>
        </Section>

        <Section
          title="Controls"
          note="Each lifts into glass on hover and press. The material never animates — the lift is tint, rim and shadow."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="glassProminent" size="pill">
              Prominent
            </Button>
            <Button variant="glass" size="pill">
              Glass
            </Button>
            <Button variant="default">Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked /> Checkbox
            </label>
            <Switch defaultChecked />
            <Switch />
            <Segmented defaultValue={["day"]}>
              <SegmentedItem value="day">Day</SegmentedItem>
              <SegmentedItem value="week">Week</SegmentedItem>
              <SegmentedItem value="month">Month</SegmentedItem>
            </Segmented>
          </div>

          <div className="mt-6 max-w-sm">
            <Slider defaultValue={40} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge>neutral</Badge>
            <Badge tone="signal">published</Badge>
            <Badge tone="destructive">spam</Badge>
            <Badge shape="tag">Next.js</Badge>
            <BadgeButton tone="signal">toggle me</BadgeButton>
          </div>
        </Section>

        <Section
          title="Fields"
          note="Deliberately opaque. Apple does not put glass on text fields — legibility beats material. They join the family through the shared rim highlight."
        >
          <div className="grid max-w-xl gap-4">
            <Field name="h-name" label="Name" hint="A hint, wired via aria-describedby.">
              {(control) => <Input {...control} placeholder="Zulkifli" />}
            </Field>
            <Field name="h-error" label="With error" error="Required">
              {(control) => <Input {...control} />}
            </Field>
            <Field name="h-select" label="Select">
              {(control) => (
                <NativeSelect {...control}>
                  <option>Option one</option>
                  <option>Option two</option>
                </NativeSelect>
              )}
            </Field>
            <Field name="h-area" label="Textarea">
              {(control) => <Textarea {...control} rows={3} />}
            </Field>
          </div>
        </Section>

        <Section
          title="Over a bright surface"
          note="Worst case for legibility: light text on glass over bright content needs ~0.6 tint alpha to clear WCAG AA. Panels carry labels only — never body copy."
        >
          <div className="from-accent-250 via-brand-300 to-brand-600 rounded-3xl bg-linear-to-br p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <GlassPanel tier="md" padding="sm" interactive>
                <p className="lab-label text-signal">glass over bright</p>
              </GlassPanel>
              <GlassPanel variant="lens" tier="lg" padding="sm" interactive>
                <p className="lab-label text-signal">lens over bright</p>
              </GlassPanel>
            </div>
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
