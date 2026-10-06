# SU Card — Tech Stack & Architecture

Companion to [REQUIREMENTS.md](REQUIREMENTS.md). Built and maintained by one developer, so the rule is **one codebase, one deploy, everything in Docker Compose on one VPS**.

---

## 1. Stack

### Frontend

| Concern | Choice |
|---|---|
| Framework | **Next.js** (latest, App Router) + **React** + **TypeScript** |
| Styling | **Tailwind CSS** with SU tokens (`#000000`, `#0F3056`, `#0F548D`, `#018BCE`) |
| Components | **shadcn/ui** (Radix-based, copied into the repo, fully themeable) |
| Fonts | **Anton** (display) + **Poppins** (body) via `next/font/google` |
| Forms | **React Hook Form** + **Zod** (same Zod schemas validate on the server) |
| Tables | **TanStack Table** (admin student/vendor lists, sorting, filtering) |
| Charts | **Recharts** |
| QR scanning | **@zxing/browser** (camera in mobile browser) |
| QR rendering | **qrcode** (web card, admin card preview) |
| PWA | Web app manifest + service worker (scanner installable on cashier phones) |

### Backend

| Concern | Choice |
|---|---|
| Runtime | **Next.js server** (Route Handlers + Server Actions), Node.js LTS |
| Auth | **Auth.js v5** — Microsoft Entra ID provider (students, NU tenant only); Credentials provider (staff) + **TOTP 2FA** (`otplib`) for admins |
| Passwords | **argon2** hashing |
| Validation | **Zod** on every input |
| Card tokens | Random 100+ bit tokens (`node:crypto` `randomBytes` → base32), looked up in the DB |
| QR styling | Own **`lib/qr-style`** renderer: `qrcode` (module matrix) → pure function `(matrix, styleConfig) → SVG string`. Runs in the browser (Studio preview) and on the server (print files), so output is identical. |
| QR scan check | **zxing-wasm** decoder in the browser for the Studio's scannability score |
| Print files | **PDFKit + SVG-to-PDFKit** (vector QR in print-ready CR80 PDFs and test sheets), **@resvg/resvg-js** for PNG exports, CSV export |
| Apple Wallet | **passkit-generator** + Apple Wallet web service endpoints + APNs push |
| Google Wallet | **google-auth-library** + Google Wallet REST API (service account) |
| Email | `sendEmail()` → `email_outbox` table → RSS feed → **Power Automate** → Outlook from `su@nu.edu.eg` |
| Cache & rate limiting | **Redis** (Docker, same VPS) + `rate-limiter-flexible` |
| Scheduled jobs | **supercronic** container calling `/api/cron/*` with `CRON_SECRET` (nightly stats rollup, wallet update retries, outbox cleanup, backups) |
| File storage | Docker volume on the VPS (vendor logos, print files), included in backups |

### Database

| Concern | Choice |
|---|---|
| Database | **PostgreSQL 17** (Docker, same VPS, not exposed to the internet) |
| ORM / migrations | **Drizzle ORM** + **drizzle-kit** |
| Analytics | Plain SQL over indexed tables; nightly `daily_vendor_stats` rollup if dashboards slow down |
| Backups | Nightly `pg_dump` + uploads volume → **restic** (encrypted) → **Cloudflare R2** or Backblaze B2 offsite; keep 7 daily, 4 weekly, 6 monthly; monthly restore test |

### Tooling & ops

| Concern | Choice |
|---|---|
| Hosting | **VPS** (Ubuntu 24.04 LTS, 2–4 vCPU, 4–8 GB RAM) + **Docker Compose** + **Caddy** (automatic HTTPS) behind **Cloudflare** (free CDN/DDoS) |
| Deploy | GitHub Actions builds the Docker image → GHCR → SSH to VPS → `docker compose pull && up -d` with health check; `main` = production, `staging` branch = staging on the same VPS |
| Repo / CI | **GitHub** + GitHub Actions (lint, typecheck, tests) |
| Tests | **Vitest** (token, limits, validation logic) + **Playwright** (scan → confirm flow) |
| Errors | **Sentry** |
| Uptime | **UptimeRobot** |
| Lint / format | ESLint + Prettier |
| Package manager | pnpm |

---

## 2. System Architecture

