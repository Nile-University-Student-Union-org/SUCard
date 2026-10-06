# SU Card — Implementation Plan

Companion to [REQUIREMENTS.md](REQUIREMENTS.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
**Builder:** Ahmed (solo) · **Target:** pilot in ~7 weeks, public launch in ~8–9 weeks · **Plan date:** 2026-10-07

---

## 0. Overview

| Phase | Weeks | Outcome |
|---|---|---|
| **P0** External setup & unblockers | 0–1 (parallel, start today) | Accounts, domain, VPS, NU IT consent, printer quotes |
| **P1** Foundation | 1 | Repo, theme, DB, CI/CD, staging live |
| **P2** Auth & roles | 2 | Students sign in with Microsoft; staff log in with password (+2FA for admins) |
| **P3** Cards & onboarding | 2–3 | Batches, branded QR, print files, issuance mode, claim flow, digital cards |
| **P4** Vendors, offers & scanner | 4 | Cashiers can scan and redeem with per-offer limits |
| **P5** Wallet passes | 5 | Google Wallet live; Apple Wallet if the account is ready |
| **P6** Admin dashboard & vendor portal | 6 | Analytics, student management, inventory, vendor stats |
| **P7** QR Style Studio (MVP-lite) | 7 | Visual QR designer with presets and scan-safety checks |
| **P8** Hardening & pilot | 7–8 | Security, backups, tests, pilot with 3–5 vendors and ~100 students |
| **P9** Launch | 8–9 | Cards at the SU desk, announcement, all vendors onboarded |
| **P10** v2 | after launch | Advanced analytics, full Studio, notifications, reports |

**Critical path:** NU IT consent for Microsoft sign-in → domain decision → first card print run (printing takes 1–3 weeks) → pilot.
That's why the card system (P3) comes before the scanner and dashboards.

---

## P0 — External setup & unblockers (start today, runs in parallel)

These have lead times outside your control. Start all of them in week 0.

| # | Task | Owner | Lead time | Blocks |
|---|---|---|---|---|
| 0.1 | **Register Entra app** (multi-tenant), sign in with your NU account → check for "Need admin approval". If blocked, email NU IT for admin consent. Also ask whether the university ID is in the directory (`employeeId`). | Ahmed | Minutes to test; days–weeks if IT needed | All student features |
| 0.2 | **Decide and buy the domain** (it's printed in every QR forever). Put DNS on Cloudflare. | Ahmed + SU | 1 day | Printing, OAuth redirect, pass links |
| 0.3 | **Google Pay & Wallet Console** issuer account; request production access | Ahmed | Days | P5 |
| 0.4 | **Apple Developer Program** enrollment (individual = fast, organization = D-U-N-S, weeks); create Pass Type ID + certificate | Ahmed / SU | 1 day – 3 weeks | P5 (Apple part) |
| 0.5 | **VPS**: provision Ubuntu 24.04, harden (SSH keys, UFW, fail2ban, unattended upgrades), install Docker | Ahmed | 1 day | P1 staging |
| 0.6 | **Backups target**: Cloudflare R2 bucket + restic repo | Ahmed | 1 hour | P8 |
| 0.7 | **Power Automate mailer flow** from `su@nu.edu.eg` (RSS trigger → Parse JSON → Send email). Ask NU IT if automated sending is OK. | Ahmed | 1 day | P2 staff emails |
| 0.8 | **Physical card design**: send [design brief](design/physical-card/DESIGN-BRIEF.md) to Media & Design | Ahmed → Design dept | 1–2 weeks | P3.10 print proof |
| 0.9 | **Printer quotes**: PVC vs laminated paper, variable-data QR, minimum order, turnaround | SU | 1–2 weeks | P3.10 |
| 0.10 | Collect open answers: office location/hours, replacement policy, semester dates, vendor list for pilot | SU | — | P3, P4, P8 |

**Exit criteria:** NU login works (or IT ticket open) · domain bought · VPS reachable over SSH · design brief sent · printer contacted.

---

## P1 — Foundation (week 1)

| # | Task | Done when |
|---|---|---|
| 1.1 | Create repo; Next.js (App Router, TypeScript strict), pnpm, ESLint, Prettier | `pnpm dev` runs |
| 1.2 | Tailwind + shadcn/ui themed with SU tokens; Anton + Poppins via `next/font`; base components (Button, Input, Card, Table, Badge, Dialog, Toast) | Style guide page at `/admin/_ui` |
| 1.3 | Route groups & layouts: `(student)/me`, `(cashier)/scan`, `(vendor)/vendor`, `(admin)/admin` with SU-branded shells | Navigable skeleton |
| 1.4 | `compose.dev.yml` (Postgres 17 + Redis) for local dev | One command starts deps |
| 1.5 | Drizzle setup; **schema v1**: students, cards, card_batches, users, vendors, branches, offers, scan_events, settings, audit_log, email_outbox, qr_styles, qr_style_versions, wallet_passes, apple_devices; indexes from ARCHITECTURE §3 | `drizzle-kit migrate` clean on empty DB |
| 1.6 | Seed script: super admin, sample vendors/offers, settings defaults | `pnpm db:seed` |
| 1.7 | Core helpers: Zod env validation, `audit()` helper, `getSetting()/setSetting()` (cached + tag invalidation), error handling, Sentry | Unit tests pass |
| 1.8 | `/api/health` (DB + Redis check) | Returns 200 |
| 1.9 | Production Dockerfile (standalone output), `compose.prod.yml` (caddy, app, postgres, redis, cron) | Runs locally in prod mode |
| 1.10 | GitHub Actions: lint → typecheck → test → build image → push GHCR → deploy to **staging** over SSH | Push to `staging` branch deploys to `staging.<domain>` |

**Exit criteria:** staging URL live over HTTPS with the branded skeleton and a healthy DB.

---

## P2 — Auth & roles (week 2)

| # | Task | Done when |
|---|---|---|
| 2.1 | Auth.js v5 with **Microsoft Entra ID** provider using NU tenant issuer; `signIn` callback checks `tid` + email regex (from settings) | NU student account logs in; staff-format and non-NU accounts rejected |
| 2.2 | Student record keyed by `ms_oid`; first-login detection | Re-login finds the same student |
| 2.3 | **Credentials** provider for staff; argon2 hashing; lockout after 5 failures | Cashier/vendor/admin can log in |
| 2.4 | **TOTP 2FA** for admin roles (enroll with QR, verify, recovery codes) | Admin can't reach `/admin` without 2FA |
| 2.5 | Role guards: middleware (coarse) + `requireRole()` in every server action/route (fine), vendor scoping | Tests: each role blocked from other areas |
| 2.6 | Rate limiting with Redis (login, claim, scan) | 429 after limit |
| 2.7 | `sendEmail()` → `email_outbox`; `/api/mail-feed` RSS with secret key; connect Power Automate flow to staging | Test email arrives from `su@nu.edu.eg` |
| 2.8 | Staff password reset (single-use token, 60 min) and account-created emails | Reset flow works end to end |
| 2.9 | Admin: manage admin accounts (super admin only) | Create / disable admin |

**Exit criteria:** all five roles can log in to their own area and nowhere else.

---

## P3 — Cards & onboarding (weeks 2–3)

| # | Task | Done when |
|---|---|---|
| 3.1 | Token generator (≥100-bit, base32) + internal serial sequence | Unit tests: uniqueness, format |
| 3.2 | **`lib/qr-style` renderer** (TypeScript port of `design/physical-card/styled_qr_demo.py`): config schema (Zod) → SVG; **NUSU Signature** + **Classic** presets | SVG decodes with zxing at 25 mm / 300 dpi |
| 3.3 | Batch generation (admin): count + label + style version → cards `unassigned` (one transaction) | 1,000 cards generated in < 5 s |
| 3.4 | **Print files**: CSV (`serial, qr_url`); CR80 PDF (one card per page, bleed + crop marks); imposed A4/SRA3 sheet; **test sheet** (20/25/30/35 mm). Downloads audit-logged | Printer accepts the files |
| 3.5 | Inventory page: counts by status/batch, search by serial, batch print status, void card / void batch | Admin can void a lost box |
| 3.6 | **Issuance mode settings**: digital / physical, physical quota (auto-switch back at 0), digital→physical upgrade toggle, stock warning | Quota decrements and auto-switches (test) |
| 3.7 | Student onboarding: profile form (name pre-filled, university ID, uniqueness check) → assign `card_flow` | New student lands in correct flow |
| 3.8 | **Digital flow**: create digital card instantly → card page | Digital student sees QR immediately |
| 3.9 | **Physical flow**: "Get your SU Card" screen (office hours from settings), in-page camera scanner, `/c/[token]` landing with "Link card to your account?" confirm, **claim transaction** (`FOR UPDATE`, first wins), all error states, upgrade from digital | Two parallel claims → exactly one wins (test) |
| 3.10 | Admin **manual link** at the desk (scan card with admin scanner → pick student) + "scan any card" lookup | Desk flow works on a phone |
| 3.11 | **Print proof run**: print ~20 cards from a test batch with the final design; scan-test on 3 cheap Android phones + 1 iPhone under shop lighting | All proofs scan in < 2 s → approve full print |

**Exit criteria:** a student can sign up and get a digital card or claim a printed card; first batch is at the printer.

---

## P4 — Vendors, offers & scanner (week 4)

| # | Task | Done when |
|---|---|---|
| 4.1 | Vendor CRUD (logo upload to uploads volume), branches, status (active/paused/ended) | Admin manages vendors |
| 4.2 | Offer CRUD with Zod rules: discount type/value, dates, active days/hours, visibility, **limit count + period** | Invalid combos rejected with clear errors |
| 4.3 | **Limit engine**: period windows in `Africa/Cairo` time (day, week, month, **semester from settings dates**, total, unlimited); "uses left" + "resets at" | Unit tests for every period & edge (midnight, week start) |
| 4.4 | Cashier & vendor-manager account CRUD (admin side) | Accounts created, email sent |
| 4.5 | `POST /api/scan/validate`: token → card → student → vendor → offers → limits; logs ScanEvent | p95 < 150 ms server time on seed data |
| 4.6 | `POST /api/scan/confirm`: re-check + confirm in **one transaction**; optional bill amount; offer picker | Double-tap can't redeem twice (test) |
| 4.7 | **Cashier PWA**: login → camera scanner (zxing), big ✅/❌ result, name + university ID + offers + uses left, confirm, sound/vibration, "Today" tab, offline/camera-denied states, installable | Works on a mid-range Android in Chrome |
| 4.8 | Void redemption (admin) with reason; voided don't count toward limits | Ledger shows void + audit |
| 4.9 | Public **deals list** for students (category, search), cached with tags | Updates instantly after admin edit |

**Exit criteria:** end-to-end: student card → cashier scan → confirm → limit enforced → visible in ledger.

---

## P5 — Wallet passes (week 5)

| # | Task | Done when |
|---|---|---|
| 5.1 | Google Wallet: service account, **Generic class** (logo, hero, colors from `design/google-wallet/`) | Class approved in console |
| 5.2 | Pass object per student (name, university ID, member since, QR = card URL); "Save to Google Wallet" JWT link | Pass saved on an Android phone, QR scans at cashier |
| 5.3 | Pass updates: name/ID correction, suspension, **card replaced → new QR**; retry queue via cron | Change in admin reflects on phone within minutes |
| 5.4 | **Web card** in Student Portal (styled QR, brightness hint) for iPhone users meanwhile | iPhone user can redeem |
| 5.5 | Apple Wallet *(when account ready)*: pass template, `passkit-generator`, signing certs as secrets | `.pkpass` installs on iPhone |
| 5.6 | Apple Wallet web service endpoints (register/unregister device, list updated serials, fetch latest pass with `If-Modified-Since`) + APNs push | Suspending a student updates the iPhone pass |
| 5.7 | Device-aware "Add to Wallet" buttons | Correct button per platform |

**Exit criteria:** Android students have a working Google Wallet pass; iPhone students have the web card (or Apple Wallet if ready).

---

## P6 — Admin dashboard & vendor portal (week 6)

| # | Task | Done when |
|---|---|---|
| 6.1 | `daily_vendor_stats` rollup + nightly cron; "today" computed live | Rollup matches raw counts (test) |
| 6.2 | KPI tiles (redemptions, unique students, cards by type/status, pending physical, wallet adoption, % active) with date range | Numbers match seed data |
| 6.3 | Vendor leaderboard (sortable, % change), **at-risk vendors** (threshold setting), trends chart, vendor detail page | SU can spot low-traffic vendors |
| 6.4 | **Students page**: server-side search (name/email/university ID, trigram), filters, detail (card history, redemptions), edit name/ID, **suspend/reactivate**, **delete (anonymize, void card)**, bulk actions, CSV export | All actions audit-logged |
| 6.5 | Ledger page (all scan events, filters, export) | Failed scans visible |
| 6.6 | Settings page: email regex, at-risk threshold, office hours, semester dates, issuance mode (from 3.6) | All settings editable |
| 6.7 | **Vendor portal**: own stats only (aggregates, no student names), per branch/offer, peak hours, CSV export, manage own cashiers | Vendor A can't see vendor B (test) |
| 6.8 | Dashboard caching in Redis (5–10 min) + "updated X min ago" + refresh | Only if pages > 1 s |

**Exit criteria:** SU can answer "which vendors get traffic and which don't" from the dashboard.

---

## P7 — QR Style Studio, MVP-lite (week 7)

| # | Task | Done when |
|---|---|---|
| 7.1 | Studio layout: options panel · live preview · scan check panel | Renders with presets |
| 7.2 | Options (MVP-lite): dot shapes (square, circle, rounded, diamond), eye frame/pupil shapes incl. custom SVG upload, per-eye color, solid colors with brand picker, logo (upload/brand, size, padding, plate, clear modules), quiet zone, EC level, fixed version | Each option previews instantly |
| 7.3 | Preview modes: alone, on card mockup, web card, actual print size | Card mockup matches final design |
| 7.4 | **Scan-safety checks**: zxing-wasm decode under simulated conditions → score, contrast check, logo coverage, module mm size; block publish on failure | Bad styles can't be published |
| 7.5 | Save / publish / version / set default / duplicate / archive; JSON import/export | Batch picks a published version |
| 7.6 | Test sheet PDF from the Studio | Printable test sheet |

**Exit criteria:** you can design a new QR look, verify it scans, and use it for the next batch.

---

## P8 — Hardening & pilot (weeks 7–8)

| # | Task | Done when |
|---|---|---|
| 8.1 | **Security review**: OWASP checklist, authz tests per route, rate limits, headers (CSP, HSTS), secrets audit, dependency audit | No high findings open |
| 8.2 | **Backups**: nightly pg_dump + uploads → restic → R2; **restore test** onto a fresh VPS | Restore documented and timed |
| 8.3 | Monitoring: UptimeRobot on `/api/health`, Sentry alerts, disk alert | Alerts reach your phone |
| 8.4 | **Tests**: Vitest (limits, claim race, issuance quota, token, renderer), Playwright (sign-up → claim → wallet; scan → confirm; admin suspend → scan fails) | CI green |
| 8.5 | **Load test** scan endpoints with k6 (lunch-rush: 20 scans/s for 5 min) | p95 < 300 ms |
| 8.6 | Accessibility pass (contrast, focus, labels), mobile pass on small phones | WCAG AA on student + scanner |
| 8.7 | Privacy notice + terms (Law 151/2020), shown at sign-up | Accepted & stored |
| 8.8 | **Docs**: cashier one-page guide (with photos), SU desk guide (handing out & linking cards), admin runbook (backups, restore, secret renewal) | Printed for pilot vendors |
| 8.9 | **Pilot**: 3–5 vendors, ~100 students, 1–2 weeks; daily check of failed scans and feedback | Pilot issues fixed |
| 8.10 | Production deploy: prod compose project, prod DB, Entra redirect for prod domain, Google/Apple prod credentials | Prod smoke test passes |

---

## P9 — Launch (weeks 8–9)

- [ ] Full card print run delivered; boxes logged in inventory; desk stocked
- [ ] Issuance mode set (e.g. Physical with quota = cards in stock, then Digital)
- [ ] All vendors onboarded, cashiers trained, accounts created
- [ ] Announcement from `su@nu.edu.eg` + social media with the sign-up link
- [ ] Launch-week watch: dashboard, Sentry, failed scans, desk queue; hotfix window open

---

## P10 — v2 backlog (after launch)

Full QR Studio (liquid dots, gradients, frames, background art, A/B compare) · advanced analytics (heatmap, segments, retention, funnel, revenue) · fraud signals · monthly vendor PDF reports · wallet push messages ("New deal at X") · card distribution tracking per box.

---

## Working agreements

| Topic | Rule |
|---|---|
| Branches | `main` = production, `staging` = staging, short-lived feature branches |
| Definition of done | Zod-validated inputs · role check on server · audit log for admin actions · loading/empty/error states · mobile checked · tests for business rules · deployed to staging |
| Migrations | Drizzle migrations only, never edit the DB by hand; backward-compatible changes before deploy |
| Secrets | `.env` never committed; prod secrets only on the VPS; Entra secret expiry in calendar |
| Weekly | Demo staging to SU every week; update the open-questions list |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| NU IT doesn't grant Microsoft consent | No student sign-in | Test day 1 (0.1); escalate through SU; fallback would be email OTP (re-add M1 OTP) |
| Domain changes after printing | Every printed card breaks | Decide before 3.4; use a domain SU controls long-term |
| Printed QRs don't scan reliably | Bad cashier experience | Proof run (3.11), test sheet, Studio safety checks, ≥ 25 mm |
| Apple account delayed | iPhone users without Wallet | Web card (5.4) + physical card |
| Printing delays | Physical flow can't start | Issuance mode = Digital until cards arrive |
| Solo developer bandwidth | Slips | Strict MVP-lite scope; v2 list holds everything else |
| VPS failure | Downtime / data loss | Offsite encrypted backups, tested restore, compose files in git |
