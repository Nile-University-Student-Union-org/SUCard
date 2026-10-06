---
name: multitenant-zerotrust-auth
description: "Multi-Tenant Zero-Trust Authentication & Session Revocation Skill. Enforces Shared-Database/Shared-Schema tenant isolation via TenantId, Primary Account credential management, Child Profile PIN security, immediate Redis token revocation blocklists, and brute-force lockout safeguards."
risk: critical
source: custom
date_added: "2026-09-23"
---

# Multi-Tenant Zero-Trust Auth & Session Revocation Skill

> **Mandate:** Multi-tenancy isolation and zero-trust authentication are foundational security non-negotiables. Never trust client-supplied tenant identifiers; always cryptographically derive identity and scope from validated tokens.

---

## 1. Multi-Tenant Isolation Architecture (Rule 1 & REQUIREMENTS.md Section 3.1)

1. **Shared Database, Shared Schema:**
   - All tenant entities implement `IMultiTenantEntity` containing `TenantId: Guid`.
   - EF Core Global Query Filters automatically scope every query:
     ```csharp
     modelBuilder.Entity<Course>().HasQueryFilter(c => c.TenantId == _currentTenantService.TenantId);
     ```
   - `.IgnoreQueryFilters()` is **strictly prohibited** in standard application endpoints.
   - B-Tree index on `TenantId` (or leading column in composite indexes) is mandatory on all tenant tables.
2. **Zero Client TenantId Injection:**
   - Never accept `tenantId` from request bodies or query parameters.
   - Derive `TenantId` strictly from validated JWT claims or resolved host subdomains.

---

## 2. Zero-Trust Session & Token Revocation (Rule 4 & REQUIREMENTS.md Section 4.2)

1. **Token Lifetime:**
   - Access Tokens: Short-lived (15 minutes).
   - Refresh Tokens: Stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
2. **Immediate Session Revocation:**
   - On user logout, password reset, or privilege revocation, backend stores token `jti` in Redis:
     ```text
     SETEX blocklist:token:{jti} 900 "revoked"
     ```
   - Authentication middleware evaluates the Redis blocklist on every incoming request.
3. **Brute-Force Guardrails:**
   - Maximum 5 consecutive failed attempts on sensitive actions (logins, PIN unlocks, 2FA).
   - Triggers automated 15-minute Redis lockout (`SETEX lockout:{tenantId}:{userId} 900`).
   - Returns shared security feedback component on the client (`<AuthFeedback />`).

## Per-tenant feature control (binding, added 2026-09-29)

- Feature flags are a tenant-scoped authorization layer on top of roles and C-8 permissions: every new tenant-facing surface is registered in `TenantFeatureCatalog` and gated server-side with `[RequiresFeature("key")]` / `IFeatureGate` (hubs via the tenant feature hub filter), using the tenant from validated claims, never from the client. Disabled → 403 `FEATURE_DISABLED` + `featureKey`; only the Super Admin can change flags. See CLAUDE.md "Per-tenant feature control" and `docs/system-architecture.md`.
