# Seeded accounts (local development only)

Accounts created by `pnpm db:seed` (values come from `SEED_ADMIN_*` in `.env.local`).
These are **local test credentials**. Never use them on the real server — set a new,
strong password in the server's environment before seeding production.

| Role | Email | Password | Sign in at |
|---|---|---|---|
| Super admin | `admin@sucard.local` | `adminpass123` | http://localhost:3000/login |

Keep this file in sync when seeded accounts change.
