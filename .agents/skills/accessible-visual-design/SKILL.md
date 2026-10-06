---
name: accessible-visual-design
description: Accessibility engineering, WCAG 2.2 AAA guidelines, high-contrast focus rings, screen reader aria attributes, and keyboard navigation completeness.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Accessible Visual Design (WCAG 2.2 AAA)

## Purpose & Scope
This skill ensures that all visual components, interactive forms, color pairings, and keyboard navigation meet or exceed WCAG 2.2 Level AA and AAA standards.

## ♿ Core Accessibility Directives

### 1. Contrast Ratios & Visual Independence
- Never convey state solely through color (always pair color with an icon, badge, or text label).
- Text contrast must meet ≥ 4.5:1 for regular text and ≥ 3:1 for large headings (≥ 18pt / 24px bold).
- Input borders and interactive bounding boxes must achieve ≥ 3:1 contrast against adjacent backgrounds.

### 2. High-Visibility Keyboard Focus Rings
- All interactive controls must render a distinct focus ring on keyboard tab:
  ```css
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900
  ```

### 3. Screen Reader Labels & Semantic HTML
- Every icon-only button MUST have an explicit `aria-label` or `title` describing its action:
  ```tsx
  <button type="button" aria-label="Toggle mobile menu">
    <Menu className="w-5 h-5" />
  </button>
  ```
- Form inputs must include linked `<label>` or descriptive `aria-label`.
- Dynamic status changes (e.g. countdown timers, offline alerts) must declare `aria-live="polite"` or `role="alert"`.
