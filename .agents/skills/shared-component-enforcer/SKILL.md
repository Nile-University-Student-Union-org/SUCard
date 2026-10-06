---
name: shared-component-enforcer
description: "Autonomous Shared Component Enforcer & Anti-Reimplementation Engine. Scans the entire frontend codebase to ensure that every UI primitive, layout wrapper, form control, modal, and status element uses the standardized components in src/components/ui/. Detects and eliminates any inlined or reimplemented buttons, inputs, dropdowns, checkboxes, badges, and modals."
risk: high
source: custom
date_added: "2026-09-24"
---

# Shared Component Enforcer & Anti-Reimplementation Engine

> **Supreme Rule:** Never write a bespoke, inlined UI element when an equivalent component exists in `src/components/ui/`. If an element is reimplemented anywhere, it MUST be removed and replaced with the standardized shared component exported from `src/components/ui/index.ts`.

---

## 1. The Core Replacement Map

Every developer and autonomous AI agent MUST cross-check all JSX against this canonical mapping table:

| Inlined / Bespoke Pattern Detected | Forbidden Code Pattern | Mandatory Standardized Component in `src/components/ui/` |
| :--- | :--- | :--- |
| **Bespoke Button** | `<button className="... bg-brand ...">` or manual touch targets | `<Button variant="..." size="..." onClick={...}>` |
| **Raw Text Input** | `<input type="text" className="... border ...">` | `<Input ... error={...} />` |
| **Custom Select / Dropdown** | `<select className="...">` or custom `useState(isOpen)` dropdown divs | `<Dropdown options={...} value={...} onChange={...} />` |
| **Custom Checkbox** | `<input type="checkbox" ...>` | `<Checkbox checked={...} onCheckedChange={...} />` |
| **Inlined Badge / Pill** | `<span className="px-2 py-0.5 rounded-full ...">` | `<Badge variant="...">` |
| **Modal / Dialog Overlay** | `<div className="fixed inset-0 z-50 ...">` | `<Modal isOpen={...} onClose={...}>` with `<ModalBody>` & `<ModalFooter>` |
| **Confirmation Prompt** | Manual confirm alert or inlined deletion dialog | `<AlertDialog isOpen={...} onConfirm={...} onCancel={...}>` |
| **Error / Maintenance / 404** | Inlined centered icon + title + description + action | `<StatusState type="..." title="..." description="..." />` |
| **Auth / Standalone Bar** | Inlined top back bar + logo + theme toggle | `<AuthLayout>` with `<AuthHeader>` |
| **PIN / OTP Multi-Digit** | Multiple individual `<input maxLength={1}>` | `<PinInput length={4 \| 6} value={...} onChange={...} />` |
| **Date / Birthday Picker** | Raw HTML `<input type="date">` | `<DatePicker>` or `<DateOfBirthPicker>` |
| **Avatar Selection Grid** | Inlined avatar character selector | `<AvatarPicker>` |
| **Logout Confirmation** | Custom logout modal | `<LogoutConfirmModal>` |

---

## 2. Enforcement Protocol (Step-by-Step)

When implementing or auditing any page (`page.tsx`) or feature component (`src/components/`):
1. **Inventory:** Scan for raw `<button>`, `<input>`, `<select>`, `<dialog>`, `<span className="... rounded-full ...">`, and fixed modal backdrops.
2. **Eliminate:** Remove the bespoke DOM tree and redundant CSS styles.
3. **Import:** Import the required primitives directly from `@/components/ui` (e.g. `import { Button, Input, Dropdown, Modal, Badge, Checkbox } from "@/components/ui"`).
4. **Wire Properties:** Pass typed props (`variant`, `size`, `isOpen`, `onClose`, `options`, `value`, `onChange`).
5. **Verify:** Check responsiveness across light/dark themes and verify touch targets (`≥ 44px`).

## Per-tenant feature control (binding, added 2026-09-29)

- When replacing inline UI with shared components, keep feature gating intact: items tied to a tenant feature stay wrapped in `useFeature(key)` (FC-3) checks, and direct access to a disabled page uses `<StatusState />`.
