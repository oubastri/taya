# To All You Athletes (TAYA)

Workout tracker and social feed for athletes. Built with **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**, and **Supabase** (optional for local demos).

## Quick start

1. Install **Node.js 18+**.
2. Copy environment template and install deps:

```bash
cp .env.example .env.local
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

## Data mode: mock vs real

The app supports two backends, selected with **`NEXT_PUBLIC_DATA_MODE`** in `.env.local`. **Restart `npm run dev`** after changing it (Next inlines `NEXT_PUBLIC_*` at startup).

| Value | Behavior |
|--------|-----------|
| **`mock`** (or anything other than `real`) | Data in **localStorage**. No Supabase session enforcement in middleware. Good for UI work without a backend. |
| **`real`** | **Supabase** auth + Postgres. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Middleware protects routes and refreshes the session cookie. |

On **`npm run dev`**, a **dev console** (terminal-style floating control, bottom-right) shows `NEXT_PUBLIC_DATA_MODE`, **sheet shortcuts** (log move, day detail, athletes search), `cd`-style **route jumps**, and (in mock mode) seed/reset actions. It does not appear in production builds. For **`next start`** previews only, set `NEXT_PUBLIC_DEV_MENU=1` (use sparingly).

**Settings** live on a **single page** at `/settings` (profile, prompts, password, account). Older paths like `/settings/profile` redirect there.

## Supabase setup (real mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run in order:
   - [`supabase/schema.sql`](supabase/schema.sql) — tables, RLS, triggers.
   - [`supabase/add-profile-fields.sql`](supabase/add-profile-fields.sql) — optional profile fields (location, tagline, bio, prompts) if your app uses them.
3. Add a public Storage bucket **`avatars`** if you use profile photo upload (see onboarding/settings).
4. In **Authentication → URL configuration**, add your local and production site URLs and redirect URLs (e.g. `/auth/callback`).
5. Put API URL and anon key in `.env.local` and set `NEXT_PUBLIC_DATA_MODE=real`.

## Features (product)

- Feed (team vs stadium), follows, likes, profiles, athletes globe, workout logging, onboarding, settings, PWA manifest.

## Observability (optional)

- **Vercel Analytics**: If you deploy to Vercel, enable Analytics in the project dashboard; the app includes [`@vercel/analytics`](https://vercel.com/docs/analytics).
- **Plausible**: Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in `.env.local` to your site hostname to load the Plausible script (privacy-friendly analytics).

## CI

GitHub Actions runs `npm run lint` and `npm run build` with `NEXT_PUBLIC_DATA_MODE=mock` on push/PR to `main` or `master` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
