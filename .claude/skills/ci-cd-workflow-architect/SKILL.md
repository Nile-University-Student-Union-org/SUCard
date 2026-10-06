---
name: ci-cd-workflow-architect
description: "Architectural guidelines for unambiguous, descriptive, and robust GitHub Actions CI/CD workflows across dual-stack (.NET 10 Clean Architecture and Next.js 16 App Router) codebases."
risk: low
source: custom
date_added: "2026-09-26"
---

# CI/CD Workflow Architect

## 1. Core Principles for Workflow & Action Naming
- **Explicit Domain Naming:** Workflow and Action names must never use vague or ambiguous acronyms (like a bare `CI` or `build.yml`). They must explicitly declare the architectural domain being validated (e.g. `Fullstack CI Validation (Backend .NET 10 & Frontend Next.js 16)`).
- **Self-Documenting Job Identifiers:** Job names rendered in GitHub Pull Request checks and Commit Status checks must state the framework, runtime, and validation scope:
  - `Backend (.NET 10 Build & Unit/Integration Tests)`
  - `Frontend (Next.js 16 Lint, Typecheck & Production Build)`
- **Concurrency & Resource Efficiency:** Always configure cancellation groups on push/PR (`cancel-in-progress: true`) to abort outdated runs when developers push new commits.

## 2. Multi-Stack Pipeline Standard
Every dual-stack PR and commit must validate both tiers:
1. **Backend Validation:**
   - Setup .NET SDK matching solution target (`10.0.x`).
   - Restore solution dependencies (`TheCanvas.sln`).
   - Build with `--configuration Release`.
   - Run unit and integration test suites with standard verbosity.
2. **Frontend Validation:**
   - Setup Node.js runtime (`20.x`).
   - Clean dependency installation (`npm ci`).
   - Strict TypeScript static type check (`npx tsc --noEmit`).
   - Code style and rule enforcement (`npm run lint`).
   - Production Next.js standalone build (`npm run build`).
