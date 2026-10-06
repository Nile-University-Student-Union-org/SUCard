---
name: component-registry-analyzer
description: "Component Registry & Dependency Analyzer. Verifies that all shared components in src/components/ui/ are properly exported, documented, and fully utilized across feature modules and routes."
risk: high
source: custom
date_added: "2026-09-24"
---

# Component Registry & Dependency Analyzer

> **Mandate:** Maintain a strict, clean central barrel export registry in `src/components/ui/index.ts` and ensure all feature components import directly from `@/components/ui`.

---

## 1. Registry Architecture (`src/components/ui/index.ts`)

The central component registry exports all atomic and composite design system building blocks:

- **Layout & Foundation:** `AuthLayout`, `AuthHeader`, `Card`, `StatusState`, `ThemeToggle`
- **Actions & Controls:** `Button`, `Dropdown`, `Checkbox`, `Badge`
- **Data Entry & Pickers:** `Input`, `PinInput`, `DatePicker`, `DateOfBirthPicker`, `AvatarPicker`
- **Dialogs & Portals:** `Modal`, `ModalHeader`, `ModalTitle`, `ModalDescription`, `ModalBody`, `ModalFooter`, `AlertDialog`, `LogoutConfirmModal`
- **Security & Feedback:** `AuthFeedback`, `PinUnlockModal`, `ProfileCard`, `ProfileFormModal`, `ProfileSelectorModal`

---

## 2. Analysis Protocols

1. **Verify Barrel Exports:** Every new component in `src/components/ui/` must be exported in `index.ts`.
2. **Verify Consumer Imports:** Feature components in `src/components/admin/`, `src/components/owner/`, and `src/app/` must import shared primitives from `@/components/ui`.
3. **No Dead Exports:** Shared components must be actively used across the application.
