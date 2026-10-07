# SU Card — Requirements

**Owner:** Nile University Student Union (SU)
**Builder / maintainer:** Ahmed Shalaby (solo)
**Status:** v0.3 (2026-10-07) — physical card + QR activation added. Decisions from the first Q&A are applied. Remaining open items are in [§ Open Questions](#open-questions).

---

## 1. Overview

SU Card is a free membership card for **every Nile University student**. SU prints generic **physical cards**, each with a unique QR code. A student signs in with Microsoft, collects a card from the SU office, and scans its QR to link it to their account permanently. The same QR then appears on their **Apple Wallet** / **Google Wallet** pass with their name and university ID. The QR that partner vendors scan to verify the holder and give a discount. Every scan is logged, so SU can see which vendors students actually use and decide which partnerships to keep, grow, or end. Vendors also get their own login to see their stats.

### 1.1 Decisions so far

| Topic | Decision |
|---|---|
| Eligibility | All NU students. No fee. |
| Sign-up | **No student list.** Anyone with a student-format university email (e.g. `a.wesam2300@nu.edu.eg` — one letter, a dot, a word, 4 digits) can sign up using **"Sign in with Microsoft"** (OAuth / OpenID Connect with their university account). No passwords, no email codes. SU promotes the sign-up link through its own channels. |
| Physical card | **Generic** printed card: NUSU logo + a unique QR. **No serial, code or name printed.** Admin generates as many QR codes as needed and prints them. |
| Card issuance mode | **Admin switch** (M2a): **Digital** — new students get a digital card instantly at sign-up, no physical card needed; or **Physical** — new students must collect a physical card and scan it. Physical can be limited to **the next N sign-ups**, then it switches back to Digital automatically. |
| Activation (physical flow) | First login → "collect your card from SU" → student scans the card's QR → if the QR is new it's **permanently linked** to them → Add to Wallet. No card linked = no pass, no discounts. |
| Same QR everywhere | The printed QR and the wallet-pass QR are identical and static. Cashiers can scan either. |
| Student photo | None. Cashier sees name + university ID only. |
| Usage limits | Set **per offer** by the SU admin in the admin panel. |
| Bill amount | Optional field for the cashier. |
| Vendor stats | Yes. Vendors get a login to see their own numbers. |
| Language | English only. |
| Apple Developer account | Not yet. **Required for Apple Wallet** (see §7). |
| Build & maintain | Ahmed, solo. Launch ASAP. |

### 1.2 Users (roles)

| Role | Who | What they do |
|---|---|---|
| **Student** | Every NU student | Collects a physical card, activates it, adds it to their wallet, shows the QR at vendors, browses deals |
| **Cashier** | Vendor staff | Logs in to the scanner, scans QR codes, confirms discounts |
| **Vendor Manager** | Vendor owner/manager | Sees their own stats, manages their cashiers |
| **SU Admin** | SU team | Generates & prints cards, hands them out, manages students, vendors, offers and limits; views analytics |
| **Super Admin** | Ahmed | Everything above, plus admin accounts and system settings |

### 1.3 High-level flow

```
Admin generates a batch of cards (e.g. 1,000) ──► downloads print file ──► printer prints generic cards
                                     │
Student: "Sign in with Microsoft" ──► NU tenant + format check ──► name + email saved from Microsoft, student enters university ID
                                     │
          "Collect your SU Card from the SU office" ──► student gets a card at SU
                                     │
          Student scans the card's QR in the portal ──► QR new?  ── no ──► ❌ already used / invalid
                                     │ yes
          Card permanently linked to student ──► Add to Apple / Google Wallet (same QR, name + university ID)
                                     │
Cashier scans physical card OR wallet pass ──► Server validates (card linked, status, offer limit)
                                     │
                     ✅ Name + university ID + offer   /   ❌ reason
                                     │
                     Cashier taps "Confirm" (bill amount optional) ──► Redemption logged
                                     │
          SU Admin dashboard (all vendors)  ·  Vendor portal (own stats only)
```

---

## 2. Modules

| # | Module | Summary | Phase |
|---|---|---|---|
| M1 | Identity & Access | Microsoft sign-in for students, password login for staff, roles | MVP |
| M2 | Student Onboarding & Activation | Microsoft sign-up, profile, "collect your card", scan-to-link | MVP |
| M3 | Wallet Pass Service | Generate, update, revoke Apple & Google Wallet passes | MVP (Google first if Apple account is late) |
| M4 | QR Token & Validation | What the printed QR holds, how scans are validated, per-offer limits | MVP |
| M5 | Vendor & Offer Management | Vendors, branches, offers, limits, cashier accounts | MVP |
| M6 | Cashier Scanner App | Web app for scanning and confirming discounts | MVP |
| M7 | Redemption Ledger | Record of every scan and redemption | MVP |
| M8 | Admin Dashboard & Analytics | Traffic, trends, vendor health, exports | MVP core / v2 advanced |
| M9 | Vendor Portal | Vendor managers see their stats and manage cashiers | MVP-lite / v2 full |
| M10 | Student Portal | My card, deals list, my history | MVP minimal |
| M11 | Email & Notifications | Staff account emails; later: pass push messages | MVP (email) / v2 (push) |
| M12 | Branding & Design System | SU visual identity across every surface | MVP |
| M13 | Platform & Non-Functional | Security, privacy, hosting, performance, audit | MVP |
| M14 | Physical Cards & Inventory | Generate QR batches, print files, inventory, void/replace, manual link | MVP |
| M15 | QR Style Studio | Advanced visual QR designer with live preview, scan-safety checks, versioned styles per batch | MVP-lite (presets + core options) / v2 full |

---

### M1 — Identity & Access

| ID | Requirement |
|---|---|
| M1-1 | **Students — Sign in with Microsoft (only method).** OpenID Connect via Microsoft Entra ID, scopes `openid profile email` only (no access to mail, files, etc.). Accept the login only if the token's tenant ID (`tid`) is Nile University's tenant **and** the email/UPN passes the format check (M1-2). |
| M1-1b | Student accounts are keyed by the Microsoft account's immutable object ID (`oid`) + tenant, with email stored for search/display. |
| M1-2 | Only emails matching the **student format** can sign up: one letter, a dot, a word, then 4 digits directly after the word, `@nu.edu.eg` (e.g. `a.wesam2300@nu.edu.eg`). Case-insensitive, stored lowercase. Regex: `^[a-z]\.[a-z]+\d{4}@nu\.edu\.eg$`. Rejected examples: `a.wesam.2300@…`, `ahmed.wesam@…`, `a.wesam23@…`. The pattern is an admin setting so it can be changed without a code deploy. Staff-format emails are rejected. |
| M1-3 | **Cashiers, vendor managers, admins** log in with email + password. Admins also need 2FA (TOTP app). |
| M1-3a | **Admins can also sign in with Microsoft.** A super admin can promote an existing student account (NU Microsoft login) to admin; that person then reaches the admin panel through "Sign in with Microsoft" with no separate password. Demoting returns the account to student only. Every role change is audit-logged. |
| M1-3b | **One sign-in screen for everyone** (`/login`): students, SU admins, cashiers and vendor managers. It offers "Sign in with Microsoft" (NU accounts — students and NU staff) and "Sign in with email" (staff/partners with a password). There is no separate staff or admin login page. |
| M1-3c | **One person can hold several roles.** Being a student (has a student profile from Microsoft sign-in) is independent of holding a staff role (super admin / admin / cashier / vendor manager). Example: a student who is also an SU admin. |
| M1-3d | **Choosing an area after sign-in:** if the person has access to one area they go straight there; if they have several (e.g. My SU Card + Admin panel) they see a "Where to?" choice the first time, and the last choice is remembered. |
| M1-3e | **Switching areas:** the account menu in every area shows the other areas the person can access ("Switch to Admin panel" / "Switch to My SU Card") — one click, no second sign-in. Access is still checked on the server for every page and API. |
| M1-4 | Roles: Student, Cashier, Vendor Manager, SU Admin, Super Admin (role-based access on every API). Student is a profile, not exclusive: it can be combined with one staff role (M1-3c). |
| M1-5 | A cashier belongs to one vendor (optionally one branch) and can only scan for that vendor. A vendor manager only sees their own vendor's data. |
| M1-6 | Cashier sessions are long-lived on the shop device (30 days), revocable by admin or vendor manager. |
| M1-7 | Password reset by email. Admin can disable any account instantly. |
| M1-8 | Lockout after 5 failed logins (15 min). |

### M2 — Student Onboarding & Activation

| ID | Requirement |
|---|---|
| M2-1 | **No student list import.** Sign-up is open to any NU account passing the format check (M1-2). Proof of being a student = a successful Microsoft sign-in to the NU tenant. |
| M2-2 | First sign-in: Microsoft → format check → profile form → the student is assigned a **card flow** based on the issuance mode (M2a): **digital** → card created instantly → Add to Wallet; **physical** → **"Get your SU Card"** screen. |
| M2-3 | **Stored per student: email, full name, university ID — nothing else.** Email and full name come from the Microsoft account (OAuth) and are saved automatically (shown read-only, not editable by the student). The only field the student types is the **university ID** (first sign-in only, required, self-reported), format **exactly 9 digits** (e.g. `231001000`, regex `^\d{9}$`). |
| M2-4 | Name and university ID are **locked** after sign-up (they appear on the pass). Changes go through an SU admin. University ID must be unique; a duplicate is flagged for admin review. |
| M2-5 | **"Get your SU Card" screen** (shown until a card is linked): tells the student to collect their card from the SU office, with location and opening hours (editable by admin in settings), and an **"I have my card — scan it"** button. |
| M2-6 | **Scan to link:** the student scans the card's QR with the in-page camera, **or** points their phone camera at the card (the QR is a link, M4-2) while signed in. No typed fallback (nothing is printed besides the QR): if the student can't scan, an SU admin links the card at the desk (M14-7). |
| M2-7 | **Link check (server, one DB transaction with a row lock, first claim wins):** QR exists? → card status `unassigned`? → student has no active card? → set card `active`, `student_id`, `linked_at`. Then show **Add to Apple / Google Wallet**. |
| M2-8 | **Link errors:** ❌ "This isn't an SU Card" (unknown QR) · ❌ "This card is already linked to another account — return it to SU" · ❌ "This card was cancelled — get a new one at SU" (void) · ❌ "You already have an SU Card" (student already has an active **physical** card). Every attempt is logged. |
| M2-9 | **The link is permanent.** A student can't unlink or swap cards themselves. Only an admin can replace a card (M14-6). |
| M2-10 | Rate limit link attempts (e.g. 10 per student per hour). |
| M2-11 | **Lost/damaged card:** student goes to SU → admin voids the old card → student scans a new card → the wallet pass **updates automatically** to the new QR (same pass, no re-download). |
| M2-12 | Student statuses: `active`, `suspended`. **No expiry, no renewal**: a card stays valid until an admin suspends the student, voids the card, or deletes the student. Graduates keep a working card unless suspended. |
| M2-13 | Admin manages students from the dashboard: search, suspend, reactivate, delete (see M8-6). |

#### M2a — Card issuance mode (admin setting)

| ID | Requirement |
|---|---|
| M2a-1 | Admin chooses the **issuance mode** for new sign-ups in Settings: **Digital** or **Physical**. |
| M2a-2 | **Digital:** at profile completion the system creates a **digital card** (random token, same `/c/<token>` QR format, type `digital`), already linked and active. The student goes straight to Add to Apple / Google Wallet. |
| M2a-3 | **Physical:** the student gets the "Get your SU Card" screen and must link a physical card (M2-5 … M2-11). |
| M2a-4 | **Physical quota:** when switching to Physical, admin can set **"only for the next N sign-ups"**. Each new sign-up assigned to the physical flow decrements the counter; at 0 the mode **switches back to Digital automatically** (logged). Leave empty = Physical until changed manually. |
| M2a-5 | The flow is decided **once, at the student's first sign-up**, and stored on the student (`card_flow`). Changing the mode later does **not** affect students who already signed up. |
| M2a-6 | Admin can change one student's flow, or **bulk-switch all pending physical students** (signed up, no card yet) to digital — e.g. when printed cards run out. Switching to digital issues their digital card immediately. |
| M2a-7 | **Digital → physical upgrade** (toggle, default on): a student with a digital card can later collect a physical card and scan it. The physical card replaces the digital one (digital token voided) and the wallet pass **updates to the new QR** automatically. |
| M2a-8 | Settings screen shows: current mode, quota remaining, pending physical students, **unassigned printed cards in stock**, and a warning when pending physical students > cards in stock. |
| M2a-9 | Every mode change (who, when, from → to, quota) is written to the audit log. |

### M3 — Wallet Pass Service

| ID | Requirement |
|---|---|
| M3-1 | **Google Wallet** pass (Generic pass) via the Google Wallet API, delivered as a "Save to Google Wallet" link. |
| M3-2 | **Apple Wallet** pass (`.pkpass`, generic style) signed with SU's Pass Type ID certificate. *Requires the Apple Developer Program (see §7).* |
| M3-3 | Pass front: SU logo, "SU CARD", student name, university ID, and the **same QR as the student's physical card** (no serial shown). Back/details: how to use, link to deals list, support contact, terms. |
| M3-3a | A pass can only be created once the student has an active card — digital (instant) or physical (after linking, M2-7). |
| M3-3b | Google and Apple draw the pass QR themselves as a **plain black square QR** (no custom style). Same content as the branded printed QR, so both scan the same. |
| M3-4 | Pass background navy `#0F3056`, white text, sky-blue `#018BCE` accents, white logo. |
| M3-5 | Passes update remotely when data changes (name/ID correction, suspension, **card replaced → new QR**) — Google via object update, Apple via the PassKit web service + APNs. |
| M3-6 | Suspended or deleted students' passes show as invalid on the pass (where the wallet allows) and always fail at scan time. |
| M3-7 | Student can re-download their pass from the Student Portal anytime. |
| M3-8 | Show the Apple button on iPhone, the Google button on Android, both on desktop. |
| M3-9 | **Until the Apple account exists**, iPhone users use the physical card, or a web card in the portal showing the same QR. |

### M4 — QR Token & Validation

| ID | Requirement |
|---|---|
| M4-1 | Each card has a **random, unguessable token** (≥ 100 bits, e.g. 20 characters base32), created when the admin generates the batch. No personal data and no signature: a token is valid only if it exists in the database. |
| M4-2 | **QR content = a plain code:** `NUSU1:<TOKEN>` (20-char Crockford base32, uppercase, so the QR uses compact alphanumeric mode). No domain is printed, so cards never depend on a domain. Students activate by scanning **inside the SU Card site**. If a domain is adopted later, new batches may use `https://<domain>/c/<TOKEN>`; scanners accept both forever. Each batch records its payload format. |
| M4-3 | The QR is **static and permanent**: the same QR is on the physical card and the wallet pass. (Rotating QR is dropped, since the physical card can't rotate.) |
| M4-4 | Validation (server-side): token exists → card status (`unassigned` → "Card not activated", `void` → "Card cancelled") → student status → vendor active → offer active (dates/days/hours) → offer limit for this student. |
| M4-5 | **Per-offer limits** (set in M5): max redemptions per **student** per period (physical card and wallet pass share the same count). Period options: per day, per week, per month, per semester, total, or unlimited. |
| M4-6 | **Anti-sharing (no photo, static QR):** cashier sees name + university ID and may ask for the NU ID; per-offer limits; fraud signals (M8-14). Lending the card to a friend can't be fully prevented — accepted risk. |
| M4-7 | Validation response < 1 s on 4G. |
| M4-8 | Results: ✅ Valid · ❌ Not an SU Card · ❌ Card not activated · ❌ Card cancelled · ❌ Student suspended · ❌ Offer limit reached (shows when it resets) · ❌ No active offer at this vendor. |

### M5 — Vendor & Offer Management (Admin)

| ID | Requirement |
|---|---|
| M5-1 | CRUD vendors: name, logo, category (food, coffee, fitness, books, services…), contact person, phone, email, location, contract start/end, status (`active`, `paused`, `ended`), internal notes. |
| M5-2 | Vendors can have multiple **branches**; redemptions record the branch. |
| M5-3 | CRUD **offers** per vendor: title, description, discount type (% / fixed EGP / free item / custom text), terms, start/end date, active days & hours, visibility (shown in deals list or hidden). |
| M5-4 | **Limit settings per offer:** count + period (M4-3). Editable anytime; changes apply to future scans only. |
| M5-5 | CRUD cashier and vendor-manager accounts; reset password; disable. |
| M5-6 | Pausing a vendor/offer or ending a contract stops successful scans immediately. |
| M5-7 | Offer change history is kept (who changed what, when). |

### M6 — Cashier Scanner App

Mobile-first web app (PWA, installable to home screen).

| ID | Requirement |
|---|---|
| M6-1 | Login → lands directly on **Scan**. |
| M6-2 | Camera reads QR from the physical card or the wallet pass. No manual entry: if a worn card won't scan, the student shows the wallet pass or the web card instead. |
| M6-3 | **Valid:** big green ✅, student name, university ID, and the applicable offer(s) with remaining uses for this student. |
| M6-4 | **Invalid:** big red ✖ with the reason (M4-7). |
| M6-5 | Cashier taps **"Confirm discount"** to record the redemption. A scan without confirm is logged but not counted as a redemption. |
| M6-6 | Optional **bill amount** (EGP) field on the confirm step. Skippable. |
| M6-7 | If several offers apply, cashier picks the one used. |
| M6-8 | Sound + vibration on success/failure. |
| M6-9 | "Today" tab: this cashier's redemptions today. |
| M6-10 | HTTPS only (camera requirement). Clear message if camera permission is denied or the device is offline. |

### M7 — Redemption Ledger

| ID | Requirement |
|---|---|
| M7-1 | Every scan attempt logged: time, cashier, vendor, branch, card/student, result + reason, offer, confirmed (y/n), bill amount, device info. |
| M7-2 | Append-only. Admin can **void** a redemption with a reason (kept in audit trail); nothing is deleted. Voided redemptions don't count toward limits. |
| M7-3 | Failed scans are kept (fraud detection, cashier training). |

### M8 — Admin Dashboard & Analytics

**Core (MVP)**

| ID | Requirement |
|---|---|
| M8-1 | KPI tiles for a date range: redemptions, unique students, active vendors, cards by type (digital / physical), physical cards printed / unassigned / activated, pending physical students, cards added to a wallet, % of cardholders who used the card at least once. |
| M8-2 | **Vendor leaderboard:** redemptions, unique students, change vs previous period. Sortable. |
| M8-3 | **"At risk" vendors:** below a configurable threshold (e.g. < 10 redemptions in 30 days) highlighted for review. |
| M8-4 | Redemptions over time (day/week/month), overall and per vendor. |
| M8-5 | Vendor detail: trend, branches, offers breakdown, peak days/hours, recent redemptions, total bill amount (when entered). |
| M8-6 | **User management (Students page):** search by name, email, or university ID (partial match, instant results), with filters by status and sign-up date. Each row shows name, email, university ID, status, sign-up date, last redemption. |
| M8-6a | Student detail: profile, linked card (internal serial) and link date, card history (replaced cards), wallet(s) added, full redemption history. Admin can edit name / university ID (corrections). |
| M8-6b | **Suspend / reactivate:** one click with a reason. Suspended cards fail at scan immediately ("Card suspended") and the wallet pass updates. A suspended student **cannot** sign up again with the same email. |
| M8-6c | **Delete:** behind a confirm dialog (type the email to confirm). Removes the student's personal data; their card is **voided** (QR fails as "Card cancelled") and can't be reused. Their past redemptions are **kept anonymized** (counted as "deleted student") so vendor stats don't change. A deleted student's email **can** sign up again as new — use suspend to block someone. |
| M8-6d | Bulk actions on search results: suspend, reactivate, export CSV. Every suspend/delete is written to the audit log (who, when, reason). |
| M8-7 | Filters: date range, vendor, category, offer. |
| M8-8 | Export any table to CSV/Excel. |

**Advanced (v2)**

| ID | Requirement |
|---|---|
| M8-9 | Day-of-week × hour heatmap. |
| M8-10 | Category share (coffee vs food vs fitness…). |
| M8-11 | Student segments: power users vs one-time; adoption funnel (signed up → card linked → added to wallet → first use); time from sign-up to card pickup. |
| M8-12 | Vendor retention: % of students who come back. |
| M8-13 | Revenue driven per vendor (from optional bill amounts). |
| M8-14 | Fraud signals: same card at two distant vendors within minutes, cashier with abnormal volume, many failed scans. |

### M9 — Vendor Portal

| ID | Requirement |
|---|---|
| M9-1 | Vendor managers log in and see **only their vendor**: redemptions over time, unique students, per-branch and per-offer counts, peak hours, total bill amount (if entered). |
| M9-2 | They **don't** see student names/IDs (privacy), only aggregate numbers. **[confirm — Q4]** |
| M9-3 | Manage their own cashier accounts (add, disable, reset password). |
| M9-4 | View (not edit) their active offers and limits. Offer changes go through SU admin. |
| M9-5 | Export their stats to CSV. (v2: monthly SU-branded PDF report emailed automatically.) |

### M10 — Student Portal

| ID | Requirement |
|---|---|
| M10-1 | Sign in with Microsoft. No card yet → "Get your SU Card" screen (M2-5). Card linked → Add to Apple/Google Wallet buttons, or the web card showing the same QR. |
| M10-2 | Browse deals (category, search), see each offer's terms and limit. |
| M10-3 | My history: where/when I used the card, remaining uses per offer. |
| M10-4 | Lost phone: sign in on the new phone and re-add the pass (same QR). Lost card: shows "Go to SU to get a replacement" (M2-11). |

### M11 — Email & Notifications

| ID | Requirement |
|---|---|
| M11-1 | Transactional emails (low volume): vendor/cashier/admin account created, password reset. Optional, admin toggle: card issued with wallet links, card suspended. All SU-branded. |
| M11-2 | No bulk invites: SU announces the sign-up link through its own channels. Students sign up via Microsoft, so the launch spike sends no email. |
| M11-3 | Sending domain set up with SPF, DKIM, DMARC so mail to `@nu.edu.eg` (Outlook) doesn't go to junk. **Test delivery to university inboxes early.** |
| M11-4 | *(v2)* Push messages through wallet passes (e.g. "New deal at X"). |

### M12 — Branding & Design System

Sources: `SU branding.pdf`, `assets/brand/`.

| Token | Hex | Use |
|---|---|---|
| Black | `#000000` | Text, dark backgrounds |
| Navy (primary) | `#0F3056` | Headers, sidebar, pass background |
| Blue | `#0F548D` | Buttons, links, primary chart series |
| Sky Blue (accent) | `#018BCE` | Highlights, active states, secondary chart series |
| White | `#FFFFFF` | Page background, text on navy |

| Type | Font | Use |
|---|---|---|
| Display | **Anton** Regular | Page titles, "SU CARD" wordmark, KPI numbers |
| Body / UI | **Poppins** | Everything else |

| Asset | File |
|---|---|
| Logo, white (for navy/black backgrounds) | `assets/brand/su-logo-white-on-black.png` |
| Logo, full color (for white backgrounds) | `assets/brand/su-logo-color.png` |

| ID | Requirement |
|---|---|
| M12-1 | Scanner, Admin, Vendor Portal, Student Portal, wallet passes and emails all use the tokens above. |
| M12-2 | White logo on navy/black; color logo on white. Never recolor, stretch, or add effects. |
| M12-3 | Green/red for scan success/failure are functional colors outside the brand palette, used only in the scanner result. |
| M12-4 | One shared component library (buttons, inputs, tables, cards, charts) for all apps. |
| M12-5 | Derive an icon-only mark (the "u/n" symbol) for app icon, favicon and the Apple pass icon. Vector (SVG) logo still preferred for sharpness — see Q2. |

### M14 — Physical Cards & Inventory (Admin)

| ID | Requirement |
|---|---|
| M14-1 | **Generate a batch:** admin enters a count (e.g. 1,000) and a label → system creates that many cards with status `unassigned`, each with a random token (M4-1) and a sequential **internal serial** (e.g. `SU-004821`) used only in the admin panel and print files — **never printed on the card**. Generate as many batches as needed. |
| M14-2 | **ZIP export per batch** (for the third-party card supplier): `qr/svg/SU-000001.svg …` (vector, default), optional `qr/png/…` at 600 / 1200 / 2400 px, `manifest.csv` (serial, QR content, file names) and a README. One QR file per card, named by internal serial. Every download is audit-logged. *(Later: print-ready CR80 PDF once the card design is final.)* |
| M14-3 | Printed per card: **branded QR** rendered by the system in the batch's **QR style** (M15) — default *NUSU Signature*: navy round dots, rounded eyes, NUSU icon in the centre, error correction **H**, ≥ 25 mm on the card with a white margin (prototype: `design/physical-card/styled_qr_demo.py`). **Nothing else is variable on the card** — no serial, no code. |
| M14-4 | **Generic design:** NUSU logo, "SU CARD", QR, one line: "Activate at <domain> · Show at partner stores". No student name. Same for every card. |
| M14-5 | **Card types:** `physical` (printed, from a batch) and `digital` (created at sign-up, never printed). **Statuses:** `unassigned` (printed, not yet claimed) → `active` (linked to one student, permanent) → `void` (lost, damaged, misprint, stolen, or replaced by an upgrade). |
| M14-6 | **Void / replace:** admin voids a card with a reason; the student can then link a new card (M2-11). Void a **whole batch** at once (e.g. a box was lost or misprinted). Voided cards can never be linked again. |
| M14-7 | **Manual link at the SU desk:** admin opens the student, scans the card with the admin scanner (or picks it by internal serial), and links it — for students whose phone camera doesn't work. Admin can also **scan any card** to see its serial, batch, status and linked student (lost-card lookups). Logged in the audit trail. |
| M14-8 | **Inventory page:** totals by status, per batch (generated / unassigned / active / void), search by serial, batch lifecycle notes (sent to printer, received, distributing). |
| M14-9 | **Distribution tracking (optional):** mark which batch/box is at the SU desk so lost boxes can be voided quickly. |

### M15 — QR Style Studio (Admin)

A visual editor in the admin panel to design how card QR codes look, with live preview and built-in scan-safety checks. Styles are saved, versioned, and chosen per print batch.

**Where styles apply:** printed physical cards (M14), the web card in the Student Portal, and admin QR downloads. **Not** Google/Apple Wallet passes — the wallets draw their own plain QR (M3-3b).

#### Editor layout

| ID | Requirement |
|---|---|
| M15-1 | Three-panel editor: **options** (left, grouped in collapsible sections) · **live preview** (centre, updates instantly) · **scan check & output** (right). |
| M15-2 | Preview modes: QR alone · **on the card mockup** (front/back, real 85.6 × 54 mm proportions) · **on the web card** · light/dark surroundings · zoom to **actual print size** (mm at the screen's DPI) and up to 800%. |
| M15-3 | **Side-by-side compare** of two styles or two versions (A/B). |
| M15-4 | Undo / redo, reset section, reset all; unsaved-changes warning. |
| M15-5 | Preview uses a real-length sample token so density matches production; "Randomize sample" shows how the style looks across different codes. |

#### Options

| ID | Group | Options |
|---|---|---|
| M15-6 | **Encoding** | Error correction L / M / Q / **H** (auto-locked to H when a logo is used) · **fixed QR version** so every card in a batch has identical density (auto = smallest that fits) · mask pattern auto / fixed 0–7 · quiet zone 0–8 modules · **compact mode** (uppercase alphanumeric URL → smaller QR) |
| M15-7 | **Data modules (dots)** | Shape: square · circle · rounded square (corner radius slider) · diamond · squircle · vertical bars · horizontal bars · **connected/liquid** (neighbouring dots merge into smooth shapes) · classy (one rounded corner) · custom SVG shape upload · module scale 50–100% (gap between dots) |
| M15-8 | **Eyes — outer frame** | Shape: square · rounded (radius slider) · circle · leaf (one sharp corner) · cushion · **custom SVG upload** (e.g. the designers' hand-drawn frame) · stroke thickness · **per-eye settings** (top-left / top-right / bottom-left can differ) · rotation per eye (e.g. leaf corners point to the centre) |
| M15-9 | **Eyes — inner pupil** | Shape: square · rounded · circle · diamond · leaf · custom SVG · size · per-eye color |
| M15-10 | **Color** | Foreground: solid · **linear gradient** (angle, 2–5 stops) · **radial gradient** · gradient across whole QR or per module · separate colors for eyes frame / eye pupil / dots · background: solid · transparent · **brand palette picker** (SU tokens one click) · eyedropper · recent colors |
| M15-11 | **Logo** | Upload SVG/PNG (or pick from brand assets) · size (% of QR width, hard max 25%) · padding · background plate: none / circle / rounded square / custom shape · plate color & border · **clear modules behind logo**: exact logo shape / plate shape / square · optional drop shadow |
| M15-12 | **Frame & label** | Outer frame: none · square · rounded · pill · ticket · custom SVG · border width/color · **call-to-action label** (e.g. "SCAN AT CHECKOUT") with Anton/Poppins, size, color, position top/bottom, label background badge |
| M15-13 | **Background art** | Optional pattern or image behind the QR with opacity control — **always flagged as high risk** by the scan check (M15-16) |
| M15-14 | **Output** | Print size in mm (default 25 mm) · DPI for raster (300–1200) · export **SVG** · **PNG** (transparent option) · **PDF** · color space note (RGB on screen; print shop converts to CMYK — show approximate CMYK values for each color) |
| M15-15 | **Presets** | Built-in: *Classic* (black squares), *NUSU Signature* (navy dots, rounded eyes, centre icon — current card), *Minimal*, *Bold*, *Gradient*. Save current as a new preset. |

#### Scan-safety guardrails

| ID | Requirement |
|---|---|
| M15-16 | **Live scannability score (0–100)** computed in the browser: the preview is decoded with a real QR decoder (zxing-wasm) under simulated conditions — actual print size at 300 dpi, small sizes, slight blur, low light/contrast, rotation, camera noise. Each condition shows ✅/❌. |
| M15-17 | **Contrast check:** dark-on-light contrast ratio of every foreground color/gradient stop vs background (warn < 4.5:1, block < 3:1). Inverted (light on dark) QRs warned — some phones fail them. |
| M15-18 | **Logo coverage check:** % of modules covered vs what the error-correction level can recover; warn above 15%, block above the safe limit. |
| M15-19 | **Print checks:** module size in mm at the chosen print size (warn < 0.5 mm), quiet zone present, eyes intact. |
| M15-20 | **Publish is blocked** if any blocking check fails. Warnings can be accepted with a typed reason (audit-logged). |
| M15-21 | **Test sheet PDF:** one A4 page with the style at 20 / 25 / 30 / 35 mm, on white and on the card background, with several real sample codes — print it and scan with the cashier scanner on cheap phones before a print run. |

#### Style management

| ID | Requirement |
|---|---|
| M15-22 | Styles are saved by name with statuses **draft → published → archived**. Only published styles can be used for batches. |
| M15-23 | **Versioning:** every publish creates an immutable version. A version used by a printed batch can never be edited (only duplicated). |
| M15-24 | Set the **default style** for new batches and for the student web card. |
| M15-25 | When generating a batch (M14-1) the admin picks a style version (default preselected); the batch records it. **Re-style a batch** (re-render print files with another style) is allowed only until the batch is marked "sent to printer" — tokens never change. |
| M15-26 | Import / export a style as JSON (back up, share between environments). |
| M15-27 | Access: SU Admin and Super Admin. Every save/publish/default change is audit-logged. |
| M15-28 | **Same renderer everywhere:** the browser preview and the server print-file generator use one shared rendering function, so what you see is exactly what gets printed. |

### M13 — Platform & Non-Functional

| ID | Requirement |
|---|---|
| M13-1 | **Security:** HTTPS, hashed passwords (argon2/bcrypt), random unguessable card tokens (≥ 100 bits), print-file downloads audited, secrets in env vars, rate limits on login/validate. |
| M13-2 | **Privacy:** Egypt Personal Data Protection Law (151/2020). Minimal data; cashiers see name + ID only; vendors see aggregates only; privacy notice accepted at sign-up. |
| M13-3 | **Audit log** for all admin and vendor-manager actions. |
| M13-4a | **Scale:** ~10,000 students, ~1,500 sign-ups on launch day, a few scans/second at peak (see §8.1). |
| M13-4 | **Performance:** validation < 1 s; dashboard pages < 3 s on a year of data. |
| M13-5 | **Availability:** daily DB backups (≥ 7 days); uptime monitoring with alerts to Ahmed. |
| M13-6 | **Responsive:** Scanner & Student Portal mobile-first; Admin & Vendor Portal desktop-first, usable on tablet. |
| M13-7 | **Accessibility:** WCAG 2.1 AA contrast. |
| M13-8 | **Error tracking** (e.g. Sentry free tier). |
| M13-9 | **Maintainability (solo dev):** one codebase, one deploy, managed services over self-hosting, seed data + basic tests on validation logic. |

---

## 3. Data Model (draft)

```
Student(id, ms_oid UNIQUE, email UNIQUE, university_id UNIQUE, full_name, status, suspend_reason?,
        card_flow (digital|physical), registered_at)
CardBatch(id, label, count, qr_style_version_id, print_status, created_by, created_at, notes)
QrStyle(id, name, status (draft|published|archived), is_default, created_by, created_at)
QrStyleVersion(id, style_id, version, config JSON, scan_score, published_by, published_at)   -- immutable
Card(id, type (physical|digital), batch_id?, serial UNIQUE, token UNIQUE, status, student_id?, linked_at?, linked_by?,
     void_reason?, apple_serial?, google_object_id?)   -- unique (student_id) WHERE status = 'active'
Vendor(id, name, logo_url, category, contact_*, status, contract_start, contract_end, notes)
Branch(id, vendor_id, name, address, lat, lng)
Offer(id, vendor_id, title, description, discount_type, discount_value, terms,
      starts_at, ends_at, active_days, active_hours, visible,
      limit_count, limit_period)            -- limit_period: day|week|month|semester|total|unlimited
User(id, email, password_hash, role, vendor_id?, branch_id?, totp_secret?, status, last_login_at)
ScanEvent(id, card_id?, vendor_id, branch_id, cashier_id, offer_id?, result, reason,
          confirmed, bill_amount?, voided, void_reason?, created_at, device_info)
EmailLog(id, to, type, status, provider_id, created_at)
AuditLog(id, actor_id, action, entity, entity_id, before, after, created_at)
Setting(key, value)   -- issuance_mode (digital|physical), physical_quota_remaining?, allow_digital_upgrade,
                      -- email_regex, at_risk_threshold, office_location_hours
```

## 4. Tech Stack

Final stack and system architecture: see [ARCHITECTURE.md](ARCHITECTURE.md).

Summary: **Next.js + TypeScript** (frontend and backend in one app) · **PostgreSQL** with **Drizzle ORM** · **Better Auth** (Microsoft Entra ID for students, password + 2FA for staff) · **Tailwind + shadcn/ui** · hosted on a **VPS with Docker Compose** (Caddy, Postgres, Redis) behind Cloudflare · emails via **Power Automate RSS mailer** from `su@nu.edu.eg`.

## 5. Phasing (launch ASAP)

| Phase | Scope | Rough effort (solo) |
|---|---|---|
| **P0 — Setup (start now)** | Apply for Google Wallet issuer + Apple Developer; **decide domain (printed on cards forever)**; get card printing quotes; repo + design system | Accounts and printing take days/weeks — start first |
| **P1 — MVP** | M14 first (so cards can go to print early), M1, M2, M3 (Google + web fallback; Apple when ready), M4, M5, M6, M7, M8 core, M9-lite (stats + cashiers), M10 minimal, M11 email, M12, M13 | ~4–6 weeks |
| **P2 — Pilot** | 3–5 vendors, ~100 students; train cashiers; fix issues | 1–2 weeks |
| **P3 — Launch** | Cards printed and at the SU desk; SU announces the sign-up link; onboard all vendors | — |
| **P4 — v2** | M8 advanced, M9 PDF reports, M11 push messages, fraud signals | Ongoing |

## 6. Out of Scope (for now)

- Native iOS/Android apps
- Payments / paid membership
- Student photos / personalized printed cards (cards are generic)
- Arabic UI
- POS integrations

---

## 7. Apple Developer Account — is it required?

**Yes, for Apple Wallet.** Every Apple Wallet pass must be signed with a Pass Type ID certificate, and only the Apple Developer Program (USD 99/year) can issue one. There's no free way around it.

Options:
1. **Recommended:** SU (or Ahmed) enrolls in the Apple Developer Program. An *individual* account is fastest (usually 1–2 days). An *organization* account shows "Nile University Student Union" as the developer but needs a D-U-N-S number, which can take a couple of weeks.
2. **Meanwhile:** launch with Google Wallet for Android, plus the web card (M3-9) for iPhone. Add Apple Wallet as soon as the account is active, with no change to the QR or the validation.
3. Third-party pass platforms that sign passes for you exist, but they usually cost more per month than USD 99/year.

## 7a. Sign in with Microsoft — setup & risk

**Why:** no student emails at all (cheaper, no junk-folder problems), faster for students (most are already logged in to Outlook/Teams on their phone), and the name comes from the university directory instead of being typed.

**Setup:**
1. Register an app in Microsoft Entra ID (free, using any Microsoft account) as **multi-tenant** ("accounts in any organizational directory").
2. Redirect URI: `https://<domain>/api/auth/callback/microsoft-entra-id`.
3. Request only `openid profile email`.
4. In code, allow only NU's tenant ID and the student email format.

**The risk — admin consent:** many universities block students from approving third-party apps. If NU does, students see *"Need admin approval"* and can't sign in. Only NU IT can fix that, by granting tenant-wide admin consent (one click for them, for these basic permissions).

**Plan:**
- Day 1: register a test app and try signing in with your own NU account. That tells us immediately whether consent is blocked.
- If blocked: ask NU IT for admin consent. **There is no fallback, so launch depends on this** — test it in week 1 and contact NU IT immediately if needed.
- Possible extra: ask NU IT whether the student's university ID is available in the directory (e.g. `employeeId`). If yes, it can be read automatically and becomes verified too.

## 8. Sizing & Budget (≈ 10,000 students)

### 8.1 Expected load

| Metric | Estimate | Basis |
|---|---|---|
| Students eligible | ~10,000 | SU estimate |
| Sign-ups (year one) | ~5,000–7,000 | 50–70% adoption |
| Launch-week sign-ups | ~2,000–4,000, peak ~1,500 on day one | Announcement spike |
| Emails | ~0 for students (Microsoft sign-in); a few dozen/month for staff accounts | Free tier is plenty |
| Redemptions | ~500–2,000 / day at peak, a few per second at lunch | Trivial load for any host |
| Database size | < 1 GB after several years | ~1M scan rows/year is small |

**Conclusion:** everything fits free/entry tiers. With Microsoft sign-in there's no launch email spike.

### 8.2 Recommended plan

Prices are approximate (late 2026) — check before paying.

| Item | Choice | Cost |
|---|---|---|
| Apple Developer Program | Individual or SU org account | $99 / yr |
| Google Wallet API | Issuer account | Free |
| Domain | `.com` / `.org` / `.app` | ~$12–20 / yr |
| Hosting + database + Redis | One **VPS**, 4–8 GB RAM (e.g. Hetzner, Contabo, DigitalOcean) | ~$8–25 / mo |
| Offsite backups | Cloudflare R2 / Backblaze B2 (a few GB) | ~$0–2 / mo |
| CDN / DNS | Cloudflare free | Free |
| Email | Power Automate RSS mailer from `su@nu.edu.eg` (existing M365 license) | Free |
| Error tracking, uptime | Sentry + UptimeRobot free tiers | Free |
| **Total (software)** | | **≈ $230–420 / yr** |
| **Card printing** | ~10,000 PVC cards with variable QR — get local quotes (laminated paper is far cheaper) | One-off, per batch |

### 8.3 Cheapest workable plan

| Item | Choice | Cost |
|---|---|---|
| Apple, Google, domain | as above | ~$115 / yr |
| Hosting | Smallest VPS that runs Docker comfortably (2 vCPU, 4 GB) | ~$5–8 / mo |
| Backups | Cloudflare R2 free tier (10 GB) | Free |
| Email | Power Automate RSS mailer | Free |
| **Total** | | **≈ $180–215 / yr** |

**Recommendation:** one 4 GB VPS is plenty for 10,000 students. Upgrade RAM only if monitoring shows pressure.

---

## Open Questions

| # | Question | Why it matters |
|---|---|---|
| Q1 | ~~Email format~~ — **answered:** `a.wesam2300@nu.edu.eg`. Still open: what do the 4 digits mean (e.g. `23` = intake year 2023)? Can the word ever contain a hyphen or a second part? ~~How many students~~ — **answered:** ~10,000. | Sizing |
| Q2 | Is there an **SVG/vector** version of the logo, or the icon-only mark? (The PNGs work, but vector stays sharp everywhere.) | Passes, favicon, app icon |
| Q3 | Who should **own the Apple/Google accounts** — you personally or SU as an organization? (Matters when you hand the project over someday.) | Long-term ownership |
| Q4 | In the vendor portal, should vendors see **only totals**, or also student names/IDs of who redeemed? (I assumed totals only, for privacy.) | Privacy |
| Q5 | Does signing in with your NU account to a test app show **"Need admin approval"**? (We'll test together.) If yes, who at NU IT can grant consent? | Decides if Microsoft sign-in works at launch |
| Q6 | **Domain name — now urgent.** It's printed inside every QR, so it can never change after the first print run. A domain SU controls long-term (e.g. `sucard.app`) is safer than a university subdomain that IT could take back. | Printed on cards forever |
| Q7 | **Card material & printer:** PVC (like a bank card) or laminated paper? Does SU already have a printer it uses? | Cost, print file format |
| Q8 | SU office **location and hours** text for the "Get your SU Card" screen. Who hands out cards — any SU member at the desk? | Student instructions |
| Q9 | Replacement policy: is a lost card replaced for free? Any limit? | Admin flow |
