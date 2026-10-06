---
name: color-palette-harmony
description: Advanced color science, OKLCH/HSL harmonious palette curation, dual-theme semantic token mapping, and WCAG AAA contrast ratio auditing for educational platforms.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Color Palette Harmony & Dual-Theme Science

## Purpose & Scope
This skill provides comprehensive rules, mathematics, and heuristics for creating captivating, harmonious, and highly legible color palettes across Light and Dark themes in educational SaaS interfaces.

## 🎨 Core Color Strategy for The Canvas

### 1. Curated Brand & Semantic Tokens
- **Brand Navy & Blue:**
  - Light mode: Deep Academy Navy (`#0056D2`, `rgb(0, 86, 210)`) with crisp contrast on white.
  - Dark mode: Soft Radiant Indigo (`#3B82F6`, `rgb(59, 130, 246)`) with luminous visibility on dark zinc.
- **Academic Subject Color Anchors:**
  - **Math:** Royal Indigo / Electric Blue (`bg-blue-600` / `dark:bg-blue-500`)
  - **English & Writing:** Warm Amber / Gold (`bg-amber-500` / `dark:bg-amber-400`)
  - **Science & Nature:** Vivid Emerald / Mint (`bg-emerald-600` / `dark:bg-emerald-500`)
  - **Coding & Tech:** Violet / Cyan (`bg-violet-600` / `dark:bg-violet-400`)
  - **Art & Creativity:** Coral / Rose (`bg-rose-500` / `dark:bg-rose-400`)

### 2. Dual-Theme Luminance Balance (Light & Dark Mode)
- **Backgrounds:**
  - Light Theme: Pure crisp canvas `#FFFFFF` and subtle warm grey `#F8FAFC`.
  - Dark Theme: Deep zinc neutral `#09090B` and elevated surface `#18181B`.
- **Text & Foreground:**
  - Primary Text: `#0F172A` (Light) / `#F8FAFC` (Dark) -> Contrast ratio ≥ 12:1 (AAA).
  - Secondary Text: `#475569` (Light) / `#94A3B8` (Dark) -> Contrast ratio ≥ 6:1 (AA+).
  - Subtle Muted Text: `#64748B` (Light) / `#71717A` (Dark) -> Contrast ratio ≥ 4.5:1.

### 3. State & Intent Colors
- **Success / Completed / Active:** Emerald `#10B981` (Light: text-emerald-700 / Dark: text-emerald-300).
- **Warning / Pending / Timers:** Amber `#F59E0B` (Light: text-amber-800 / Dark: text-amber-300).
- **Destructive / Error / Disconnect:** Crimson `#EF4444` (Light: text-rose-700 / Dark: text-rose-300).
- **Info / Scarcity / Highlight:** Indigo `#6366F1` (Light: text-indigo-700 / Dark: text-indigo-300).

## 🛠️ Implementation Rules
1. Never use pure black (`#000000`) for card backgrounds or generic grey (`#808080`) for borders.
2. Always pair tinted background pills (`bg-brand/10`) with matching dark-mode variants (`dark:bg-brand/20`).
3. Maintain dark mode border subtlety using `border-slate-200 dark:border-zinc-800`.
