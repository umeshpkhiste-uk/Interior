# Testing Guide

## 1. Unit tests — the calculation engine

```bash
npm run test          # vitest run
npm run test -- --watch
```

16 test files, 90 tests, covering every module in `src/lib/calculations/*.ts`. These are
pure-function tests — no database, no network — and they're the correctness backstop
for every costing formula in the app.

`tests/calculations/excel-samples.test.ts` is the most important file here: each case
re-runs an actual sample row from the source workbook
(`Reference/Interior-Design-Business-Toolkit-0c1627a82e4e6161.xlsx`) through the
calculation engine and asserts the result matches the workbook's own computed value
exactly — not a synthetic hand-picked number. This is what caught two real bugs during
Phase 10 (flooring's adhesive/grout misclassified as labour; paint priced by litres
needed instead of whole cans purchased — see `EXCEL_TO_WEBAPP_MAPPING.md` decisions
#26–27). If you touch any file in `src/lib/calculations/`, re-verify it against the
workbook the same way before trusting a change: open the relevant sheet with
`openpyxl` (`data_only=True` to get computed values, not formula text), read the sample
row's inputs and results, and add/update a case in that file.

## 2. Type checking & linting

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src
```

Both must be clean (lint: 0 errors — a handful of benign `react-hooks/incompatible-library`
warnings on React Hook Form's `watch()` are expected and not a regression signal).

## 3. Production build

```bash
npm run build
```

Confirms every route compiles, every Server Component/Action type-checks against the
generated Supabase types, and no route accidentally forces a dynamic/static mismatch.

## 4. End-to-end verification against the live database

There is no committed Playwright suite — every phase of this project's development was
verified with a disposable E2E script, run once, then deleted (see commit history: each
phase's commit message describes what was exercised). The pattern, if you need to
re-verify a flow:

```bash
npm install --no-save playwright
npx playwright install chromium   # first time only
npm run build && npx next start -p 3100 &
node your-temp-test.mjs           # see pattern below
npm uninstall --no-save playwright
```

Pattern used throughout: use the Supabase **service-role** key (from `.env.local`) to
create a throwaway auth user via `supabase.auth.admin.createUser`, attach it to an
organization with the role you want to test, drive the real UI with Playwright against
the `next start` production server (not `next dev` — Server Actions and route handlers
behave differently under dev), assert against both the UI and direct database reads,
then delete the throwaway user/org/rows and uninstall Playwright again. Always confirm
`git status --short` and `git diff package.json` show no leftover test artifacts before
committing.

Two login-flow gotchas worth knowing if you write one of these: (1) the login form is a
client component — clicking submit before hydration completes causes a plain HTML GET
submit instead of the intercepted Server Action, so add `waitForLoadState("networkidle")`
plus a short wait after `goto` before interacting; (2) Playwright's `page.request.get()`
shares the browser context's cookies, so it's the right way to hit your own route
handlers (PDF/Excel report downloads, etc.) without actually clicking a `target="_blank"`
link, which opens a new tab `waitForResponse` won't see.

## 5. RLS / security audit

Re-run the two live checks performed in Phase 10 whenever you add a table or change a
policy (replace the IDs/roles as needed):

- **Cross-organization isolation**: create two organizations with one user each
  (service-role client), sign in as user B's session (anon key), and confirm a direct
  `select` against an org-A row returns zero rows, not an error (RLS filters silently;
  it doesn't 403).
- **Role-based restriction**: create a `designer`-role member and confirm they cannot
  read a financial table (`project_expenses`, `project_payments`, `material_rates`
  write, etc.) per the role matrix in `ARCHITECTURE.md`.

Also worth a periodic grep-based check (no live DB needed):

```bash
# every public table should have RLS enabled
grep -rh "^create table public\." supabase/migrations/*.sql | sed -E 's/create table public\.([a-z_0-9]+).*/\1/' | sort -u > /tmp/all_tables.txt
grep -rh "enable row level security" supabase/migrations/*.sql | sed -E 's/alter table public\.([a-z_0-9]+).*/\1/' | sort -u > /tmp/rls_tables.txt
comm -23 /tmp/all_tables.txt /tmp/rls_tables.txt   # should print nothing

# every API route should check auth
for f in $(find src/app/api -name "route.ts*"); do grep -q "requireCurrentUserContext" "$f" || echo "MISSING: $f"; done
```

## 6. Mobile responsiveness

No automated visual-regression suite. The Phase 10 pass used Playwright's device
emulation (`devices["iPhone 13"]`) to screenshot representative pages and check
`document.documentElement.scrollWidth > document.documentElement.clientWidth` as a
cheap horizontal-overflow signal — genuinely wide content (a data table, a many-tab
`TabsList`) is the usual culprit, and the usual root cause is a flex/grid ancestor
missing `min-w-0` (flex items default to `min-width: auto`, so they refuse to shrink
below their content's intrinsic width even inside an `overflow-x-auto` wrapper). If you
add a new page with a wide table or a long tab list, give it the same check before
shipping.
