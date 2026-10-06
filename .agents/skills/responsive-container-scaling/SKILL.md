---
name: responsive-container-scaling
description: Fluid multi-viewport scaling rules for 720p, 1080p, QHD (1440p), 4K, tablet, and mobile displays without horizontal scrollbars.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Responsive Container Scaling & Viewport Architecture

## Purpose & Scope
This skill provides layout rules to ensure that every page on The Canvas scales seamlessly across viewports ranging from 320px (compact mobile) up to 3840px (4K monitors) without horizontal overflow or clipped text.

## 📐 Layout Containers & Breakpoints

### 1. The Canvas Fluid Container (`.canvas-container`)
- Default container pattern:
  ```css
  .canvas-container {
    width: 100%;
    max-width: 1720px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  @media (min-width: 640px) { .canvas-container { padding-left: 1.5rem; padding-right: 1.5rem; } }
  @media (min-width: 1024px) { .canvas-container { padding-left: 2rem; padding-right: 2rem; } }
  @media (min-width: 1440px) { .canvas-container { padding-left: 3rem; padding-right: 3rem; } }
  ```

### 2. Multi-Resolution Adaptation
- **720p Laptop (1280 × 720):**
  - Navigation switches to compact text/icons.
  - Split layouts transition from wide 8/4 grid to flexible stacked or 7/5 grid.
- **1080p Standard (1920 × 1080):**
  - Baseline primary view. Full sidebar visibility with comfortable gutter spacing (`gap-6` to `gap-8`).
- **QHD & 4K Ultra-Wide (2560px - 3840px):**
  - Container caps at `1720px` to maintain optimal ocular line length while centering content.
  - Video players and charts maintain maximum crispness without excessive horizontal stretching.

### 3. Anti-Overflow Directives
- Never use fixed pixel widths on root layout sections (`w-[1200px]`). Always use `max-w-*` with `w-full`.
- Use `truncate`, `line-clamp-1`, `line-clamp-2`, or `break-words` on user-generated text to prevent flex/grid container blowouts.
