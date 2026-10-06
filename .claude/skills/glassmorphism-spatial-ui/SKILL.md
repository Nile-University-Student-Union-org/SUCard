---
name: glassmorphism-spatial-ui
description: Spatial UI engineering, translucent glassmorphism, multi-layer depth stacks, and gradient glow meshes for premium educational dashboards and modals.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Spatial UI & Translucent Glassmorphism

## Purpose & Scope
This skill provides best practices for creating depth, spatial hierarchy, soft lighting, and modern frosted glass elements without compromising legibility or GPU performance.

## 🔮 Core Principles

### 1. Frosted Glass Formula (`backdrop-blur`)
- **Top App Bars & Navbars:**
  - Light mode: `bg-canvas-grey/95 backdrop-blur-md border-b-2 border-slate-200`
  - Dark mode: `bg-zinc-950/95 backdrop-blur-md border-b-2 border-zinc-800`
- **Floating Controls & Overlays:**
  - `bg-zinc-900/85 backdrop-blur-md border border-zinc-700/80 text-white`
- **Modal Backdrops:**
  - `bg-black/65 backdrop-blur-sm`

### 2. Multi-Layer Spatial Stacking (`z-index`)
- Layer 0: Page background canvas & radial glow meshes (`bg-radial from-brand/10 to-transparent`).
- Layer 1: Content cards & grid containers (`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800`).
- Layer 2: Floating sticky action bars & headers (`z-40`).
- Layer 3: Dropdowns, tooltips, and floating popovers (`z-50`).
- Layer 4: Global portal dialogs & bottom sheets (`z-50` to `z-[80]`).

### 3. Edge Highlight Borders
- Pair translucent dark backgrounds with subtle 1px border highlights (`border-white/10` or `border-zinc-700/80`) to provide crisp edge definition on dark themes.
