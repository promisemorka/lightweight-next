# Original App Inventory (pre-rebuild)

Full codebase inventory of `lightweight-backend/` (Express/Node/PostgreSQL)
and `lightweight-frontend/` (CRA + React 16), captured before any rebuild
work began. This is what the Next.js rebuild is replacing.

## Database schema (`lightweight-backend/lightweight-schema.sql`)

- **users**: `id` PK serial, `username` varchar(25) unique, `first_name` text,
  `last_name` text, `email` text (CHECK contains `@`), `password` text,
  `is_admin` bool default false
- **workouts**: `id` PK serial, `day_of_week` text, `description` text,
  `user_id` FK → users (ON DELETE CASCADE)
- **exercises**: `id` PK serial, `name` text, `body_part` text, `equipment`
  text, `gif_url` text, `target` text
- **loggedexercises**: `id` PK serial, `workout_id` FK → workouts (CASCADE),
  `exercise_id` FK → exercises (CASCADE), `weight` int, `unit` text,
  `no_of_sets` int, `no_of_reps` int

No unique constraint existed on `workouts.day_of_week` or `exercises.name`,
even though several model methods used those columns as unique identifiers.

## Backend models (`lightweight-backend/models/`)

- **exercise.js** (table `exercises`): `create` (dup-check by name),
  `findAll` (dynamic `ILIKE` filters), `get(name)`, `update(name, data)`,
  `remove(name)`. `update`/`remove` key off `name`, not `id`.
- **loggedexercise.js** (table `loggedexercises`): `create` (no dup-check
  despite stale doc comment claiming one), `get(workout_Id)` (4-table join,
  no ownership scoping), `update(id, data)` (contains a dead/buggy
  `jsToSql` mapping for a non-existent `loggedexerciseId` column, harmless
  only because `id` is never passed in `data`), `remove(id)`.
- **user.js** (table `users`): `authenticate`, `register`, `findAll`,
  `get(username)` (dead commented-out join code left in place), `update`,
  `remove`.