```
 Student (phone)      Cashier (phone, PWA)      Vendor manager / SU admin (laptop)
        │                     │                               │
        └──────────── HTTPS ──┴───────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────────┐
│              Next.js app (Docker on VPS, behind Caddy)             │
│                                                                    │
│  UI      /me (student)   /scan (cashier)   /vendor   /admin        │
│  ───────────────────────────────────────────────────────────────── │
│  API     /api/auth/*        Auth.js                                │
│          /api/scan/*        validate, confirm                      │
│          /api/wallet/*      Apple .pkpass, Google save link        │
│          /api/apple/v1/*    Apple Wallet web service               │
│          /api/mail-feed     RSS outbox for Power Automate          │
│          /api/cron/*        scheduled jobs                         │
│          Server Actions     admin & vendor CRUD                    │
│  ───────────────────────────────────────────────────────────────── │
│  lib     auth · scan (tokens, limits) · wallet · analytics · email │
└───┬──────────┬───────────┬────────────┬────────────┬──────────────┘
    │          │           │            │            │
┌───▼─────┐ ┌──▼────────┐ ┌▼──────────┐ ┌▼─────────┐ ┌▼──────────────────┐
│Postgres │ │ Microsoft │ │ Google    │ │ Apple    │ │ Power Automate    │
│Postgres │ │ Entra ID  │ │ Wallet    │ │ PassKit  │ │ (polls RSS, sends │
│ (VPS)   │ │ NU tenant │ │ API       │ │ + APNs   │ │ via su@nu.edu.eg) │
└─────────┘ └───────────┘ └───────────┘ └──────────┘ └───────────────────┘
        Redis (VPS: cache + rate limits) · Cloudflare (CDN) · Sentry (errors) · UptimeRobot
```

### 2.1 Key flows

**Card generation (admin)**
```
Admin: "Generate 1,000 cards, label 'Batch 3'"
  → insert card_batches row + 1,000 cards (status unassigned, random token,
    next internal serial SU-00xxxx — not printed)
  → download CSV / print-ready PDF (audit-logged) → send to printer
```

**Student sign-up & card activation**
```
"Sign in with Microsoft" → Entra ID (NU tenant) → Auth.js callback
  → check tid == NU tenant AND email matches ^[a-z]\.[a-z]+\d{4}@nu\.edu\.eg$
  → first time? profile form (name pre-filled, enter university ID)
  → first sign-up: assign card_flow from settings (in one transaction):
       issuance_mode = digital  → create digital card (active, linked) → Add to Wallet
       issuance_mode = physical → card_flow = physical; if quota set: quota -= 1,
                                  quota hits 0 → issuance_mode = digital (audit-logged)
  → physical flow and no active card? → "Get your SU Card at the SU office" screen
Student scans card QR (in-page camera, or phone camera opens https://<domain>/c/<token>)
  → POST /api/cards/claim { token }   (camera fails → SU admin links it at the desk)
  → BEGIN; SELECT card … FOR UPDATE
       unknown → ❌ not an SU Card      void → ❌ cancelled
       active  → ❌ already linked      student already has a physical card → ❌
       student has a digital card → void it, link physical (upgrade), update wallet pass
       unassigned → status=active, student_id, linked_at
    COMMIT
  → show "Add to Apple / Google Wallet" (pass QR = same URL as the printed card)
```

**Scan & redeem**
```
Cashier camera (physical card or wallet pass) → extract token from https://<domain>/c/<token>
  → POST /api/scan/validate { token }
  1. look up card by token → unknown / unassigned / void?
  2. load student → suspended?
  3. active offers for this vendor now (dates, days, hours)
  4. per offer: count confirmed redemptions this period vs limit
  5. insert ScanEvent → return ✅ name, ID, offers + uses left / ❌ reason
Cashier taps Confirm → POST /api/scan/confirm { scanId, offerId, bill? }
  → re-check limit + mark confirmed in ONE transaction (no double redemption)
```

**Wallet pass updates**
```
Admin suspends student, corrects name/ID, or student links a replacement card
  → Google: PATCH pass object
  → Apple: APNs push → device fetches updated pass from /api/apple/v1/*
  → failures queued and retried by cron
```

**Email**
```
sendEmail(to, subject, html) → email_outbox row
  → GET /api/mail-feed?key=… (RSS, last 24 h)
  → Power Automate polls → Parse JSON → Send an email (V2) from su@nu.edu.eg
```

### 2.2 Roles & route protection

