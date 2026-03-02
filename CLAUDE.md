# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Dev server at http://localhost:4321
npm run build     # Astro build + copies .assetsignore to dist/
npm run preview   # Preview the production build locally
```

Deployment uses Cloudflare Workers via `wrangler.toml`. The build output is `dist/_worker.js`.

## Architecture

OpenLoop is a self-hosted feedback collection platform with an embeddable widget.

**Stack**: Astro 5 (SSR-only, `output: 'server'`) + React 19 + Tailwind CSS 4, deployed to Cloudflare Workers. `"type": "module"` — all scripts must be ESM.

**Database**: Supabase (PostgreSQL) with Row Level Security. Types and the shared client are in `src/lib/supabase.ts`. Server-side admin operations use `SUPABASE_SERVICE_KEY`; client-side uses `PUBLIC_SUPABASE_ANON_KEY`.

**Auth**: Custom session management stored in `localStorage` (`sb_session`). The `AuthProvider` in `src/lib/auth.tsx` hydrates from localStorage on mount. Admin routes are guarded client-side.

### URL structure

| Path | Purpose |
|------|---------|
| `/` | Landing page |
| `/~/{slug}/feedback` | Public feedback submission for an org |
| `/~/{slug}/roadmap` | Public roadmap board |
| `/~/{slug}/announcements` | Public announcements |
| `/widget` | Widget iframe endpoint (redirects to feedback page if accessed directly) |
| `/admin/*` | Admin dashboard (login, posts, announcements, settings) |
| `/api/send-notification` | POST — sends email via Resend |
| `/api/rss.ts` | RSS feed |

### Widget system

`public/embed.js` is the customer-facing embed script. It creates an iframe pointing to `/widget?org=...`. The widget page validates the `Referer` header against `organizations.base_url` (CORS-style check) and sets `frame-ancestors` CSP accordingly. The iframe loads the `Widget` React component.

### Notification pipeline

Supabase DB triggers insert rows into `notification_log` on: new post, new vote, status change. The client calls `POST /api/send-notification` which reads `widget_settings.notification_email` and sends via Resend.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon key |
| `SUPABASE_SERVICE_KEY` | yes (server) | Service role key for admin API routes |
| `RESEND_API_KEY` | for email | Email notifications via Resend |

### Database setup

Run `supabase/migrations/001_schema.sql` in the Supabase SQL editor. It is idempotent (uses `IF NOT EXISTS` guards). To wipe and rebuild, uncomment the NUKE section at the top.

### Styling

Primary color `#6366f1` (indigo-500) is defined as `--color-primary` in `src/styles/global.css` using Tailwind 4's `@theme` block. Use `text-primary` / `bg-primary` etc. in components.
