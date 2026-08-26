# Implementation Progress

Status as of the end of the first build session. Update this file as work
continues — it's the source of truth for "what's actually built" versus
`03-plan.md`, which is "what was planned before writing code."

## Environment discovered during setup

- Local Node: v20.12.2 / npm 10.5.0. Several installed packages warn about
  wanting Node ≥20.17–20.19, but everything installs and runs fine — the
  warnings are non-blocking (`npm WARN EBADENGINE`).
- **`create-next-app` scaffolded Next.js 16**, which turned out to have
  breaking naming changes from prior Next.js versions. The project's
  auto-generated `AGENTS.md` explicitly warns about this and points at
  `node_modules/next/dist/docs/` for the current conventions — those docs
  were read before writing routing/auth code. The one that mattered most:

  **`middleware.ts` is renamed `proxy.ts` in Next 16** (functionality is
  identical, just the file name/export name changed — see
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
  The plan in `03-plan.md` still says `middleware.ts` because it predates
  this discovery; the actual file is `src/proxy.ts`, exporting `proxy`
  (aliased from Auth.js's `auth`), not `middleware`.

- The shadcn CLI has also changed significantly (v4): `shadcn init` now
  asks for a `--base` (`radix`/`base`/`aria`) and a `--preset` (visual
  theme, e.g. `nova`) rather than a simple `--base-color` flag. Used
  `-b radix -p nova` — classic Radix-based shadcn components, "Nova"
  preset (Lucide icons / Geist font, the default).
- The shadcn registry does not (yet) have a `form` component under the
  `radix-nova` base (`shadcn add form` returns an empty stub with no
  files). **`src/components/ui/form.tsx` was hand-written**, adapted from
  the canonical shadcn `form.tsx` to match this project's `radix-ui`
  unified-import convention (`Slot.Root` instead of a bare `Slot`).
- `@vitejs/plugin-react` latest (6.x) pulls in an experimental
  Rolldown/Babel 8 toolchain that conflicts with shadcn's Babel 7
  dependency tree (`ERESOLVE`). Pinned to `@vitejs/plugin-react@^4` and
  `vitest@^2` instead of latest.
- `npm audit` reports 8 vulnerabilities, all transitive through
  `drizzle-kit`'s bundled `@esbuild-kit/*` loader (old `esbuild`) and
  `vite`'s dev-server esbuild — these are **dev-tooling-only** (CLI/local
  dev server), not shipped to production, and `drizzle-kit` is already at
  its latest version (0.31.10) with no fix upstream yet. Left as-is;
  revisit if `drizzle-kit` ships a fix.
- TypeScript module augmentation gotcha: `declare module "next-auth/jwt"`
  did **not** merge with the real `JWT` interface (next-auth's `jwt.d.ts`
  is a pure `export * from "@auth/core/jwt"` re-export, not a local
  interface declaration, so TS won't merge into it). Had to target
  `declare module "@auth/core/jwt"` directly instead. Session/User
  augmentation via `declare module "next-auth"` worked as expected despite
  a structurally similar re-export — the discrepancy wasn't fully
  explained, but the working fix is documented in
  `src/types/next-auth.d.ts` for future reference.
- Next.js 16's typed-route helpers (`PageProps<"...">`, `LayoutProps<"...">`)
  don't exist for a route until Next has generated its route manifest —
  run `npx next typegen` (or `next dev`/`next build`) once after adding new
  routes before `tsc --noEmit` will recognize them. Also: **route-group
  layouts** (folders in parens, e.g. `(app)/layout.tsx`) don't get their
  own `LayoutRoutes` entry since route groups aren't real URL segments —
  use `LayoutProps<"/">` for those, not the child route's path.

## What's built (`lightweight-next/`)

All of this passes `npm run typecheck`, `npm run lint`, and `npm run build`
cleanly as of the last check. It has **not** been run against a real
database (see "Not done yet" below) — no dev-server smoke test has
happened.

### Tooling / config
- `package.json` — scripts: `dev`, `build`, `start`, `lint`, `typecheck`,
  `test` (vitest), `test:e2e` (playwright), `db:generate`, `db:migrate`,
  `db:studio`, `db:seed`.
- `drizzle.config.ts` — loads `.env.local` via `dotenv`, points at
  `drizzle/schema.ts`, outputs migrations to `drizzle/migrations/`.
- `.env.local` / `.env.local.example` — `DATABASE_URL` (placeholder, needs
  a real Neon connection string) and `AUTH_SECRET` (a real generated
  secret is already in `.env.local`, via `openssl rand -base64 32`).
- `components.json` — shadcn config, `style: "radix-nova"`.

### Data layer
- `drizzle/schema.ts` — `users`, `workouts`, `exercises`, `loggedExercises`
  tables + `relations()` blocks. Matches `02-decisions.md` §5's fixes:
  `unique(userId, dayOfWeek)` on workouts, `unique(name)` on exercises,
  indexes on all FK columns, `unit` as a `pgEnum`-style
  `text({ enum: ["lbs","kg"] })`.
- `drizzle/seed.ts` — 38 reference exercises transcribed from the old
  `lightweight-backend/lightweight-seed.sql`. **One exact-name duplicate
  was found and fixed**: the old seed had two rows both named
  "Dumbbell fly" (one dumbbell/pectorals, one cable/pectorals) — the
  second was renamed to "Cable fly" since the new schema enforces
  `unique(name)`. Uses `onConflictDoUpdate` keyed on `name` so re-running
  the seed is idempotent.
- `src/db/index.ts` — pooled `pg.Pool` (fixes bug #7), memoized on
  `globalThis` in dev to survive HMR without exhausting connections.

### Auth
- `src/auth.ts` — Auth.js v5 `NextAuth()` config: Credentials provider
  (`authorize` looks up by username, `bcrypt.compare`s the hash), JWT
  session strategy, `jwt`/`session` callbacks copying the typed user
  fields through, and an explicit `authorized: ({ auth }) => !!auth?.user`
  callback.

  **Important non-obvious fix**: without that `authorized` callback,
  re-exporting `auth` as the proxy function does **nothing** — Auth.js's
  internal default is `authorized = true` when no callback is set, so no
  redirect ever fires. This isn't mentioned in the original plan; it was
  discovered by reading `node_modules/next-auth/lib/index.js` directly.
- `src/proxy.ts` — `export { auth as proxy }`, matcher covers
  `/workouts`, `/exercises`, `/profile`, `/admin`.
- `src/types/next-auth.d.ts` — module augmentation for `Session`/`User`
  (via `"next-auth"`) and `JWT` (via `"@auth/core/jwt"` — see the gotcha
  above) adding `id`, `username`, `firstName`, `lastName`, `email`,
  `isAdmin`.
- `src/lib/auth-guards.ts` — `UnauthorizedError`/`ForbiddenError`/
  `NotFoundError`, `requireUser()`, `requireAdmin()`,
  `requireWorkoutOwner(workoutId)`, `requireLoggedExerciseOwner(id)`. This
  is the load-bearing fix for bug #2 — every mutating action below calls
  one of these before touching the database.
- `src/app/admin/layout.tsx` — a second, explicit `isAdmin` redirect check
  (defense in depth on top of the proxy matcher, per the Next.js auth guide's
  recommendation to check close to the data/route, not just at the edge).

### Server Actions (`src/actions/`)
- `auth.ts` — `registerUser` (zod-validated, dup-username check, bcrypt
  hash at work factor 12, signs in immediately after registration).
- `login.ts` — `loginAction` wrapping `signIn("credentials", ...)` with
  `AuthError` handling for the login form.
- `exercises.ts` — `searchExercises` (ILIKE filters), `getExercise(id)`,
  `createExercise`/`updateExercise`/`deleteExercise` (all `requireAdmin()`,
  all id-keyed).
- `workouts.ts` — `getWorkoutsForCurrentUser()`, `getWorkout(id)`
  (ownership-checked), `adminGetWorkoutsForUser(id)`, `createWorkout`
  (userId always from session, never from client input; app-level
  case-insensitive dup check backed by the DB unique index),
  `updateWorkout`/`deleteWorkout` (ownership-checked, id-keyed).
- `logged-exercises.ts` — `createLoggedExercise` (ownership-checked via
  the target workout), `getLoggedExercise(id)`,
  `updateLoggedExercise`/`deleteLoggedExercise` (ownership-checked via
  `requireLoggedExerciseOwner`).
- `users.ts` — `updateProfile` (re-verifies current password before
  saving, exactly matching the old app's UX), `listUsers` (admin),
  `adminCreateUser` (admin, dup-username check), `adminDeleteUser`
  (admin), `logout` (calls Auth.js `signOut`).

### Validation (`src/lib/validations/`)
- `auth.ts`, `workout.ts` (exports `DAYS_OF_WEEK` as a const tuple),
  `exercise.ts`, `logged-exercise.ts`, `user.ts` — one zod schema file per
  domain, mirroring the plan's replacement of `schemas/*.json` +
  `jsonschema`.

### Pages (`src/app/`)
- `page.tsx` — homepage, branches logged-in/out via `auth()`.
- `(auth)/layout.tsx`, `(auth)/login/page.tsx`, `(auth)/signup/page.tsx` —
  plus `components/auth/login-form.tsx` and `signup-form.tsx`
  (`useActionState` + the hand-written `Form`/`Input`/`Label` shadcn
  components).
- `(app)/layout.tsx` — shared shell (`Navigation` + centered `<main>`) for
  all authenticated routes.
- `(app)/workouts/page.tsx` — list, server-rendered, real `workout.id`
  keys (fixes bug #5), "Add workout day" hidden once 7 days exist (matches
  old app's cap).
- `(app)/workouts/new/page.tsx`, `[workoutId]/edit/page.tsx` — both reuse
  `components/workouts/workout-form.tsx`; edit binds `updateWorkout` with
  `.bind(null, workout.id)` before handing it to the client form.
- `(app)/workouts/[workoutId]/page.tsx` — day detail: header + edit/delete
  dropdown (`workout-day-menu.tsx`), logged-exercise list with per-row
  edit/delete dropdown (`logged-exercise-menu.tsx`) and a "View" link to
  the exercise detail page.
- `(app)/workouts/[workoutId]/log/new/page.tsx` — two-mode page: no
  `exerciseId` in the URL → exercise search/browse (reuses
  `ExerciseFilterBar` + `ExerciseCard`, links append `?exerciseId=`); with
  `exerciseId` → the actual set-logging form
  (`components/workouts/log-exercise-form.tsx`).
- `(app)/workouts/[workoutId]/log/[loggedExerciseId]/edit/page.tsx` —
  fixes bug #4: a single id in the URL, the row is fetched fresh
  server-side and handed to `log-exercise-edit-form.tsx`.
- `(app)/exercises/page.tsx`, `[exerciseId]/page.tsx` — search list +
  detail-by-id page; detail page conditionally shows a "Log this exercise"
  button only when a `workoutId` search param is present (i.e. when
  arrived at via the log-new flow above).
- `(app)/profile/page.tsx` + `components/profile/profile-form.tsx` —
  matches the old app's "must re-enter password to save" behavior;
  success is surfaced via a `sonner` toast instead of the old `Alert.js`
  list.
- `admin/layout.tsx`, `admin/exercises/{page,new/page,[exerciseId]/edit/page}.tsx`,
  `admin/users/{page,new/page}.tsx` — table-based CRUD UIs using shadcn
  `Table`, reusing `exercise-admin-form.tsx` for create/edit and
  `admin-create-user-form.tsx` for user creation.

### Shared components
- `components/nav/navigation.tsx` (server) + `user-menu.tsx` (client
  `DropdownMenu` island) — replaces `Navigation.js`; reads
  `session.user.firstName` directly (typed, can't silently fall back to
  username the way the old snake/camel bug did).
- `components/exercises/exercise-card.tsx`, `exercise-filter-bar.tsx` —
  generic, reused by both `/exercises` and the log-new exercise-picker
  flow (parameterized `href`/`basePath`).
- `components/workouts/workout-form.tsx`, `workout-day-menu.tsx`,
  `logged-exercise-menu.tsx`, `log-exercise-form.tsx`,
  `log-exercise-edit-form.tsx`.
- `components/ui/form.tsx` — hand-written (see "shadcn registry" note
  above).

## Not done yet

1. **No real database has been connected or tested against.** Provisioning
   a Neon project is out of this agent's reach (needs the project owner's
   account). `.env.local`'s `DATABASE_URL` is still a placeholder. Nothing
   in `lightweight-next/` has been run with `npm run dev` or exercised
   through a browser yet — only static analysis (typecheck/lint/build) has
   verified it.
2. Once a real `DATABASE_URL` exists, the remaining setup steps are:
   `npm run db:generate && npm run db:migrate && npm run db:seed`, then
   `npm run dev` and manually walk the golden path described in
   `03-plan.md`'s Verification section.
3. **Vitest unit tests** (`tests/unit/`) — not started. Per the plan:
   exercise the Server Actions and `auth-guards.ts` against a test
   Postgres DB, with an explicit regression test that user A cannot
   mutate user B's workout/logged-exercise by id.
4. **Playwright e2e tests** (`tests/e2e/`) — not started:
   `auth.spec.ts`, `workouts.spec.ts` (including the cross-user negative
   case), `exercises.spec.ts`.
5. **Deployment** — no Vercel project, no GitHub Actions CI, no
   `drizzle-kit migrate` deploy step configured yet.
6. **Cutover** — `lightweight-backend/` and `lightweight-frontend/` are
   untouched and still fully functional; they have **not** been archived
   into `legacy/`, and the root `README.md` still describes the old app.
   Per the plan, this only happens once `lightweight-next` reaches parity
   and passes its test suite.
7. A few plan-mentioned niceties were not built: per-route `loading.tsx`
   skeletons, an `adminListAllWorkouts` action (only mentioned as
   "add only if needed" in the plan — no page currently calls it), and
   `adminUpdateUser(id)` (the admin users page currently only supports
   create/delete, not editing another user's profile — not explicitly
   requested and skipped to keep scope tight).

## Suggested next step

Either (a) provision Neon and hand the connection string over so the app
can be migrated/seeded/smoke-tested end-to-end for the first time, or
(b) continue building the Vitest/Playwright suites against a local/test
Postgres instance first, before wiring up the real Neon database. See the
open conversation for which was chosen.

## Update: Neon connected, app confirmed running end-to-end

The project owner provisioned a Neon database and dropped a real
`DATABASE_URL` into `lightweight-next/.env.local`, ran the migrate/seed
commands, and confirmed `npm run dev` works. First real, non-static-analysis
verification of the app.

## Update: visual redesign ("gym" look and feel)

Full restyle, requested as an open-ended "change the entire look and feel,
pick gym-compatible colors, change fonts if you like." Implemented:

- **Fonts**: `next/font/google` swapped from Geist Sans/Mono to **Bebas
  Neue** (condensed display face, uppercase via a `.font-heading` utility
  in `globals.css`) for headings/titles/nav brand, and **Inter** for body
  text. Wired through `--font-display`/`--font-body` CSS variables in
  `src/app/layout.tsx`, mapped to `--font-heading`/`--font-sans` in
  `globals.css`'s `@theme inline` block. `--font-mono` was pointed at a
  system monospace stack instead of importing a Google mono font, since
  nothing in the app renders `font-mono`.
- **Colors**: rewrote both the `:root` (light) and `.dark` token blocks in
  `src/app/globals.css` around a single accent hue reused across both
  themes — a vivid safety-orange (`oklch(0.7-0.72 0.19 42)`) as `--primary`
  with a near-black `--primary-foreground` for strong contrast (dark text
  on bright orange, like hazard/safety signage — read as "gym energy"
  rather than a generic SaaS blue). Backgrounds/cards/borders were
  re-tinted slightly warm (small positive hue shift, `~40-60`) instead of
  pure neutral gray, so the whole palette feels cohesive rather than "gray
  UI plus an orange button."
- **Forced dark mode**: `<html>` now always has `className="dark"` in
  `src/app/layout.tsx` — there is no light/dark toggle in the app, so
  rather than leaving it to default to the (also re-themed) light palette,
  dark was chosen as the single default look, matching the "gym at night /
  bold, moody" aesthetic. The light palette values are still defined and
  correct in `globals.css` in case a theme toggle gets added later
  (`next-themes` is already a dependency, just unused).
- Applied `font-heading` + `text-primary` treatment to every page's main
  `<h1>`/section `<h2>` (homepage, workouts list, workout day detail,
  exercises list, log-exercise picker, both admin list pages) and to the
  nav brand mark in `components/nav/navigation.tsx`. Card/Dialog/Sheet
  titles already used a `font-heading` class from the shadcn Nova preset,
  so those picked up the new display font automatically once the CSS
  variable changed — no per-component edits needed there.

**Verified, not just built**: `npm run typecheck`, `npm run lint`, and
`npm run build` all pass. Beyond that, per the project's "test UI changes
in a browser" standard, the app was actually launched and driven with a
headless Playwright script (no project-specific `run` skill existed yet,
so the generic browser-driven pattern was used, with `@playwright/test`'s
bundled `chromium` in place of the unavailable `chromium-cli`):
homepage → login → signup → **real signup against the live Neon DB** →
workouts list (empty state) → new-workout form, screenshotted at each
step, with `console --errors`-equivalent checking (`page.on("console")`)
showing zero runtime errors.

**Side effect worth knowing about**: that smoke test created one real user
row in the Neon database — username pattern `themetest<unix-timestamp-ms>`,
password `password123`. No workout was created (the flow stopped at the
empty "new workout" form without submitting). Harmless test data, but flag
it for cleanup before treating the Neon DB as containing only intentional
accounts.

## Update: progress charts + personal records feature

Requested feature, chosen from a menu of "2026-relevant" suggestions
offered to the project owner (others offered but not picked: PWA/offline
support, `loading.tsx` skeletons, a light/dark toggle, passkey auth, login
rate limiting, error monitoring, an AI-suggested-workout stretch idea —
none of those are built).

**Schema change**: `loggedExercises` gained a `performedAt` timestamp
column (`defaultNow()`, not user-editable — creating a log sets it once,
editing a log only changes weight/sets/reps, matching "editing corrects a
mistake" rather than "editing rewrites history"). Generated and applied via
`npm run db:generate && npm run db:migrate` against the real Neon database
— migration file `drizzle/migrations/0001_melodic_scrambler.sql`, a single
additive `ALTER TABLE ... ADD COLUMN`, safe/backward-compatible.

This works as a real history log **without any other data-model change**
because `createLoggedExercise` already inserted a new row per "Log
exercise" submission rather than upserting — the app was accidentally
already history-capable, it just had no timestamp to order/chart by.

**Before writing any chart code**, the `dataviz` skill was loaded per its
own trigger rule (any chart, in any medium). Decisions it drove:
- Trend-over-time + single series → a line chart, sequential color (one
  hue), **no legend** (single-series rule — the section title already
  names what's plotted).
- Reused the app's existing validated brand orange (`--primary`) as that
  one hue rather than introducing a new palette — the skill's validator is
  for multi-hue categorical palettes; a single sequential hue already
  proven to have decent contrast (via the earlier redesign's live
  screenshots) didn't need re-validation.
- Followed the mark specs: 2px round-cap/join line, ~10% opacity area
  wash, ≥8px-diameter end/PR markers with a 2px surface-color ring, 1px
  hairline gridlines, direct labels only at the endpoint and the PR point
  (never a label per point).
- Built the hover layer as the spec requires (not optional): a
  crosshair that snaps to the nearest point, a tooltip with the value
  leading and the date/sets/reps secondary, and a plain table underneath
  as the always-available non-hover fallback (also just useful as a
  literal history log, not only an accessibility nicety).
- No date-range filter UI — out of scope per the skill's own guidance
  (filters are for monitoring dashboards; a personal lift log with at most
  a few hundred points doesn't need one).

**New/changed files**:
- `drizzle/schema.ts` — `performedAt` column.
- `src/actions/progress.ts` — `getExerciseHistory(exerciseId)` (join
  `loggedExercises`→`workouts`, scoped to the session user — same
  ownership-scoping discipline as every other query in this app) and
  `getPersonalRecords()` (same join plus `exercises`, one best-weight row
  per exercise, via `ORDER BY weight DESC` + a first-occurrence map rather
  than a SQL `GROUP BY`/window function — simplest correct approach at
  this data scale).
- `src/components/progress/weight-progress-chart.tsx` — the hand-written
  inline-SVG chart (client component; no charting library added).
- `src/app/(app)/exercises/[exerciseId]/page.tsx` — gained a "Your
  progress" card: a personal-record stat tile, the chart, and a plain
  history table, with a proper empty state for exercises never logged.
- `src/app/(app)/progress/page.tsx` — new page, a table of every exercise
  the user has a PR in, linking each to that exercise's detail/chart page.
- `src/components/nav/navigation.tsx` — added a "Progress" nav link.
- `src/proxy.ts` — added `/progress/:path*` to the protected-routes
  matcher.

**Verified, not just built**: `npm run typecheck`/`lint`/`build` all pass.
Beyond that, seeded ~2 months of realistic backdated history (135 lbs →
190 lbs on Barbell Bench Press across 9 sessions) directly via a temporary
script against the real Neon DB, then drove the real page in a headless
browser: confirmed the PR tile, chart shape, and history table all render
correctly with real data, and confirmed the hover crosshair + tooltip
actually fire and show the right value/date (`165 lbs · 5×5 · Jul 24` at
the hovered point) — this took a few iterations because headless
Chromium's screenshot capture sometimes captures a stale paint on a
synthetic single-jump mouse move; a small mouse-move-with-steps +
`requestAnimationFrame` flush fixed the *screenshot*, and DOM-level
assertions (querying for the crosshair `<line>` and tooltip text) had
already confirmed the actual interactive behavior was correct throughout,
independent of the screenshot artifact.

**Side effect worth knowing about**: this verification pass created a
second throwaway account directly via a DB-insert script (not the signup
form) — username pattern `progresstest<unix-timestamp-ms>`, password
`password123`, first/last name "Progress Test" (coincidentally the same
word as the new nav link, visible in screenshots as the user-menu button
also reading "Progress" — that's just the seeded name, not a UI bug). It
owns one workout ("Monday" / "Chest day") and 9 logged Barbell Bench Press
entries backdated over ~2 months. Also harmless test data, but combine
with the earlier `themetest...` account when doing DB cleanup.
