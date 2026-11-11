# Interior Design Studio

A production web application for interior design studios and contractors: project &amp; client management, cost estimation for 8 trade categories (room measurement, modular kitchen, wardrobe, plywood &amp; laminate, false ceiling, paint &amp; wallpaper, flooring, electrical), BOQ, client quotations, design fees, Basic/Premium/Luxury package comparison, profitability analysis, rate management, an inspiration library, and reporting.

Built with Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, Supabase (Postgres + Auth + Storage), deployed on Vercel.

## Why this exists

This app rebuilds the costing logic of `Interior-Design-Business-Toolkit.xlsx` (15 Excel-based estimation tools) as a proper multi-tenant SaaS, so an interior design studio can run its entire estimate-to-quotation-to-profitability workflow without juggling spreadsheets. See [`EXCEL_TO_WEBAPP_MAPPING.md`](./EXCEL_TO_WEBAPP_MAPPING.md) for exactly how each Excel sheet maps to this app, and [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) / [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it's built.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials — see SETUP_GUIDE.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run the calculation-engine unit tests (Vitest) |
| `npm run format` | Prettier (writes) |
| `npm run format:check` | Prettier (check only, used in CI) |

## Documentation

- [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) — local environment setup (added in Phase 3 once Supabase is wired up)
- [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) — table design and RLS strategy
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — folder structure, calculation-engine rules, multi-tenancy, role matrix
- [`EXCEL_TO_WEBAPP_MAPPING.md`](./EXCEL_TO_WEBAPP_MAPPING.md) — Excel → feature → DB → calculation mapping, with every ambiguity in the source workbook resolved and documented
- [`docs/EXCEL_ANALYSIS_RAW.md`](./docs/EXCEL_ANALYSIS_RAW.md) — underlying cell-level formula analysis of the source workbook
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — Vercel project setup, environment variables, Supabase auth URL configuration, rollback
- [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) — unit tests, Excel-sample regression testing, E2E verification pattern, RLS/security audit, mobile responsiveness checks

## Status

Under active phase-wise development. See the project plan for the current phase.
