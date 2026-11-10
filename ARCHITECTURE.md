# Architecture

## Folder structure (Next.js App Router)

```
app/
  src/
    app/                        # routes
      (auth)/                   # login, register, reset-password, verify
      (dashboard)/               # authenticated shell: sidebar + topbar layout
        dashboard/
        clients/
        projects/[projectId]/
          rooms/
          estimators/
            kitchen/ wardrobe/ plywood/ ceiling/ paint/ flooring/ electrical/
          boq/
          quotations/[quotationId]/
          design-fee/
          packages/
          profitability/
          expenses/
        materials/                # Material Library + Rate Management
        reports/
        inspiration/
        settings/
      api/                       # route handlers (PDF generation, CSV import, webhooks)
    components/
      ui/                        # shadcn/ui primitives
      layout/                    # sidebar, topbar, project-selector
      forms/                     # shared form patterns (RHF + Zod)
      charts/                    # Recharts wrappers
      tables/
    lib/
      calculations/              # pure calculation engine — see below
      supabase/                  # server client, browser client, types (generated)
      pdf/                       # React PDF templates (quotation, reports)
      format.ts                  # formatINR() and other shared formatters
      validations/               # Zod schemas, one file per domain, shared by forms + API
    types/                       # shared TypeScript domain types
  supabase/
    migrations/                  # SQL migrations, numbered
    seed.sql                     # default rates seeded from the Excel workbook
  tests/
    calculations/                # unit tests per lib/calculations/*.ts, asserted against Excel sample values
  docs/
    EXCEL_ANALYSIS_RAW.md
  EXCEL_TO_WEBAPP_MAPPING.md
  DATABASE_SCHEMA.md
  ARCHITECTURE.md
  README.md / SETUP_GUIDE.md / DEPLOYMENT_GUIDE.md / TESTING_GUIDE.md
  .env.example
```

## Calculation engine design

The engine is the single source of truth for every number in the app (master prompt §26). Rules:

1. **Pure functions only.** Every function in `lib/calculations/*.ts` takes a plain typed input object and returns a plain typed output object — no Supabase calls, no React, no side effects. This is what makes them unit-testable against the Excel sample values and reusable from both UI forms (live preview as the user types) and server-side recompute jobs.
2. **One file per Excel tool**, matching the master prompt's suggested structure exactly: `area.ts`, `kitchen.ts`, `wardrobe.ts`, `plywood.ts`, `false-ceiling.ts`, `paint.ts`, `flooring.ts`, `electrical.ts`, `boq.ts`, `quotation.ts`, `design-fee.ts`, `profitability.ts`, `packages.ts`, plus `rate-revision.ts` and a shared `shared.ts` (currency math, `applyMarginOnPrice`, rounding helpers, `formatINR`).
3. **Currency-safe arithmetic.** All money math happens in integer paise internally (`toPaise`/`fromPaise` helpers in `shared.ts`) to avoid floating-point drift; `numeric(14,2)` in Postgres stores rupees with 2dp, converted at the boundary.
4. **Deterministic rounding.** `roundUpToUnit(value, unit)` replicates Excel's `ROUNDUP(value/unit)×unit` exactly; every module's default rounding unit is a named constant, overridable per the mapping doc's decision #3.
5. **Margin convention.** `applyMarginOnPrice(cost, marginPct)` implements `marginPct >= 1 ? cost : cost / (1 - marginPct)` everywhere margin-on-price is used (decision #2) — this one helper is called from kitchen/wardrobe/ceiling/paint/flooring/electrical/packages so the convention can never drift between modules.
6. **Versioned estimates.** Every calculation function accepts a `rates` object and returns `{ ...outputs, rateSnapshot, calcVersion }`; the API layer persists `rateSnapshot`/`calcVersion` alongside the row so historical estimates stay reproducible even after `materials`/`material_rates` change.
7. **Unit tests required before a module is "done".** `tests/calculations/<module>.test.ts` feeds the same inputs used in the Excel workbook's sample data and asserts the output matches the workbook's computed values (already captured in `docs/EXCEL_ANALYSIS_RAW.md`) within a cent of rounding tolerance. A module isn't marked complete in its phase until this test exists and passes, per master prompt §30.

## Multi-tenancy model

- An `organization` is the billing/isolation boundary. A `profile` (1:1 with `auth.users`) can belong to multiple organizations via `organization_members`, each membership carrying one role.
- The "current organization" is resolved from a cookie/URL param set by the top-nav org switcher, and threaded through every Supabase query via RLS (never trusted from client-supplied input alone — RLS is the actual enforcement).
- The "current project" selector in the top nav is a client-side convenience (recently-used projects, quick jump) — it does not bypass per-request authorization; every project route still re-checks `project.organization_id` against the session's active organization via RLS.

## Role / permission matrix

| Capability | Super Admin | Studio Owner | Manager | Designer | Accountant | Viewer |
|---|---|---|---|---|---|---|
| Manage organizations (cross-tenant) | ✅ | — | — | — | — | — |
| Manage org settings, members, roles | — | ✅ | — | — | — | — |
| Create/edit/archive clients & projects | — | ✅ | ✅ | ✅ (assigned only) | — | — |
| Room measurements & estimators | — | ✅ | ✅ | ✅ | — | read |
| BOQ edit | — | ✅ | ✅ | ✅ | — | read |
| Create/send quotations | — | ✅ | ✅ | request-only | — | read |
| Approve/discount quotations | — | ✅ | ✅ | — | — | — |
| Rate Management (edit rates) | — | ✅ | ✅ | — | — | — |
| View/record expenses & payments | — | ✅ | ✅ | — | ✅ | read |
| View profitability/margins | — | ✅ | ✅ | — | ✅ | — |
| Reports export | — | ✅ | ✅ | project-scoped | ✅ | read |
| Inspiration library | — | ✅ | ✅ | ✅ | — | read |

This matrix is enforced in two layers: RLS policies (data access, non-negotiable) and UI-level capability checks (hiding actions the role can't perform, for UX only — never the actual security boundary).

## PDF generation

React PDF (`@react-pdf/renderer`) templates live in `lib/pdf/`, one per document type (quotation, each of the 10 report types). All templates consume already-computed output objects from the calculation engine or a `quotation_snapshots` row — they never recompute totals themselves, avoiding drift between what's shown on screen and what's printed.

## Error handling & logging

- Server-side: route handlers and server actions wrap calculation-engine calls in typed `Result<T, AppError>` returns; Zod validates all inputs at the API boundary (never trusting client-side validation alone, per master prompt §25).
- Client-side: React Error Boundaries per route segment; toast notifications (shadcn `sonner`) for recoverable errors.
- Structured logging via a thin wrapper around `console` tagged with request id / organization id, forwarded to Vercel's log drain in production.
