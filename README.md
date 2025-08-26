# Schedules

A lightweight shift scheduling app built with Next.js, Prisma, Supabase and Google Calendar integration. Optimized for low cold-start latency on Vercel and designed for quick local development.

## Features

- Create, view and manage shifts
- Google Calendar sync (OAuth + event upload)
- Supabase integration for optional ancillary services
- Prisma ORM with serverless-friendly connection handling
- TailwindCSS-based UI with a peacock color theme
- Cold-start improvements (edge routes, caching utilities, warmup helpers)

## Tech stack

- Next.js (App Router)
- React 19
- TypeScript
- Prisma (Postgres)
- Supabase
- Google APIs (Calendar)
- Tailwind CSS

## Quick start (local)

1. Clone and install:

```powershell
git clone <repo-url>
cd schedules
npm install
```

2. Environment variables

Create a `.env` at the project root or set env vars in your deployment provider. Minimal set used by the app:

- `DATABASE_URL` - Postgres connection string
- `JWT_SECRET` - Secret used to sign auth tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client id
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback (example: `http://localhost:3000/api/google/callback`)
- `NEXT_PUBLIC_SUPABASE_URL` - (optional) Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - (optional) Supabase anon key

There may be additional environment flags used in `src/app/api/*` routes; check the code if you rely on other integrations.

3. Prisma setup

Prisma generate and migrations are wired into the project's scripts. Run once locally:

```powershell
npx prisma generate
npx prisma migrate dev
```

4. Start dev server

```powershell
npm run dev
# opens at http://localhost:3000
```

## Build & deploy

Production build (also used by Vercel):

```powershell
npm run build
npm start
```

When deploying to Vercel, the project has a `vercel.json` in the repo; ensure the environment variables above are set in your Vercel project settings. The `postinstall` script runs `prisma generate` automatically.

## Important implementation notes

- Prisma: The project includes a retry wrapper (`executeWithRetry`) in `src/lib/prisma.ts` which handles rare "prepared statement already exists" (Postgres `42P05`) conflicts. This mitigates serverless concurrency issues. If you run into frequent statement conflicts, consider adding a dedicated connection pooler (pgbouncer) or switching to a managed pooling solution.

- Cold start improvements: Several API routes were adjusted to use edge runtimes where appropriate, and caching utilities live in `src/lib/performance.ts`. Warmup endpoints exist under `src/app/api/warmup` to help keep critical endpoints responsive on Vercel.

- UI theme: The peacock color scheme is defined as CSS variables in `src/app/globals.css` (`--accent-light: #E7D8FF`, `--border-light: #C8A5FF`). If colors appear overridden, inspect global CSS rules first.

## Troubleshooting

- Prepared statement errors (Postgres `42P05`): The app retries and resets the Prisma connection automatically via `executeWithRetry`. If you still see frequent failures:
  - Ensure your Postgres instance supports many concurrent connections or add a pooler (pgbouncer)
  - Reduce client-side concurrency where possible

- Colors not applying on calendar events: A global CSS rule previously targeted all `div` elements; the project now scopes that rule in `src/app/globals.css`. If you still see incorrect styling, inspect the element in the browser to find overridden rules.

- Prisma requires `prisma generate` after schema changes. If build fails with missing client errors, run:

```powershell
npx prisma generate
```

## Developer notes & tips

- API routes that rely on cookies or dynamic data are marked `force-dynamic` to avoid incorrect static rendering in the App Router.
- Avoid expensive synchronous work during requests; offload to background routes where possible to improve responsiveness.
- For debugging, set `NODE_ENV=development` locally to enable additional logs in Prisma and server routes.

## Project structure (high level)

- `src/app` - Next.js app routes & pages
- `src/components` - UI components (including `CalendarView.tsx`)
- `src/lib` - helpers: `prisma.ts`, `auth.ts`, `performance.ts`, `google.ts`
- `prisma/` - Prisma schema and migrations

## Contributing

Contributions are welcome. Please open issues or PRs describing the change. Keep changes focused and add tests if you introduce business logic changes.

## License

MIT

---

If you want, I can:
- Expand the Environment Variables section to list every env key discovered in `src/app/api` routes,
- Add a small local dev checklist and common cURL commands to exercise the API,
- Or generate a short `DEVELOPING.md` with notes about performance and cold-start debugging.

Tell me which of those you'd like next.
