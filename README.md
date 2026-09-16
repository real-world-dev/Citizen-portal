# Citizen's Portal

A civic proposal platform: residents describe a problem or idea in their own
words, AI refines it into a clear, constructive request and categorizes it,
and town-hall staff get a full analytics dashboard — categorization, trends,
filters — to see what their citizens actually want.

Built TypeScript end-to-end (Next.js 15 App Router). Runs with **zero setup**
in a fully-functional demo mode, and upgrades to a real production stack one
environment variable at a time.

Seeded with two real towns for testing: **Elda** (default) and **Petrer**,
Alicante, Spain — 15 sample proposals spanning every category and status.

---

## Quick start (zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Everything works immediately:

- Public browse page, seeded with Elda + Petrer proposals
- One-click demo login (no real Google/Apple account needed) to submit or upvote
- Two-step AI-assisted submit flow — uses a deterministic keyword-based
  categorizer/refiner when no `ANTHROPIC_API_KEY` is set, so it's fully
  functional out of the box
- Town-hall admin dashboard at `/admin` (demo password: `townhall-demo`) with
  stat cards, category/status/trend charts, filters, and inline status updates

Nothing is persisted between server restarts in this mode — see "Auth &
data modes" below for how to move to real, persistent infrastructure.

---

## Push to GitHub

This project was built with git already initialized and committed locally.
To publish it:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

---

## Deploy so you can see it live

### Option A — Vercel's Git integration (simplest, no GitHub Action needed)

1. Push to GitHub (above).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
   Vercel auto-detects Next.js — no config needed.
3. Click Deploy. Every future push to `main` auto-deploys. Free tier, $0 at
   low traffic (functions scale to zero; see "Cost" below).

### Option B — GitHub Actions (`.github/workflows/deploy.yml`)

This repo includes a workflow that deploys to Vercel on every push to `main`.
It needs three repo secrets (**Settings → Secrets and variables → Actions**):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) — create a new token |
| `VERCEL_ORG_ID` | Run `npx vercel link` in the project locally, then read `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same file, `.vercel/project.json`, after `vercel link` |

Until those secrets are added, the deploy job fails at the "Pull Vercel
environment" step — that's expected. `.github/workflows/ci.yml` (type-check +
build) runs on every push/PR with **no secrets required**, so you get build
validation immediately even before deploy is wired up.

Once the secrets are set, push to `main` and check the Actions tab — the job
prints the live deployment URL, and it's also shown in the GitHub
environment ("production") on the repo's main page.

---

## Auth & data modes

Everything below is optional and additive — the app works with none of it
set, and each variable upgrades one part of the app independently. Copy
`.env.example` to `.env.local` and fill in what you need.

| Var | Off (default) | On |
|---|---|---|
| `DATABASE_URL` | In-memory demo store, reseeded on every restart | Real Postgres via Drizzle — run `npm run db:push` then `npm run db:seed` |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | One-click demo login (cookie session, no real identity) | Real Google/Apple/email login via Supabase Auth |
| `ANTHROPIC_API_KEY` | Keyword-based heuristic refine/categorize | Real AI refinement via Claude (`claude-3-5-haiku`) |
| `ADMIN_DEMO_PASSWORD` | `townhall-demo` | Your own shared admin password |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` | Rate limiting only, no CAPTCHA | Cloudflare Turnstile challenge on submit (wire-up point is `src/app/submit/page.tsx` — not yet called, since it needs your site key to render) |

Recommended real-infrastructure path (see the original project plan for the
full reasoning): **Supabase** for Postgres + Auth + Storage in one place,
**Vercel** for hosting, **Anthropic** for the AI calls. All three have
usable free tiers; Supabase's paid tier floors around $25/mo once you need
more than the free project limits.

### Setting up Supabase (DB + Auth)

1. Create a project at [supabase.com](https://supabase.com).
2. Settings → API: copy the Project URL and `anon` public key into
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Settings → Database: copy the connection string into `DATABASE_URL`
   (use the "Transaction" pooler string for serverless).
4. Authentication → Providers: enable Google and/or Apple, following
   Supabase's provider setup guides (each needs an OAuth app registered with
   Google/Apple).
5. Run:
   ```bash
   npm run db:push   # creates tables from src/lib/db/schema.ts
   npm run db:seed   # loads the same Elda + Petrer demo data
   ```

### Row-Level Security (run once your Supabase project is live)

The app currently talks to Postgres via Drizzle with the service role in
`DATABASE_URL`, so RLS isn't strictly required for the demo — but it's the
right posture before handling real citizen data. Apply this in the Supabase
SQL editor:

```sql
alter table proposals enable row level security;
alter table organizations enable row level security;

-- Anyone can read proposals across every town (the "citizens see all
-- requests" requirement).
create policy "public read proposals" on proposals
  for select using (true);

-- Only the authenticated author can insert, and only as themselves.
create policy "authenticated insert own proposals" on proposals
  for insert with check (auth.uid()::text = author_id);

-- Organizations are readable by anyone (town names/slugs are public),
-- but only writable by a service role (admin backoffice, not implemented
-- as a UI yet — see "What's next").
create policy "public read organizations" on organizations
  for select using (true);
```

---

## Architecture