| Area | Who | Guard |
|---|---|---|
| `/me` | Student | Microsoft session, status `active` |
| `/scan` | Cashier | Staff session, role `cashier`, vendor active |
| `/vendor` | Vendor manager | Staff session, role `vendor_manager`, scoped to own vendor |
| `/admin` | SU admin, super admin | Staff session + 2FA |
| `/c/[token]` | Anyone (QR link) | Public landing; signed-in student without a card sees "Link card SU-xxxxxx to your account?" and must confirm |
| `/api/apple/v1/*` | Apple devices | Apple pass auth token |
| `/api/mail-feed` | Power Automate | Secret key in URL |
| `/api/cron/*` | Cron container | `CRON_SECRET` header, internal network only |

Enforced in Next.js middleware (coarse) **and** in every server action / route handler (fine-grained, never trust the client).

---

## 3. Database Schema (draft)

```
students        id, ms_oid UNIQUE, email UNIQUE, university_id UNIQUE, full_name,
                faculty, year, status, suspend_reason, card_flow (digital|physical), registered_at
card_batches    id, label, count, qr_style_version_id, print_status, created_by, created_at, notes
qr_styles       id, name, status, is_default, created_by, created_at
qr_style_versions id, style_id, version, config JSONB, scan_score, published_by, published_at  -- immutable
cards           id, type (physical|digital), batch_id, serial UNIQUE (internal), token UNIQUE,
                status (unassigned|active|void), student_id, linked_at, linked_by,
                void_reason
wallet_passes   id, student_id, apple_serial, apple_auth_token, google_object_id   -- one per student;
                                                                -- QR follows the active card
apple_devices   device_id, push_token, card_id                     -- Apple web service
vendors         id, name, logo_url, category, contact_*, status, contract_start, contract_end, notes
branches        id, vendor_id, name, address, lat, lng
offers          id, vendor_id, title, description, discount_type, discount_value, terms,
                starts_at, ends_at, active_days, active_hours, visible,
                limit_count, limit_period
users           id, email UNIQUE, password_hash, role, vendor_id, branch_id,
                totp_secret, status, last_login_at                -- staff only
scan_events     id, card_id, student_id, vendor_id, branch_id, cashier_id, offer_id,
                result, reason, confirmed, bill_amount, voided, void_reason, created_at
email_outbox    id, to, subject, html, created_at
audit_log       id, actor_id, action, entity, entity_id, before, after, created_at
settings        key, value       -- issuance_mode, physical_quota_remaining, allow_digital_upgrade,
                                 -- email regex, thresholds, office hours
```

Key indexes:
- `cards (student_id) UNIQUE WHERE status = 'active'` — one active card per student
- `scan_events (student_id, offer_id, created_at) WHERE confirmed AND NOT voided` — limit checks
- `scan_events (vendor_id, created_at)` — dashboards
- `students` trigram index on `full_name`, `email`, `university_id` — admin search

---

## 4. Project Structure

```
su-card/
├─ app/
│  ├─ (student)/me/          sign-in, my card, deals, history
│  ├─ (cashier)/scan/        scanner PWA
│  ├─ (vendor)/vendor/       stats, cashiers
│  ├─ (admin)/admin/         dashboard, students, vendors, offers, settings
│  └─ api/                   auth, scan, wallet, apple, mail-feed, cron
├─ lib/
│  ├─ db/                    Drizzle schema, queries
│  ├─ auth/                  Auth.js config, role guards
│  ├─ cards/                 batch generation, claim/link, print files
│  ├─ qr-style/              config schema (Zod), SVG renderer, presets, safety checks
│  ├─ scan/                  token lookup, limit engine
│  ├─ wallet/                apple.ts, google.ts
│  ├─ email/                 sendEmail(), templates
│  └─ analytics/             dashboard SQL
├─ components/ui/            SU-branded shared components
├─ public/brand/             logos, icons
├─ drizzle/                  migrations
└─ tests/                    vitest + playwright
```

---

## 5. Environments

| Env | App | Database | Notes |
|---|---|---|---|
| Local | `localhost:3000` | Postgres + Redis via `docker compose -f compose.dev.yml` | Register `http://localhost:3000/api/auth/callback/microsoft-entra-id` in Entra. Use a tunnel to test the RSS mailer. |
| Staging | `staging.<domain>` (same VPS, separate compose project) | Separate staging database | |
| Production | Your domain | Production database | |

### Environment variables

