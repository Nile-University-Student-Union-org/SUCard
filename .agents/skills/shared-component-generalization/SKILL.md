---
name: shared-component-generalization
description: "Universal Component Generalization & Shared UI Consistency Engine. Guides autonomous extraction, generalization, and architectural standardization of reusable UI components in src/components/ui/. Enforces strict dual-theme design tokens, touch ergonomics (min-h-[44px]), typed interfaces, accessibility, and zero inlining of modals, drawers, or duplicated cards in page routes."
risk: high
source: custom
date_added: "2026-09-23"
---

# Universal Component Generalization & Shared UI Consistency Skill

> **Core Mandate:** Anything that can be generalized MUST be extracted into a generic shared component under `src/components/ui/` and re-exported in `src/components/ui/index.ts`. Inlining duplicated UI trees, modals, drawers, status screens, or form layouts into route files (`page.tsx`) is strictly forbidden.

---

## 1. The Component Generalization Philosophy

1. **DRY & Single Source of Truth:**
   - If a visual element, layout pattern, or interaction exists in two or more places, it MUST NOT be written twice.
   - Centralize behavior, styles, dual-theme tokens, animations, and accessibility in a single shared component under `src/components/ui/`.

2. **Zero Inlining in Routes:**
   - Route files (`page.tsx`, `layout.tsx`) serve exclusively as **orchestrators**.
   - They dispatch MediatR/API queries, manage page state, and assemble composable UI blocks.
   - Route files MUST NEVER define raw modal overlays, repetitive cards, bespoke status screens, or duplicate input logic.

3. **Atomic Consistency & Dual-Theme Fidelity:**
   - Every shared component MUST fully support **Light Mode** and **Dark Mode** out of the box using semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-charcoal`, `dark:text-white`, `border-slate-200 dark:border-zinc-800`).
   - Every interactive element MUST satisfy touch ergonomics (`min-h-[44px]`).

---

## 2. Generalization Trigger Heuristics (When to Extract)

Scan the codebase or proposed diffs for these 6 duplication patterns. If ANY condition matches, extract immediately:

| Pattern | Detection Rule | Target Component in `src/components/ui/` |
| :--- | :--- | :--- |
| **Popups, Modals & Dialogs** | Any `<div className="fixed inset-0 ...">`, backdrop blur, or popup dialog tree | Subclass of `<Modal />`, `<AlertDialog />`, or dedicated feature modal (e.g. `PinUnlockModal`, `ProfileSelectorModal`) |
| **Status & System Screens** | Centered icon + eyebrow/badge + title + description + action buttons | `<StatusState />` |
| **Auth & Standalone Flow Layouts** | Ambient background glow, top header bar with Back button + ThemeToggle | `<AuthLayout />`, `<AuthHeader />` |
| **Form Inputs & Specialized Controls** | Multi-slot inputs (OTP, PINs), calendar pickers, birthdates, dropdowns, avatar selectors | Generalized `<PinInput length={N} />`, `<Dropdown />`, `<DatePicker />`, `<DateOfBirthPicker />`, `<AvatarPicker />` |
| **Feedback & Security Alerts** | Inline banners with error/success icons and attempt countdowns | `<AuthFeedback />`, `<Alert />` |
| **Card & Entity Containers** | Repetitive borders, squircle frames, hover elevation, selection rings | `<ProfileCard />`, `<Card />` |

---

## 3. Generalization Implementation Standard

When creating or refactoring a component in `src/components/ui/`:

### A. TypeScript Interface Contract
- Define strict, strongly-typed props interfaces:
  ```typescript
  export interface MyComponentProps {
    className?: string;
    variant?: "default" | "primary" | "secondary" | "destructive";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    children?: React.ReactNode;
  }
  ```
- Use generic typing (`<T>`) when dealing with options, lists, or selections (e.g. `<Dropdown<T> />`).

### B. Tactile Design Tokens & Dual-Theme Colors
- Always pair light and dark mode classes:
  - Backgrounds: `bg-white dark:bg-zinc-900`
  - Borders: `border-slate-200 dark:border-zinc-800`
  - Hover states: `hover:border-brand/40 dark:hover:border-brand-soft/40`
  - Primary text: `text-charcoal dark:text-white`
  - Muted text: `text-ash dark:text-zinc-400`
- Use tactile action borders: `rounded-[12px] border-2 uppercase tracking-wider font-bold`.

### C. Touch Ergonomics & Responsiveness
- Enforce `min-h-[44px]` on all buttons, select triggers, chips, and links.
- Ensure overlays, focus rings (`ring-4`), and hover scales (`scale-105`) have sufficient container padding (`px-2.5` to `px-4`) so they NEVER get clipped by parent `overflow-y-auto` boundaries.

### D. Export from Index
- Always export new components from [`src/components/ui/index.ts`](../../../frontend/src/components/ui/index.ts):
  ```typescript
  export * from "./MyComponent";
  ```

---

## 4. Refactoring Playbook (Deduplication Workflow)

1. **Detect Duplication:** Search for repeated JSX structures across multiple route pages.
2. **Design the Generic API:** Abstract variations (titles, icons, actions, children) into typed props with clean defaults.
3. **Build the Shared Component:** Create `src/components/ui/Component.tsx`. Ensure full dual-theme support, accessibility, and zero lint warnings.
4. **Re-Export in Index:** Add to `src/components/ui/index.ts`.
5. **Migrate Existing Callers:** Replace the inlined trees across all caller pages with the clean, one-line shared component.
6. **Verify:** Run `npm.cmd run lint` and `npm.cmd run build` to guarantee zero regressions.

## Per-tenant feature control (binding, added 2026-09-29)

- Shared components that render feature-specific actions or navigation must accept the gating result (or call `useFeature(key)`, FC-3) so disabled features disappear everywhere consistently; a disabled page reached directly renders the shared `<StatusState />`. UI hiding never replaces server enforcement (`[RequiresFeature]`).
