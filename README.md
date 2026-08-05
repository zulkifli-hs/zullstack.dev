# zullstack.dev

Personal-branding portfolio for **Zulkifli** — fullstack engineer and coding mentor.
Tagline: *Your Software Lab Partner*.

Bilingual (EN/ID), multi-theme (light/dark/system), CMS-backed, with an Apple
**Liquid Glass** material over a science-lab blueprint aesthetic.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.3 (App Router, Turbopack, TypeScript) |
| UI | React 19.2, Tailwind CSS 4.3, shadcn/ui on Base UI |
| Animation | `motion` 12 + React `<ViewTransition>` |
| Database | MongoDB via Mongoose 9 |
| Auth (Phase 2) | Better Auth 1.6 + its MongoDB adapter |
| i18n | next-intl 4 (`en`, `id`) |
| Theming | next-themes (`data-theme` attribute) |
| Media (Phase 2) | Cloudinary (plain Node SDK, signed direct uploads) |

## Getting started

```bash
pnpm install
cp .env.example .env.local     # then fill in MONGODB_URI
pnpm seed                      # placeholder content; --reset to wipe first
pnpm dev
```

Open http://localhost:3000 — it redirects to `/en`.

| Script | Purpose |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint (`next lint` was removed in Next 16) |
| `pnpm check` | typecheck + lint + build |
| `pnpm seed` | Seed placeholder content |

Without `MONGODB_URI` the site still builds and renders empty states, so a fresh
clone works before any database exists.

## Conventions that matter

These are the ones that are easy to get wrong and expensive to debug.

- **`src/proxy.ts`, never `middleware.ts`.** Next 16 renamed Middleware to
  Proxy. The old filename makes next-intl fail to resolve a locale.
- **Request APIs are async**: `await params`, `await searchParams`,
  `await cookies()`. Synchronous access was removed, not deprecated.
- **Pages call `resolveLocale(params)`** — it validates the segment *and* calls
  `setRequestLocale`, which is what keeps routes statically rendered.
- **Link from `@/i18n/navigation`**, never `next/link`, and never hand-build
  `/${locale}${href}`.
- **Every Mongoose model uses the `models.X ?? model(...)` guard.** Without it,
  dev-server hot reloads silently corrupt schema field mapping.
- **No `tailwind.config.js`** — Tailwind v4 is CSS-first in `src/app/globals.css`.

### Glass rules

`GlassPanel` cannot enforce these; they are on the caller:

1. **Never nest glass in glass.** Apple forbids it, and nested `backdrop-filter`
   multiplies compositor cost.
2. **Max ~3 glass surfaces per viewport.** Grids use `variant="flat"`, which has
   no `backdrop-filter` at all.
3. **Never put body copy on glass** — labels, icons and short strings only,
   weight ≥ 500. Body text goes on the page ground.
4. **`variant="lens"` is for one hero element per page.** It is Chromium-only
   (Safari/Firefox get blur), gated behind `@supports`. Filter order matters:
   displacement must run *before* blur or there are no crisp edges left to bend.
5. Tune the material at `/en/dev/glass`, not by eyeballing a single page.

The brand green `#92ec47` is **1.47:1 on white** — unusable for text on light
surfaces. Never use it raw: the `--signal` token resolves to a legible green per
theme (`accent-700` light / `accent-250` dark). Links use `--link` for the same
reason.

## Structure

```
src/
├─ proxy.ts              next-intl locale routing
├─ i18n/                 routing, request config, navigation, resolveLocale
├─ messages/             en.json / id.json — UI chrome only, content is in MongoDB
├─ app/[locale]/         public site (its own root layout — no app/layout.tsx)
├─ lib/
│  ├─ db.ts              global-cached Mongoose connection + native client bridge
│  ├─ models/            schemas; `localized()` builds the {en,id} fields
│  ├─ queries.ts         server-only read layer
│  └─ site.ts            canonical URL + hreflang helpers
└─ components/
   ├─ glass/             GlassPanel, SpecularLayer, LensFilter
   ├─ lab/               background, section headings, page shell
   ├─ layout/            header, footer, theme/locale/transparency controls
   └─ sections/          hero, about, and the content grids
```

Content is bilingual within a single document (`{ en, id }` subdocuments), so the
admin edits both languages in one form and slugs cannot drift apart per locale.

## Admin CMS

```bash
pnpm create-admin -- --email you@example.com --name "Your Name"
```

Password is read from stdin, never argv. Then sign in at `/admin/login`.

Web sign-up is permanently disabled — `create-admin` is the only path that can
create an account, via an env flag it sets in its own process.

The CMS is generated, not hand-written. Every collection's list and form come
from one descriptor in [`src/lib/admin/resources.ts`](src/lib/admin/resources.ts);
the Zod schema is derived from those same descriptors, so a field can't be added
to a form but forgotten in validation. Adding a field is one line.

**Authorization**: `proxy.ts` checks for a session cookie, but that is an
optimistic check only. `requireAdmin()` inside every page and Server Action is
the real boundary — a Server Action is reachable by direct POST regardless of
which page rendered its form.

**Images** upload straight from the browser to Cloudinary using a server-signed
request. Files never pass through a Server Action (1 MB body cap), and the
preset is signed, not unsigned.

## Status

- **Phase 1 — public site: complete.** Design system, i18n, theming, data layer,
  all 9 pages + 2 detail routes, SEO.
- **Phase 2 — auth + admin CMS: complete.** Better Auth, route protection,
  generic CRUD over 8 collections, site config, comments queue, Cloudinary
  uploads, TipTap editor.
- **Phase 3 — complete.** Comments with a moderation queue, likes, ⌘K search,
  per-article OG images, RSS.
- **Remaining**: evaluating `cacheComponents`, and a real Cloudinary upload test
  (blocked on valid credentials).

### Engagement notes

- Comments default to `pending` and only approved ones are ever selected, so an
  unmoderated queue fails closed. Approving calls `revalidatePath` — without it
  the comment would never appear on a statically generated article.
- Emails are stored as a SHA-256 hash only. Enough for a gravatar, never enough
  to display or leak.
- Spam defence is a honeypot field plus a 5-per-10-minutes IP-hash rate limit —
  no Redis dependency for a personal site.
- Likes are keyed on a hashed httpOnly visitor cookie with a unique compound
  index, so a double-like is impossible at the database level. The article page
  stays static; the button resolves per-visitor state after mount.

## Troubleshooting

**Every route 500s with a JSON `SyntaxError`** — the Turbopack dev cache is
corrupt, usually after the dev server was killed mid-write (disk caching is on
by default in 16.3). Fix: `rm -rf .next`.

Content is real, from Zulkifli's CV and portfolio. Testimonials, articles and
open-source entries are intentionally empty — no source material existed, and
inventing them would have been worse than a blank section.
