<!--
  This is the implementation plan as approved by the project owner via
  ExitPlanMode, copied verbatim from
  /Users/promisemorka/.claude/plans/playful-snacking-pie.md for durability
  (that path lives outside this repo, in the Claude Code plans directory,
  and isn't guaranteed to persist). See 04-progress.md for how actual
  implementation deviated from or refined this plan.
-->

# Light Weight → Next.js Rebuild

## Context

This is a personal Springboard bootcamp capstone — a fitness-tracking app (search exercises, plan workouts by day, log sets/reps/weight) built as two separate projects: `lightweight-backend/` (Express 4 + raw `pg` + hand-built SQL) and `lightweight-frontend/` (CRA + React 16 + react-router v5 + Bootstrap 4). The stack has aged out (react-scripts needs `--openssl-legacy-provider` to even boot on modern Node; Heroku's free tier the README points at is gone), and a full codebase inventory turned up several real correctness/security bugs, not just style issues:

1. `Workout.update`/`remove` and `Exercise.update`/`remove` key off non-unique text columns (`day_of_week`, `name`) instead of `id` — can silently touch the wrong row.
2. No ownership checks beyond "is logged in" on workouts/logged-exercises routes — any authenticated user can read/edit/delete another user's data by guessing an id, and `GET /workouts/:username` lets anyone view anyone else's workouts.
3. `Navigation.js` reads `currentUser.first_name` but the API returns camelCase `firstName` — always silently falls back to username. Casing is inconsistent elsewhere too (`no_of_sets` vs `noOfSets`).
4. `LoggedExerciseEditForm`'s route encodes full field values in the URL path instead of fetching fresh by id — fragile, stale-data-prone.
5. `uuid.v4()` regenerated per render is used as React list keys — defeats reconciliation.
6. `SECRET_KEY` is logged to stdout on every server boot.
7. A single `pg.Client` (not a `Pool`) is used for all DB access — no pooling/reconnect.

Goal: rebuild this as a single modern, secure, unified full-stack app — not a re-skin — fixing all of the above as part of the migration rather than porting them forward.

**Confirmed decisions:**
- Unified **Next.js (App Router)** app — Server Components/Server Actions replace the separate Express API + axios client entirely.
- **TypeScript** everywhere.
- **Tailwind CSS + shadcn/ui** for styling/components (drops Bootstrap 4, react-bootstrap, FontAwesome, jQuery).
- **Drizzle ORM + PostgreSQL**, hosted on **Neon**.
- **Auth.js (NextAuth) v5**, Credentials provider, **JWT session strategy** (no OAuth planned, so no adapter/session tables needed), httpOnly cookies replacing JWT-in-localStorage.
- New app is built in a **new sibling folder** `lightweight-next/`; `lightweight-backend/` and `lightweight-frontend/` stay frozen/untouched until the new app reaches parity, then get archived into `legacy/`.
- **Fresh start on data** — no migration of the old Postgres DB; only the exercise reference list gets reseeded.
- Keep an **admin-create-user** Server Action (ported from the old admin-only `POST /users`), gated by `requireAdmin()`.

## New Project Structure

```
lightweight/
├── lightweight-backend/       # frozen reference, untouched until cutover
├── lightweight-frontend/      # frozen reference, untouched until cutover
└── lightweight-next/
    ├── drizzle/
    │   ├── schema.ts               # tables + relations()
    │   ├── migrations/             # drizzle-kit generated SQL
    │   └── seed.ts                 # exercises reference data only
    ├── drizzle.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                              # Homepage
    │   │   ├── (auth)/login/page.tsx
    │   │   ├── (auth)/signup/page.tsx
    │   │   ├── (app)/                                 # auth-required route group
    │   │   │   ├── layout.tsx                          # shell w/ Navigation
    │   │   │   ├── workouts/
    │   │   │   │   ├── page.tsx                        # workout list (server)
    │   │   │   │   ├── new/page.tsx
    │   │   │   │   └── [workoutId]/
    │   │   │   │       ├── page.tsx                    # day detail + logged exercises
    │   │   │   │       ├── edit/page.tsx
    │   │   │   │       └── log/new/page.tsx
    │   │   │   │       └── log/[loggedExerciseId]/edit/page.tsx
    │   │   │   ├── exercises/
    │   │   │   │   ├── page.tsx                        # list + filters via searchParams
    │   │   │   │   └── [exerciseId]/page.tsx
    │   │   │   └── profile/page.tsx
    │   │   ├── admin/
    │   │   │   ├── layout.tsx                          # server-side isAdmin gate
    │   │   │   ├── exercises/...                       # CRUD
    │   │   │   └── users/...                           # list + admin-create-user
    │   │   └── api/auth/[...nextauth]/route.ts
    │   ├── auth.ts                                     # Auth.js v5 config
    │   ├── middleware.ts                               # route protection
    │   ├── db/index.ts                                 # drizzle(pool) singleton
    │   ├── actions/{auth,workouts,exercises,logged-exercises,users}.ts
    │   ├── lib/
    │   │   ├── auth-guards.ts                          # requireUser/Admin/WorkoutOwner/LoggedExerciseOwner
    │   │   ├── validations/{auth,workout,exercise,logged-exercise}.ts   # zod schemas
    │   │   └── utils.ts
    │   ├── components/
    │   │   ├── ui/                                     # shadcn primitives
    │   │   ├── nav/navigation.tsx
    │   │   ├── workouts/*, exercises/*, profile/*
    │   └── types/{index.ts,next-auth.d.ts}
    ├── tests/{unit,e2e}/
    ├── playwright.config.ts
    ├── vitest.config.ts
    └── .env.local
```

## Drizzle Schema (`drizzle/schema.ts`)

1:1 with the old schema, with the bug fixes baked in as real constraints:

- `users`: `id`, `username` (unique), `firstName`, `lastName`, `email`, `passwordHash` (renamed from `password`), `isAdmin`, `createdAt`.
- `workouts`: `id`, `dayOfWeek`, `description`, `userId` (FK cascade) — **add `unique(userId, dayOfWeek)`** and an index on `userId` (neither existed before).
- `exercises`: `id`, `name` (**now unique** — wasn't before), `bodyPart`, `equipment`, `gifUrl`, `target`, indexes on `bodyPart`/`target`.
- `loggedExercises`: `id`, `workoutId` (FK cascade, indexed), `exerciseId` (FK cascade, indexed), `weight`, `unit` (tighten free text → `enum("lbs","kg")`), `noOfSets`, `noOfReps`.
- `relations()` blocks so pages can do one relational query (`db.query.workouts.findMany({ with: { loggedExercises: { with: { exercise: true } } } })`) instead of hand-joining like `loggedexercise.js` did.

`src/db/index.ts` uses a pooled `pg.Pool` (fixes bug #7), not a single `Client`.

## Auth.js v5 (`src/auth.ts`, `src/middleware.ts`, `src/lib/auth-guards.ts`)

- Credentials provider: `authorize()` looks up `users` by username via Drizzle, `bcrypt.compare` against `passwordHash`, returns the typed user (fixes bug #3 — `firstName` etc. become canonical typed fields via `src/types/next-auth.d.ts` augmentation, no more snake/camel mismatch possible).
- JWT session strategy — no adapter tables needed since Credentials-only.
- `middleware.ts` protects `(app)` and `admin` route groups (replaces `PrivateRoute.js`).
- `auth-guards.ts` exports `requireUser()`, `requireAdmin()`, `requireWorkoutOwner(workoutId)`, `requireLoggedExerciseOwner(loggedExerciseId)` — every mutating Server Action calls the relevant guard first. This is the concrete fix for bug #2: ownership is checked by looking up the row's `userId` (or its workout's `userId`) and comparing to the session, not just "is logged in."

## Server Actions — Old Route → New Action Mapping

| Old route | New location | Fix applied |
|---|---|---|
| `POST /auth/token` | `signIn("credentials", …)` | httpOnly cookie, no client-decoded JWT |
| `POST /auth/register` | `actions/auth.ts: registerUser` | forces `isAdmin: false` |
| `POST /exercises` (admin) | `actions/exercises.ts: createExercise` | `requireAdmin()`; DB-enforced unique `name` |
| `GET /exercises`, `/exercises/:name` | `app/(app)/exercises/page.tsx` + `[exerciseId]/page.tsx` | **by id**, not name |
| `PATCH`/`DELETE /exercises/:name` | `actions/exercises.ts: updateExercise/deleteExercise(id, …)` | **bug #1 fix**: keyed by id |
| `POST /users` (admin) | `actions/users.ts: adminCreateUser` | `requireAdmin()` — kept per decision above |
| `GET/PATCH/DELETE /users/:username` | `actions/users.ts: updateProfile()` (self, via session) + `adminUpdateUser(id)`/`adminDeleteUser(id)` | self-service path never takes a username param at all — removes the "guess another username" surface by construction |
| `POST /workouts/day` | `actions/workouts.ts: createWorkout({dayOfWeek, description})` | `userId` always taken from session, never trusted from client body |
| `GET /workouts` (unscoped, buggy) | **removed** — no legitimate use case; admin equivalent (`adminListAllWorkouts`) added only if needed | drops the bug rather than "fixing" an unused unscoped list |
| `GET /workouts/:username` | `actions/workouts.ts: getWorkoutsForCurrentUser()` + `adminGetWorkoutsForUser(userId)` | **bug #2 fix**: no arbitrary-username route |
| `PATCH`/`DELETE /workouts/:day` | `actions/workouts.ts: updateWorkout/deleteWorkout(workoutId, …)` | **bug #1 + #2 fix**: `requireWorkoutOwner(workoutId)` then id-based mutation |
| `POST /loggedexercises` | `actions/logged-exercises.ts: createLoggedExercise` | `requireWorkoutOwner(workoutId)` before insert |
| `GET /loggedexercises/:workout_Id` | relational query in `[workoutId]/page.tsx` or `getLoggedExercisesForWorkout(workoutId)` | `requireWorkoutOwner(workoutId)` |
| `PATCH`/`DELETE /loggedexercises/:id` | `actions/logged-exercises.ts: updateLoggedExercise/deleteLoggedExercise(id)` | **bug #2 fix**: `requireLoggedExerciseOwner(id)` |

Every action validates input with a zod schema in `src/lib/validations/` (replacing `jsonschema` + `schemas/*.json`), shared with client forms via `react-hook-form` + `zodResolver`.

## Pages / Components (Server vs Client, shadcn mapping)

- Server Components do the data fetching (workout list, exercise list/detail, workout day detail) directly via Drizzle — no client-side `useEffect` fetch layer, no `LightWeightAPI` class, no `UserContext`/`useLocalStorage` (session comes from `auth()`/`useSession()`).
- Client Components only where interactivity is required: forms (`react-hook-form` + shadcn `Form`), the edit/delete dropdown menus (shadcn `DropdownMenu` replacing react-bootstrap `Dropdown`), the exercise search filter bar (updates URL `searchParams`).
- `WorkoutList`/`ExerciseList` use `workout.id`/`exercise.id` as React keys since data is server-rendered — fixes bug #5 (no more `uuid.v4()`-per-render keys).
- `LoggedExerciseEditForm`'s new route is `[workoutId]/log/[loggedExerciseId]/edit/page.tsx` — server-fetches the row fresh by id and passes it to the client form. Fixes bug #4 (no more field values baked into the URL).
- Navigation: server shell + small client `DropdownMenu` island for the user menu; mobile nav via shadcn `Sheet`.
- Icons: `lucide-react` replaces FontAwesome. Alerts/toasts: shadcn `sonner` replaces the old `Alert.js` list-of-strings pattern. Loading: per-route `loading.tsx` + shadcn `Skeleton` replaces the plain-text `LoadingSpinner`.

## Phased Milestones

1. **Scaffold & tooling** — `create-next-app` (TS + Tailwind + App Router), `shadcn init` + base components, install `drizzle-orm`/`drizzle-kit`/`pg`/`next-auth@beta`/`bcrypt`/`zod`/`react-hook-form`, set up Neon `DATABASE_URL` + `AUTH_SECRET`.
2. **Schema, migrations, auth** — full `drizzle/schema.ts` + relations, `drizzle-kit generate`/`migrate`, `auth.ts`, `middleware.ts`, `auth-guards.ts`, login/signup pages + `registerUser` action.
3. **Exercises** — seed reference data (`drizzle/seed.ts`, from `lightweight-seed.sql`'s exercise list), list/detail pages with search filters, admin CRUD.
4. **Workouts + Logged Exercises** — the ownership-critical core: actions with guards, day list/detail/create/edit pages, log-exercise create/edit pages.
5. **Profile, Navigation, Admin users, polish** — profile page/action, session-aware nav, admin user list + `adminCreateUser`, empty/error states, loading skeletons.
6. **Testing, deploy, cutover** — Vitest + Playwright suites, Vercel project wired to Neon, migrate-on-deploy step, then archive `lightweight-backend/`+`lightweight-frontend/` into `legacy/` and update the root `README.md`.

## Testing

- **Vitest** (`tests/unit/`): exercises the Server Actions and `auth-guards.ts` directly against a test Postgres DB — mirrors the old `_testCommon.js` seed/teardown pattern. Explicitly includes a regression test that user A cannot mutate user B's workout/logged-exercise by id (direct coverage of bug #2). `helpers/sql.test.js` has no equivalent (Drizzle's `.set()` replaces `sqlForPartialUpdate` natively) — dropped, not ported.
- **Playwright** (`tests/e2e/`): flow specs — `auth.spec.ts` (signup→login→logout), `workouts.spec.ts` (create day → log exercise → edit → delete, plus the cross-user negative case above), `exercises.spec.ts` (search/filter, admin CRUD gating). Old CRA snapshot tests (`Alert.test.js`, `LoadingSpinner.test.js`, etc.) are tied to the old component tree and are not portable — dropped in favor of these behavior-level specs.

## Deployment

- **Vercel** for the Next.js app (native Server Actions/App Router support, preview deployments).
- **Neon** for hosted Postgres (serverless, branches per Vercel preview).
- GitHub Actions running `vitest run` + `playwright test` before merge; `drizzle-kit migrate` as an explicit deploy step.
- Old two folders stay in the repo untouched until parity, then move to `legacy/`; root `README.md` gets rewritten to describe the new app once cut over.

## Verification

- Each phase ends with `npm run build` passing and the relevant Vitest suite green before moving on.
- After Phase 4, manually walk the golden path in the browser (`npm run dev`): sign up → create a workout day → log an exercise with weight/sets/reps → edit it → delete it → log out.
- Run the cross-user ownership Playwright test explicitly before declaring bug #2 fixed: log in as user A, capture a workout/logged-exercise id, log in as user B, attempt to view/edit/delete it, confirm rejection.
- `drizzle-kit check` to confirm no schema drift before each migration.
