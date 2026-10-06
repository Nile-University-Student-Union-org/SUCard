---
name: design-system-tokens-auditor
description: "Design System & Theme Tokens Auditor. Audits CSS, Tailwind classes, and component styling for semantic token compliance, dual-theme support (light/dark mode), and touch target dimensions (≥ 44px)."
risk: medium
source: custom
date_added: "2026-09-24"
---

# Design System Tokens Auditor

> **Mandate:** Guarantee seamless light and dark mode consistency, semantic color token usage, and 44px touch ergonomics across every interactive element.

---

## 1. Design Token Standards

1. **Dual-Theme Support:** Every background, border, and text color must have corresponding dark mode variants (`dark:bg-zinc-900`, `dark:border-zinc-800`, `dark:text-white`).
2. **Touch Targets:** All interactive controls (buttons, chips, checkboxes, select dropdowns) must meet `min-h-[44px]` (`min-h-[44px] min-w-[44px]`).
3. **Glassmorphism & Elevation:** Backdrop blur (`backdrop-blur-md`), subtle borders, and smooth hover/active scaling transitions (`active:scale-95 transition-all`).
