# Architecture Decisions

Decisions are listed in the order they were made, with the reasoning given
at the time. Each was confirmed directly by the project owner via explicit
choice (not assumed).

## 1. Scope: full rebuild, not incremental patching

Given the age of the stack (see `01-original-app-inventory.md`), the owner
chose a full rebuild over incremental dependency bumps or "just fix the
rot"-style patching.

## 2. Overall architecture: unified Next.js app

**Chosen:** A single Next.js (App Router) application replaces the separate
Express API + CRA frontend entirely — Server Components and Server Actions
take over the role of REST endpoints and the axios client class.

**Alternatives considered:** keep the two-project split and modernize each
independently (Express+TS+Drizzle / Vite+React+TanStack Query); or replace
only the frontend framework and keep Express standalone.

**Why:** simplest deploy (one Vercel project), no CORS or manual
token-passing layer between two apps, and modern data-fetching (Server
Components reading the DB directly) is built into the framework rather than
hand-rolled.

## 3. Styling: Tailwind CSS + shadcn/ui

**Chosen** over keeping Bootstrap 5 + react-bootstrap, or hand-written CSS
Modules. Drops Bootstrap 4, react-bootstrap's `Dropdown`/`Navbar`,
FontAwesome, and jQuery entirely. shadcn's `DropdownMenu`, `Sheet`, `Dialog`,
etc. (Radix-based) replace the react-bootstrap component usages found in
`WorkoutDay.js`, `LogExercise.js`, and `Navigation.js`.

## 4. Language: TypeScript everywhere

**Why:** several of the original bugs (e.g. the `first_name`/`firstName`
casing mismatch in `Navigation.js`) are exactly the class of error a type
system catches at compile time rather than silently falling back at
runtime.

## 5. Data layer: Drizzle ORM + PostgreSQL, hosted on Neon

**Chosen** over Prisma or staying with raw `pg` + a hand-rolled
`sqlForPartialUpdate`-style helper.

**Why Drizzle over Prisma:** stays close to actual SQL (matches the
original app's raw-query style, just typed and safer) with less
abstraction/magic; migrations are included via `drizzle-kit`.

**Why Neon for hosting:** serverless Postgres with a generous free tier and
database branching that pairs naturally with Vercel preview deployments.
(Supabase was offered as an alternative; Neon was picked since Supabase's
bundled auth/storage features aren't needed — Auth.js handles auth.)

## 6. Auth: Auth.js (NextAuth) v5, Credentials + JWT sessions

**Chosen** over rolling a custom session-cookie layer by hand (e.g. with
`jose`).

**Why:** standard, well-supported pattern for Next.js Server
Actions/Components; httpOnly session cookies directly fix the original
app's JWT-in-`localStorage` XSS exposure. JWT session strategy (not the
database/adapter session strategy) was chosen specifically because there's
only a Credentials provider and no OAuth planned — so no `accounts`/
`sessions` adapter tables are needed at all.

Note (discovered during implementation, not part of the original decision):
Auth.js's `authorized` callback must be set explicitly
(`authorized: ({ auth }) => !!auth?.user`) for the proxy/middleware
re-export to actually enforce a redirect — by default `authorized`
defaults to `true` and nothing is blocked. See `04-progress.md`.

## 7. Repo layout: new sibling folder, old ones frozen

**Chosen** over replacing the two old folders in place immediately.

**Why:** zero risk to the currently-working app while the rebuild is in
progress. `lightweight-backend/` and `lightweight-frontend/` are left
completely untouched; the new app lives in `lightweight-next/`. They'll be
archived into `legacy/` only once `lightweight-next` reaches feature parity.

## 8. Data migration: fresh start, no legacy import

**Chosen** over writing a one-off script to migrate real workout history
from the old Postgres database.

**Why:** the owner confirmed the old database only holds bootcamp/demo
data, not real workout history worth preserving. Only the **exercise**
reference list (38 exercises) from `lightweight-seed.sql` is carried
forward, via `drizzle/seed.ts`.

## 9. Admin user management: kept, not dropped

**Chosen:** port the old admin-only "create any user" endpoint
(`POST /users` in the old app) into the rebuild as `adminCreateUser`, gated
by `requireAdmin()`, rather than relying solely on self-registration
(always non-admin) with manual DB promotion for the first admin.

## Bugs deliberately fixed, not carried forward

All seven bugs listed in `01-original-app-inventory.md`'s summary section
are treated as must-fix, not must-preserve, in the rebuild:

- Workout/Exercise mutations are now id-keyed (Drizzle `.set()` +
  `eq(table.id, id)`), never keyed by `day_of_week`/`name` text.
- Every mutating Server Action on workouts/logged-exercises calls an
  ownership guard (`requireWorkoutOwner` / `requireLoggedExerciseOwner`)
  before touching the database — see `src/lib/auth-guards.ts`.
- `firstName`/etc. are canonical typed fields via the Auth.js session type
  augmentation — a casing mismatch like the old `first_name` bug can no
  longer compile.
- The logged-exercise edit route is `/workouts/[workoutId]/log/
  [loggedExerciseId]/edit` — a single id, fetched fresh server-side, no
  field values baked into the URL.
- React list keys use real database ids (`workout.id`, `exercise.id`), not
  per-render `uuid.v4()` calls.
- `SECRET_KEY`-equivalent (`AUTH_SECRET`) is never logged.
- `src/db/index.ts` uses a pooled `pg.Pool`, not a single `Client`.

The old app's unscoped `GET /workouts` (returned every user's workouts) was
**not** ported at all — there was no legitimate use case for it, so it was
dropped rather than "fixed."
