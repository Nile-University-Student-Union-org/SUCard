---
name: rbac-conditional-visibility
description: Role-Based Access Control (RBAC) UI logic, conditional icon and button visibility rules, and navigation menu state machines for SuperAdmin, TenantOwner, Teacher, Parent, and Child roles.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Role-Based Access Control (RBAC) & Conditional UI Visibility

## Purpose & Scope
This skill defines the precise logic governing which navigation elements, action buttons, admin controls, profile switchers, and badges are visible or hidden depending on user authentication and role.

## 🔐 The Canvas RBAC Visibility Matrix

| UI Element / Feature | Guest / Unauthenticated | Primary Parent | Child Learner | Teacher | Tenant Owner | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Catalog & Course Landing** | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| **Cart & Checkout** | ✅ Visible | ✅ Visible | ✅ (PIN Gated) | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Active Profile Switcher Pill** | ❌ Hidden | ✅ Visible | ✅ Visible (PIN back) | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **"My Courses" Learning Hub** | ❌ (Redirect Login)| ✅ Visible | ✅ Visible | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| **Teacher Portal (`/teacher`)** | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible | ❌ Hidden | ❌ Hidden |
| **Owner Portal (`/owner`)** | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible | ❌ Hidden |
| **Admin Panel (`/admin`)** | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible |
| **Settings (`/settings`)** | ❌ Hidden | ✅ Visible | ❌ (Parent only) | ✅ Visible | ✅ Visible | ✅ Visible |
| **Logout Button (`<LogoutConfirmModal />`)**| ❌ Hidden | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |

## ⚙️ Implementation Rules

### 1. Zero-Flicker Conditional Rendering
- Never render privileged buttons (e.g. `Admin Panel`, `Owner Panel`, `Teacher Portal`) to unauthorized roles, even momentarily before client hydration.
- In Next.js client components:
  ```tsx
  {user?.role === "SuperAdmin" && (
    <Link href="/admin">
      <ShieldCheck className="w-4 h-4" />
      <span>Admin Panel</span>
    </Link>
  )}

  {user?.role === "TenantOwner" && (
    <Link href="/owner">
      <Building2 className="w-4 h-4" />
      <span>Owner Panel</span>
    </Link>
  )}

  {user?.role === "Teacher" && (
    <Link href="/teacher">
      <GraduationCap className="w-4 h-4" />
      <span>Teacher Portal</span>
    </Link>
  )}
  ```

### 2. Child Profile Protection
- When active profile is a `child`:
  - Financial, account deletion, and primary credential change actions are hidden or protected behind a 4-digit parent PIN unlock modal.
  - Checkout flows require entering parent PIN or selecting "Ask Primary Account to Approve".

## Per-tenant feature control (binding, added 2026-09-29)

- Visibility requires BOTH the role/permission check AND the tenant feature flag: combine `useMyPermissions().can(...)` with `useFeature(key)` (FC-3). A hidden tab must not render through a stale `?tab=` or localStorage value; the server still returns 403 `FEATURE_DISABLED` when a disabled feature is called.
