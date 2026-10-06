---
name: typography-hierarchy-pro
description: Professional typography standards, fluid font scaling, modular heading hierarchy, optical line-height adjustments, and readability rules for multi-device educational surfaces.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Typography Hierarchy & Readability Engineering

## Purpose & Scope
This skill governs typography selection, line-height ratios, letter-spacing ergonomics, and responsive modular type scales across The Canvas web applications.

## 🔤 Font Pairing & Weights

### 1. Font Family Roles
- **Primary Body & UI:** `Nunito` / `Inter` (`font-sans`) — High x-height, open apertures, legible at small sizes (11px-14px).
- **Headings & Honors:** `American Typewriter` / `Nunito Black` — Prestigious academic character, warm and distinctive.
- **Code, Timers & Keys:** `font-mono` — Tabular figures for countdown timers (`00:00:00`), OTP codes, and JWT IDs.

### 2. Heading Scale Hierarchy
| Level | Mobile (sm) | Desktop (lg/xl) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Hero / Page Title)** | `24px (text-2xl)` | `32px - 36px (text-3xl / 4xl)` | `font-black (900)` | `leading-tight (1.15)` | `tracking-tight` |
| **H2 (Section Header)** | `20px (text-xl)` | `24px (text-2xl)` | `font-black (900)` | `leading-snug (1.25)` | `tracking-tight` |
| **H3 (Card / Modal Title)** | `16px (text-base)` | `18px - 20px (text-lg / xl)` | `font-extrabold (800)`| `leading-snug` | `normal` |
| **H4 (Subhead / Topic)** | `14px (text-sm)` | `15px (text-base)` | `font-bold (700)` | `leading-normal` | `normal` |
| **Body (Paragraph)** | `13px - 14px (text-xs / sm)` | `14px - 15px (text-sm)` | `font-medium (500)` | `leading-relaxed (1.6)`| `normal` |
| **Pill / Badge / Caption** | `10px - 11px` | `11px - 12px` | `font-black (900)` | `leading-none` | `uppercase tracking-wider` |

## 📖 Best Practices
1. **Never use generic bold:** Use semantic font weights (`font-medium`, `font-bold`, `font-black`).
2. **Limit line length for reading:** Keep explanatory paragraphs between 45 and 75 characters per line (`max-w-prose` or `max-w-xl`).
3. **Tabular Numbers for Timers:** Always use `font-mono` with `tabular-nums` for live countdown timers to prevent horizontal layout jank while digits change.
