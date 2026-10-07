# Seeded accounts (local development only)

These are **local test credentials**. Never use them on the real server — set a new,
strong password in the server's environment before seeding production.
All sign in at http://localhost:3000/login with "Sign in with email".

## Staff — `pnpm db:seed` (values from `SEED_ADMIN_*` in `.env.local`)

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@sucard.local` | `adminpass123` |

## Test students — `pnpm db:seed:students` (refuses to run in production)

Password for all: `studentpass123`

| Name | Email | University ID | Card flow | Notes |
|---|---|---|---|---|
| Test Student One | `s.one2300@sucard.local` | 231001001 | digital | gets a digital card at seed time |
| Test Student Two | `s.two2300@sucard.local` | 231001002 | physical | no card at seed (a card may be linked from testing) |
| Test Student Three | `s.three2300@sucard.local` | 231001003 | physical | card SU-000002 linked during testing |
| Test Student Admin | `s.admin2300@sucard.local` | 231001004 | digital | student **and** admin — tests the "Where to?" switch |

Real students sign in with Microsoft (NU accounts); these email accounts exist only to test locally.

Keep this file in sync when seeded accounts change.