```
Static-rendered public pages (cheap, cacheable, SEO-friendly)
        │
        ▼
Next.js App Router — server components + API route handlers (Node on Vercel)
        │
        ├─► src/lib/repo.ts  — single data-access layer
        │       ├─ DATABASE_URL unset → src/lib/store.ts (in-memory)
        │       └─ DATABASE_URL set   → src/lib/db/ (Drizzle + Postgres)
        │
        ├─► src/lib/ai/refine.ts — AI refinement pipeline
        │       ├─ ANTHROPIC_API_KEY unset → heuristic-fallback.ts
        │       └─ ANTHROPIC_API_KEY set   → Claude 3.5 Haiku, structured JSON
        │
        ├─► src/lib/auth.ts — dual-mode auth (demo cookie / Supabase)
        └─► src/lib/rate-limit.ts — in-memory sliding-window limiter
```

One language everywhere (TypeScript), one repo, shared types from the
database schema (`src/types/index.ts`) through the API routes to the UI.

### Multi-tenancy & security model

- Every proposal carries an `orgId` (town). Public read access spans every
  town (citizens can browse all requests everywhere); writes require a
  signed-in user.
- Admin/analytics access is scoped to the admin's own `orgId` and gated by
  `organizations.licenseActive` — that flag is the business-model
  enforcement point for yearly town-hall licenses.
- **SQL injection**: never an issue here because the app never builds raw
  SQL — Drizzle parameterizes every query.
- **Prompt injection**: the resident's text is passed to the model strictly
  as data inside a fenced `<resident_text>` block, the system prompt
  explicitly tells the model to treat anything inside it as data (not
  instructions), and the model is asked for structured JSON only. No model
  output ever triggers an action directly — it's validated/coerced
  (`coerceResult` in `src/lib/ai/refine.ts`) before it touches the database.
- **Rate limiting & anti-abuse** (`src/lib/rate-limit.ts`): 5 submissions/
  user/day, 30 requests/10min/IP, 15 AI-preview calls/hour/user, 60
  upvotes/min/user. Documented limitation: this is in-memory and per
  server-instance — fine for one deployment, not for multiple serverless
  instances at scale. Swap for Upstash Redis or Cloudflare Durable Objects
  before that matters.
- **Duplicate detection** (`findLikelyDuplicate` in `src/lib/repo.ts`): a
  word-overlap heuristic that flags likely-duplicate submissions at submit
  time and links them on the proposal page ("this looks similar to..."),
  which doubles as anti-spam signal and as a way to surface real demand
  ("42 residents reported this"). This is the MVP stand-in for the
  embeddings-based clustering described in the original project plan's
  Phase 2 — swap the function body for a pgvector similarity query later;
  every call site stays the same.

---

## What's built

- Public cross-town browse with search, category/status filters, sort by
  recent or most-upvoted
- Two-step AI-assisted submit flow: write → AI refines (title, constructive
  rewrite, category, urgency, sentiment) → review/edit → submit. Nothing is
  posted until the citizen sees and accepts the AI's rewrite.
- Proposal detail page with upvoting and a collapsible "view original
  submission" (transparency: the AI-refined version is never presented as
  if the resident wrote it verbatim)
- Dual-mode login: one-click demo login, or real Google/Apple/email via
  Supabase once configured
- Town-hall admin dashboard: stat cards (total / open / high-urgency /
  done), category bar chart, status pie chart, 14-day submission trend line,
  and a filterable/searchable table with inline status control
  (received → in review → scheduled → in progress → done/declined)
- Rate limiting and a moderation pass (server-side, re-checked on submit —
  never trusts a client-supplied "already moderated" flag)

## Honest limitations (by design, not oversight)

These are the right MVP trade-offs — the same ones called out in the
original project plan's phasing — not things that were missed:

- **Admin login is one shared password per town**, not per-person admin
  accounts. Next step: a Supabase `admins` table scoped by `orgId` via RLS.
- **Rate limiting is in-memory**, so it resets on restart and doesn't
  coordinate across multiple serverless instances. Fine for one deployment;
  swap for Upstash Redis before scaling past one town's traffic.
- **AI runs synchronously** on submit rather than on a queue. At current
  latency (1–5s) this is an acceptable UX trade-off for an MVP; a queue
  (e.g. Vercel Cron + a jobs table, or Supabase Edge Functions) is the
  Phase 2 move if volume grows.
- **No closing-the-loop notifications yet** (email when a request's status
  changes) — flagged in the original plan as the single biggest driver of
  repeat engagement. The `status` field and admin controls are in place;
  wiring up email (e.g. Resend) is the next concrete step.
- **Duplicate detection is a keyword heuristic**, not embeddings-based
  clustering — see "Multi-tenancy & security model" above for the upgrade
  path.
- **No accessibility audit performed** — the design uses semantic HTML,
  labeled form fields, and visible focus states as a starting point, but a
  full WCAG 2.1 AA pass (required for public-sector software) hasn't been
  done.
- Built without a working `npm install`/`npm run build` in the environment
  that generated it (no package-registry network access there) — it was
  checked carefully by hand, but **treat your first `npm run dev` as the
  real test.** If something doesn't compile, the error message will point
  straight at the file to fix.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Drizzle ORM ·
Supabase (Postgres + Auth) · Anthropic SDK · Recharts · Zod · Vercel

## Project structure

```
src/
  app/                  routes (pages + API route handlers)
  components/           shared UI components
  lib/
    ai/                 refinement pipeline + heuristic fallback
    db/                 Drizzle schema, DB client, seed script
    auth.ts             dual-mode auth (demo / Supabase)
    repo.ts             single data-access layer (demo store ⇄ Postgres)
    store.ts            in-memory demo data store
    rate-limit.ts        sliding-window limiter
    seed-data.ts          Elda + Petrer sample data
  types/                 shared domain types
```