- **workout.js** (table `workouts`): `create` (JS-side case-insensitive
  dup-check per user_id, not DB-enforced), `findAll` (**unscoped — returns
  every user's workouts**), `get(username)`, `update(day, data)` /
  `remove(day)` (**keyed by `day_of_week` string, not `id`, and not scoped
  to the requesting user**).

## Helper (`lightweight-backend/helpers/sql.js`)

`sqlForPartialUpdate(dataToUpdate, jsToSql)` builds `SET "col"=$n` clauses
for UPDATE statements. Used by all four models' `update()`.

## Backend routes (`lightweight-backend/routes/`)

- **auth.js**: `POST /auth/token` (login), `POST /auth/register` (forces
  `isAdmin: false`). No auth required.
- **exercises.js**: admin-only create/update/delete by `name`; public
  list (filtered by name/bodyPart/equipment/target) and get-by-name.
- **loggedexercises.js**: `ensureLoggedIn` on all routes, but **no ownership
  check** — any logged-in user can GET/PATCH/DELETE another user's logged
  exercise by guessing its `id`.
- **users.js**: admin-only create/list; get/update/delete gated by
  `ensureCorrectUserOrAdmin` (self or admin).
- **workouts.js**: `POST /workouts/day` (create); `GET /workouts` (**all
  users' workouts, unfiltered — bug**); `GET /workouts/:username`
  (`ensureLoggedIn` only — **any logged-in user can view any other user's
  workouts**); `PATCH`/`DELETE /workouts/:day` (**no ownership check, and
  matches by `day_of_week` string, not id**).

## Middleware (`lightweight-backend/middleware/auth.js`)

- `authenticateJWT` (global): verifies `Authorization: Bearer <token>`,
  sets `res.locals.user`; silently no-ops if missing/invalid.
- `ensureLoggedIn`: 401 if no `res.locals.user`.
- `ensureAdmin`: 401 if not `res.locals.user.isAdmin`.
- `ensureCorrectUserOrAdmin`: 401 unless admin or `user.username ===
  req.params.username`.

## App wiring

- `app.js`: express + cors + morgan + `express.json()` + global
  `authenticateJWT`; generic 404/error handlers.
- `db.js`: a single `pg.Client` (not a `Pool`) — no pooling/reconnect.
- `config.js`: **logs `SECRET_KEY` to stdout on every boot** via the
  `colors` package. `BCRYPT_WORK_FACTOR` is 1 in test, 12 otherwise.
- `Procfile`: Heroku-style `web: node server.js` (Heroku free tier is gone).

## Frontend inventory (`lightweight-frontend/src/`)

- **api/api.js**: single `LightWeightAPI` static class wrapping axios,
  1:1 mapping to backend endpoints. Stores the JWT statically and passes it
  as a Bearer header.
- **homepage/Homepage.js**: landing page; imports
  `bootstrap/dist/css/bootstrap.min.css` here specifically — the only
  explicit Bootstrap CSS import in the app, functioning as a global
  side-effect.
- **workouts/**: `WorkoutList.js` (fetches user's workouts, **uses
  `uuid.v4()` regenerated per render as React keys — defeats
  reconciliation**), `WorkoutDay.js` (react-bootstrap `Dropdown` +
  FontAwesome gear icon for edit/delete), `WorkoutForm.js` (create),
  `WorkoutEditForm.js` (edit; has dead commented-out `useContext` code).
- **exercises/**: `ExerciseList.js` (search/filter, also uses
  `uuid.v4()` as keys), `ExerciseForm.js` (search box), `ExerciseCard.js`
  (summary card), `ExerciseView.js` (detail by name).
- **logExercise/**: `LogExercise.js` (row display, edit/delete dropdown),
  `LogExerciseForm.js` (create), `LoggedExerciseEditForm.js` — **route is
  `/workouts/edit/:id/:weight/:unit/:no_of_sets/:no_of_reps`, i.e. the full
  record's field values are encoded directly in the URL path and used as
  the form's initial state, instead of fetching fresh data by id**.
- **profiles/ProfileForm.js**: edit-profile form requiring password
  re-entry to save. Has a stray `debugger;` statement in the catch block,
  an unused `useTimedMessage` import, and no real `onSubmit` handler (Save
  button uses `onClick` directly).
- **routes-nav/Navigation.js**: **reads `currentUser.first_name`
  (snake_case) but the API returns camelCase `firstName` everywhere else —
  always silently falls back to username.**
- **routes-nav/PrivateRoute.js**: react-router v5 wrapper, redirects to
  `/login` if no `currentUser` in context — only checks "is someone logged
  in," not resource ownership.
- **common/Alert.js**, **common/LoadingSpinner.js**: generic message list
  and a plain "Loading..." text div.
- **auth/UserContext.js**, **hooks/useLocalStorage.js**: `currentUser` via
  React Context; JWT token synced to `localStorage` via a custom hook (the
  only place `localStorage` is touched directly).
- **hooks/useTimedMessage.js**: defined but effectively unused dead code.
- **App.js**: owns `currentUser`/`token` state, decodes the JWT client-side
  with the full `jsonwebtoken` package (only needed to read the payload,
  not verify it) just to get the username, then fetches the current user.

### Dependency/tooling smells

- `react-scripts` 4 needs `--openssl-legacy-provider` to boot on modern
  Node — the toolchain itself has aged out.
- React 16.12, react-router-dom v5, Bootstrap 4 + jQuery + Popper 1,
  `jsonwebtoken` in the frontend package.json (only needed to decode, not
  verify) — all end-of-life relative to current tooling.
- `body-parser` is a declared backend dependency but never required in
  `app.js` (dead dependency; `express.json()` is used instead).
- Stray empty directories `src/api/be`, `src/api/4b`, `src/api/d4` in the
  frontend — junk, not referenced anywhere.
- `build/` (CRA build output) was committed alongside `src/`.

## Casing/naming inconsistencies found across the stack

Backend models consistently return camelCase (`firstName`, `bodyPart`,
`gifUrl`, `dayOfWeek`), but: `Navigation.js` reads `first_name`;
`LoggedExerciseEditForm`/`LogExercise.js` use `no_of_sets`/`no_of_reps`
while `LogExerciseForm.js` uses `noOfSets`/`noOfReps` for the same
underlying fields.

## Summary of correctness/security bugs (carried into the rebuild plan as
must-fix items)

1. `Workout.update`/`remove` and `Exercise.update`/`remove` key off
   non-unique text columns (`day_of_week`, `name`) instead of `id`.
2. No ownership checks beyond "is logged in" on workouts/logged-exercises
   routes — cross-user read/edit/delete by guessing an id or username.
3. `Navigation.js` casing bug (`first_name` vs `firstName`).
4. `LoggedExerciseEditForm`'s URL-encoded-record route (stale-data-prone).
5. `uuid.v4()` regenerated per render used as React list keys.
6. `SECRET_KEY` logged to stdout on every server boot.
7. Single `pg.Client` (not a `Pool`) — no connection pooling/reconnect.
