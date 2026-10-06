---
name: ui-duplication-auditor
description: "Specialized UI Duplication Auditor. Analyzes code diffs and frontend repositories for repetitive JSX structures, redundant modal implementations, duplicate form logic, and unshared styles. Enforces zero duplication and extract-once architecture."
risk: high
source: custom
date_added: "2026-09-24"
---

# UI Duplication Auditor Skill

> **Mandate:** Any visual component, card structure, interactive control, or layout wrapper repeated more than once MUST be generalized and centralized under `src/components/ui/`.

---

## 1. Duplication Detection Rules

1. **Rule of Two:** If a JSX tree or styling pattern appears in two or more files, it is an architectural defect to leave it duplicated.
2. **Modal Generalization:** Modals MUST never have bespoke implementations in page routes. All dialogs must inherit from the portal-backed `<Modal />` or `<AlertDialog />`.
3. **Form Controls:** Every text field, date selector, multi-digit PIN input, and dropdown must use the standardized components in `src/components/ui/`.
4. **Icons:** Never inline raw SVG paths. Use `lucide-react` icons with consistent sizing (`w-4 h-4`, `w-5 h-5`).
5. **Theme Consistency:** Never hardcode colors like `#ffffff` or `bg-white` without dark mode tokens (`dark:bg-zinc-900`).

---

## 2. Refactoring Checklist

- [ ] Scan for duplicate modal overlays and replace with `<Modal />` / `<AlertDialog />`.
- [ ] Scan for raw `<button>` elements and replace with `<Button variant="..." />`.
- [ ] Scan for custom input containers and replace with `<Input />`.
- [ ] Scan for custom select elements and replace with `<Dropdown />`.
- [ ] Verify exports in `src/components/ui/index.ts`.
