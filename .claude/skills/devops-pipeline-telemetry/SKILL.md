---
name: devops-pipeline-telemetry
description: "DevOps pipeline telemetry, step timing optimization, caching strategies, and pull request status checks across dual-stack repositories."
risk: low
source: custom
date_added: "2026-09-26"
---

# DevOps Pipeline Telemetry & Status Optimization

## 1. Fast Feedback & Failure Isolation
- Separate independent jobs (`backend-validation` and `frontend-validation`) so that failure in one stack does not mask the health of the other.
- Emit structured step names so developers can immediately determine from the GitHub UI whether a failure is a lint error, type mismatch, compilation failure, or broken test.

## 2. Caching & Dependency Management
- **Node.js:** Use `cache: 'npm'` with `cache-dependency-path: frontend/package-lock.json`.
- **.NET 10:** Leverage implicit NuGet caching on standard GitHub Actions runners with explicit `dotnet restore` steps.
- **Concurrency:** Ensure `cancel-in-progress: true` is configured per-branch/per-PR group to prevent CI queue congestion.
