---
name: repository-naming-conventions
description: "Repository-wide naming standards for GitHub Actions workflows, directories, architectural layers, domain modules, and file assets."
risk: low
source: custom
date_added: "2026-09-26"
---

# Repository Naming Conventions & Taxonomy

## 1. Workflow & GitHub Actions Naming Taxonomy
1. **Workflow File Names:** Must be lower-kebab-case with explicit scope identifiers:
   - `fullstack-ci-validation.yml` (preferred for comprehensive full-stack verification)
   - `backend-validation.yml` (for backend-isolated scheduled or trigger passes)
   - `frontend-validation.yml` (for frontend-isolated visual or unit passes)
2. **Workflow Display Names (`name:`):** Must be formatted as proper human-readable titles clearly distinguishing the stack:
   - `Fullstack CI Validation (Backend .NET 10 & Frontend Next.js 16)`
3. **Action & Step Descriptions (`name:`):** Must begin with an active imperative verb and state the target framework:
   - `Setup .NET 10 SDK`
   - `Setup Node.js 20`
   - `Typecheck TypeScript Code (npx tsc)`
   - `Lint Frontend Code (ESLint)`
   - `Run Backend Unit & Integration Tests (dotnet test)`

## 2. Directory & Component Naming Rules
- Shared UI Primitives: PascalCase under `src/components/ui/` (`Button.tsx`, `Modal.tsx`, `PinInput.tsx`).
- Feature Components: Grouped by domain under `src/components/<domain>/`.
- CQRS Features: `Features/<Aggregate>/<Commands|Queries>/<VerbNoun>/<VerbNoun>Command.cs`.
