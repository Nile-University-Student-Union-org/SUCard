---
name: auth-state-logic-auditor
description: Verification of authentication state synchronization, guest vs authenticated UI transitions, token expiration redirects, and multi-profile context persistence.
risk: safe
source: custom
date_added: "2026-09-24"
---

# Authentication State Logic & Session Auditor

## Purpose & Scope
This skill audits and verifies state consistency across `useAuthStore`, `useProfileStore`, and server session cookies (`HttpOnly`), preventing stale UI renders or session leakage.

## 🔑 Session State Audit Checklist

### 1. Authenticated vs Guest State Transitions
- **When `user == null` (Guest / Logged Out):**
  - Navbar displays "Login / Sign up" link.
  - Active profile pill, settings icon, and logout button MUST NOT render.
  - Cart button remains visible to allow guest course discovery and cart pre-loading.
- **When `user != null` (Authenticated):**
  - Navbar displays active user name, role pill, profile pill switcher, settings icon, and logout trigger.
  - Login/Sign up link is replaced with user account dropdown/navigation.

### 2. Multi-Profile Context Synchronization
- If user switches profile via `<ProfileSelectorModal />`, all downstream learning views (`/my-courses`, `/courses/[id]/learn`) must immediately re-render using the active profile's enrollments and notes without full page reload.

### 3. Immediate Token Revocation & Logout Cleanup
- On logout:
  - Clear `useAuthStore`, `useProfileStore` active states.
  - Revoke token `jti` in backend Redis blocklist.
  - Clear cookies and redirect to `/login`.
