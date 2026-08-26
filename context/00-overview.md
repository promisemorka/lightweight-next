# Light Weight → Next.js Rebuild: Context Directory

This directory captures the context behind the rebuild of "Light Weight" (a
personal Springboard capstone fitness-tracking app) into a modern, unified
Next.js application. It exists so anyone (human or agent) picking this project
back up doesn't have to re-derive the reasoning that shaped it.

Files in this directory:

- **01-original-app-inventory.md** — full inventory of the old two-project
  codebase (`lightweight-backend/` + `lightweight-frontend/`) as it stood
  before the rebuild: every route, model, component, and — importantly — the
  real correctness/security bugs found during the audit.
- **02-decisions.md** — every architecture decision made and why, in the
  order they were decided.
- **03-plan.md** — the full implementation plan as approved, verbatim.
- **04-progress.md** — a running log of what has actually been built in
  `lightweight-next/`, file by file, and what's still outstanding.

## Quick status (see 04-progress.md for detail)

`lightweight-next/` builds cleanly (`npm run build`, `npm run typecheck`,
`npm run lint` all pass) and implements auth, workouts, logged exercises,
exercise search/admin, and profile/admin-user management. It has **not** been
run against a real database yet — that requires a Neon connection string in
`lightweight-next/.env.local`, which only the project owner can provision.
Automated tests (Vitest/Playwright) and deployment are not yet done.

The old `lightweight-backend/` and `lightweight-frontend/` folders are left
completely untouched and still work as they did before — this rebuild is
additive until the new app reaches parity and is deliberately cut over.
