---
name: micro-interactions-motion
description: Guidelines and patterns for fluid micro-interactions, spring physics, tactile button feedback, and hardware-accelerated 60/120fps UI animations in React and Tailwind CSS.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Micro-Interactions & Motion Dynamics

## Purpose & Scope
This skill defines tactile micro-interactions, transition timings, and spring physics for buttons, cards, modals, dropdowns, and interactive widgets across The Canvas platform.

## ⚡ Core Interaction Tenets

### 1. Tactile Press States (`active:` Feedback)
- **Primary Buttons:** Subtle physical depression on press:
  ```css
  /* Physical 3D button press */
  border-b-4 border-canvas-navy-dark hover:brightness-110 active:translate-y-[2px] active:border-b-2
  ```
- **Icon Buttons & Chips:** Quick scale dampening:
  ```css
  active:scale-95 transition-all duration-150
  ```
- **Card Interactive Lift:** Hover elevation with spring ease:
  ```css
  hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ease-out
  ```

### 2. Motion Curves & Duration Hierarchy
- **Instant Micro-feedback (Toggles, checks, chips):** `100ms - 150ms` (cubic-bezier `ease-out`).
- **Surface Transitions (Dropdowns, tooltips, popovers):** `150ms - 200ms` (`animate-in fade-in-0 zoom-in-95`).
- **Modal & Bottom Sheet Drawers:** `280ms - 350ms` (`cubic-bezier(0.16, 1, 0.3, 1)` smooth deceleration).
- **Progress Bars & Meters:** `500ms` smooth width tween (`transition-all duration-500 ease-out`).

### 3. Accessible Motion (`prefers-reduced-motion`)
- Respect system reduced-motion settings by disabling parallax and high-displacement translations while maintaining opacity cross-fades.
