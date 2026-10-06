---
name: quiz-engine-architecture
description: "Resilient Quiz & Assessment Engine Architecture. Enforces zero-data-loss exam mechanics: server-authoritative countdown timers, guaranteed auto-submission at 00:00, single active session constraint, immediate frontend screen freeze upon disconnection, and scoped SignalR proctoring hubs for instructors/owners only."
risk: critical
source: custom
date_added: "2026-09-23"
---

# Resilient Quiz & Assessment Engine Skill

> **Mandate:** Assessments are high-stakes operations requiring guaranteed integrity, zero data loss, and authoritative server reconciliation.

---

## 1. Core Examination Integrity Tenets (REQUIREMENTS.md Section 3.4)

1. **Access Modes:**
   - With Password: Securely hashed passkey, brute-force guarded via Redis rate limiting (max 5 attempts -> 15 min lockout).
   - Without Password: Direct enrollment authorization check against student roster.

2. **Single Active Session Constraint:**
   - A quiz attempt is strictly bound to **one single active session**.
   - Attempting to open the quiz in a second tab, window, or device immediately invalidates/blocks the concurrent session with an explicit security alert.

3. **Disconnection Screen Freeze:**
   - If a student loses internet connectivity or network heartbeat drops for **any** reason during a quiz:
     - The frontend UI MUST immediately freeze.
     - Form inputs, radio selections, and timers must be disabled.
     - A persistent full-screen connectivity modal/overlay with a spinner and "Reconnecting to exam servers..." banner MUST appear until connection is restored.
     - No student actions or answer mutations can occur while offline.

4. **Guaranteed Auto-Submission (At 00:00 or Deadline Expiry):**
   - When the examination timer hits `00:00` or the scheduled closing deadline passes:
     - Client auto-dispatches attempt submission immediately.
     - Backend background worker (Hangfire / Quartz) performs authoritative deadline reconciliation, automatically transitioning expired active attempts to `Submitted` or `Graded`.

5. **Scoped SignalR Proctoring Hubs (Rule 8):**
   - SignalR WebSockets for quizzes are strictly reserved for **Teacher & Owner Live Proctoring Hubs**.
   - Students NEVER connect to the proctoring hub; students interact strictly via standard REST APIs.

## Per-tenant feature control (binding, added 2026-09-29)

- Quizzes, quiz passwords, grading, live proctoring and assessment telemetry are separate tenant features (`quizzes`, `quiz_passwords`, `quiz_grading`, `live_proctoring`, `assessment_telemetry`). When `quizzes` is disabled, no new attempt may start, but attempts already running can finish and the deadline worker still auto-submits them (docs/FEATURE_CONTROL.md §1.4). New quiz capabilities must be registered in `TenantFeatureCatalog` and gated with `[RequiresFeature]` / `IFeatureGate` and the hub feature filter.
