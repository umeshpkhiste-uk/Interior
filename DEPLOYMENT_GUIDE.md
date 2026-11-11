# Deployment Guide

This app deploys to Vercel from the `main` branch of this repository. The repository
root **is** the Next.js app (there is no `app/` subfolder inside it — if you cloned the
outer `9. Interior` project folder, `cd app` first; the Git repo itself starts here).

## 1. One-time Vercel project setup

1. Install the Vercel GitHub integration if you haven't already: go to
   [vercel.com/new](https://vercel.com/new) → "Continue with GitHub" (or Vercel
   dashboard → Account Settings → Git Integrations → GitHub → Configure) and authorize
   access to this repository. Vercel's API/CLI cannot link a GitHub repo without this.
2. Create the project linked to this repo, with:
   - **Root Directory**: leave empty / default (not `app` — see note above)
   - **Framework Preset**: Next.js
   - **Production Branch**: `main`
3. Every push to `main` deploys to production automatically; every other branch/PR gets
   a preview deployment.

## 2. Environment variables

Set these in Vercel → Project → Settings → Environment Variables (Production, Preview,
and Development targets):

| Variable | Value | Type |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the publishable/anon key | Plain |
| `SUPABASE_SERVICE_ROLE_KEY` | the secret/service-role key | **Sensitive** (never Plain — this key bypasses RLS) |
| `NEXT_PUBLIC_APP_URL` | the deployment's own production URL, e.g. `https://<project>.vercel.app` (or your custom domain once attached) | Plain |

The same Supabase project (and its migrations) backs every Vercel environment unless
you deliberately provision a separate Supabase project for preview/staging — there is
no separate "staging" schema in `supabase/migrations/`.

## 3. Supabase Auth URL configuration (required for production)

Supabase only honors auth redirect URLs it's told about. In the Supabase dashboard →
Authentication → URL Configuration:

- **Site URL**: your production URL (matches `NEXT_PUBLIC_APP_URL`)
- **Redirect URLs**: add `https://<your-domain>/auth/callback` (and the same for any
  preview domain pattern you want magic links / confirmation emails to work from,
  e.g. `https://*.vercel.app/auth/callback` is not wildcard-supported by Supabase, so
  preview-deployment auth email links will not resolve correctly unless you add each
  preview URL explicitly — this is a Supabase limitation, not an app one)

Without this, email confirmation and password-reset links will redirect to the wrong
host (or be rejected by Supabase as an untrusted redirect).

## 4. Supabase Storage bucket

The `inspiration` bucket (private, RLS-scoped by organization folder prefix — see
`supabase/migrations/20261111100000_phase9_inspiration_storage.sql`) is created by
migration, not by the Vercel deploy. Running `supabase db push --linked` against your
production Supabase project (per `SETUP_GUIDE.md`) is what provisions it — there is
nothing Vercel-side to configure for Storage.

## 5. Build verification before every production push

Vercel runs `npm run build` on every push to `main`; a build failure blocks the
deployment (previous production deployment stays live — Vercel never promotes a
broken build). Locally, before pushing:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

All four must pass — this is the same bar enforced at the end of every development
phase in this project's history (see commit messages).

## 6. Rollback

Vercel keeps every deployment. To roll back:

- **Dashboard**: Project → Deployments → pick a previous "Ready" production deployment
  → "Promote to Production" (instant, no rebuild).
- **CLI** (if installed locally): `vercel rollback` or `vercel promote <deployment-url>`.

## 7. Monitoring

- **Runtime errors/logs**: Vercel dashboard → Project → Logs (or `vercel logs <url>`).
- **Database**: Supabase dashboard → Logs & Reports, and Database → Roles/Policies to
  re-audit RLS after any schema change.
- No external APM/error-tracking service is wired up (out of scope for this build) —
  Vercel's own function logs and Supabase's logs are the only visibility today.
