---
name: cross-platform-viewport-tester
description: Multi-platform validation heuristics, responsive layout testing checklists, device orientation handling, and touch vs pointer behavior verification.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Cross-Platform Viewport & Device Verification

## Purpose & Scope
This skill provides automated checks and mental models for verifying that interfaces function identically and beautifully across iOS (Safari/WebKit), Android (Chrome), Windows, macOS, and iPadOS.

## 📱 Multi-Platform Test Matrix

| Platform | Screen Size Range | Primary Input | Critical Verification Checklist |
| :--- | :--- | :--- | :--- |
| **Compact Mobile (iPhone / Pixel)** | 360px – 430px | Touch (Thumb) | Bounding boxes ≥ 44px, safe area padding `pb-safe`, modal bottom sheets, non-wrapping titles |
| **Tablet Portrait / Landscape (iPad)** | 768px – 1024px | Touch / Stylus | 2-column grids, collapsible sidebars, touch scroll momentum |
| **Standard Laptop (720p / 1080p)** | 1280px – 1920px | Mouse / Trackpad | Hover feedback, tooltips, split-screen master-detail |
| **Ultra-Wide Desktop (QHD / 4K)** | 2560px – 3840px | High-DPI Mouse | Content centered at `.canvas-container` (`max-w-canvas: 1720px`), crisp vector icons |

## 🔍 Common Cross-Platform Anti-Patterns to Prevent
1. **Hover-Only Menus on Touch Screens:** Actions hidden strictly behind hover states become inaccessible on touch devices. Always pair hover with tap/focus triggers.
2. **Fixed Height Container Traps:** Never use fixed `h-[600px]` on content containers where text may wrap on narrow screens. Use `min-h-[...]` with `flex-1` instead.
3. **Viewport Height `100vh` on Mobile:** Use `100dvh` (dynamic viewport height) or `min-h-screen` to prevent iOS Safari address bar jumps.
