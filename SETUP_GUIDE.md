# Setup Guide

## Prerequisites

- Node.js >= 20.9
- A Supabase project (Postgres 15+, created at [supabase.com](https://supabase.com))
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in (`supabase login`)

## 1. Install dependencies

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project's credentials
(Settings → API in the Supabase dashboard):

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<secret key>   # server-only, never exposed to the client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Newer Supabase projects issue `sb_publishable_...` / `sb_secret_...` keys instead of the
older anon/service-role JWTs — either format works with `@supabase/ssr`.

`.env.local` is gitignored. Never commit real credentials.

## 3. Link the project and apply migrations

```bash
supabase link --project-ref <project-ref>
supabase db push --linked
```

This applies every file in `supabase/migrations/` in order: extensions/helpers,
multi-tenancy, clients/projects, rooms, all 7 estimator modules, materials/rates,
BOQ/quotations, design fees/packages, profitability/expenses, the inspiration library,
RLS policies, indexes, and the organization-provisioning RPC.

## 4. Regenerate TypeScript types after any schema change

```bash
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

Do not hand-edit `src/lib/supabase/types.ts` — it's generated.

## 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Registering an account:

1. Creates an `auth.users` row (Supabase Auth) and, via a database trigger, a matching
   `profiles` row.
2. Sends a confirmation email (Supabase's default email provider works out of the box
   for development; configure a custom SMTP provider in the Supabase dashboard for
   production volume).
3. On confirming the email (`/auth/callback`), the `create_organization_with_owner`
   database function provisions the user's organization and makes them its
   `studio_owner` — this is idempotent, so it's safe even if the callback fires more
   than once.

## 6. Local Supabase auth email settings (development)

In the Supabase dashboard → Authentication → URL Configuration, set the **Site URL**
and add a **Redirect URL** matching your dev server, e.g. `http://localhost:3000/auth/callback`.
Without this, confirmation/reset links will redirect to the wrong host.

## Useful scripts

See the table in [`README.md`](./README.md#scripts).