```
DATABASE_URL
AUTH_SECRET
AUTH_MICROSOFT_ENTRA_ID_ID
AUTH_MICROSOFT_ENTRA_ID_SECRET          # expires ≤ 24 months — calendar reminder
NU_TENANT_ID
MAIL_FEED_KEY
CRON_SECRET
REDIS_URL
BACKUP_REPO / BACKUP_PASSWORD / R2 keys
GOOGLE_WALLET_ISSUER_ID / GOOGLE_SERVICE_ACCOUNT_JSON
APPLE_PASS_TYPE_ID / APPLE_TEAM_ID / APPLE_PASS_CERT / APPLE_PASS_KEY / APPLE_WWDR_CERT
SENTRY_DSN
```

---

## 6. Why not…

| Alternative | Reason not chosen |
|---|---|
| Separate backend (NestJS, Django, Laravel) | Two codebases and deploys for one developer; no benefit at 10k users |
| Supabase / Vercel (managed) | A VPS is cheaper at this size and keeps everything in one place; the trade-off is that backups, updates and security are your job (see §7) |
| Prisma | Works too; Drizzle is lighter, faster on serverless, and closer to SQL for analytics |
| MongoDB / Firebase | Data is relational (students ↔ cards ↔ scans ↔ offers ↔ vendors) and analytics need SQL |
| Native mobile apps | Wallet passes cover students; scanner works as a PWA |
| Microservices / Kubernetes | Overkill for a few scans per second |

---

## 7. Hosting (VPS)

```
Internet ──► Cloudflare (DNS, CDN, DDoS) ──► VPS :443
                                              │
                    ┌──────── docker compose ─┴──────────────────────────┐
                    │ caddy      TLS, reverse proxy, gzip/zstd           │
                    │ app        Next.js standalone (port 3000, internal)│
                    │ postgres   17, volume pgdata (internal only)       │
                    │ redis      cache + rate limits (internal only)     │
                    │ cron       supercronic → app /api/cron/* + backups │
                    └────────────────────────────────────────────────────┘
                    volumes: pgdata · uploads (logos, print files) · caddy certs
                    backups: restic → Cloudflare R2 (encrypted, offsite)
```

**Server hardening (one-time):** SSH keys only (no passwords, no root login) · UFW: allow 22, 80, 443 only · fail2ban · unattended security upgrades · Postgres and Redis never published to the host · Docker log rotation · Cloudflare "Full (strict)" TLS.

**Ops checklist:** UptimeRobot on `/api/health` · Sentry alerts · disk usage alert at 80% · monthly restore test from backup · renew Entra client secret before expiry · OS reboot window monthly.

---

## 8. Caching

```
Browser ──► Cloudflare ──► Caddy ──► Next.js ──► Redis ──► PostgreSQL
  L1          L2                      L3          L4         L5
```

| Layer | What | TTL | Invalidation |
|---|---|---|---|
| L1 Browser | Hashed JS/CSS/fonts | 1 year, immutable | New deploy = new filenames |
| | Images, vendor logos | 1 day | Version in URL |
| | Scanner PWA shell (service worker) | Until next deploy | New SW on deploy |
| L2 Cloudflare | Static assets, brand images, public deals page | Static 1 yr; deals 5 min | Purge on deploy |
| L3 Next.js data cache | Public deals, vendor directory, active offers per vendor, settings | Until changed | `revalidateTag()` on every admin save |
| L4 Redis | Google Wallet OAuth token | ~55 min | Refetch on expiry |
| | Apple APNs JWT | ~50 min | Regenerate on expiry |
| | Rate-limit counters | Seconds–1 h | Auto-expire |
| | Dashboard query results | 5–10 min | Expire + "Refresh" button |
| | Rendered QR SVG (token + style version) | Permanent | Immutable key |
| L5 Postgres | `daily_vendor_stats` rollup | Nightly + today live | Cron job |
| Files | Batch print PDFs/CSVs | Until batch re-styled | Regenerated on re-style |

**Never cached:** scan validation (card/student status, offer limits), card claiming, auth/role checks, admin student search, mail RSS feed (`no-store`), Apple pass downloads (answered via `If-Modified-Since` → 304, not stored).

**Rules:** invalidate on write in the same code path · nothing cached on the scan path — speed comes from indexes · show "updated X min ago" on cached dashboards · start with L1, L2, tokens, rate limits and the rollup; add dashboard caching only when needed.
