---
name: infrastructure-smoke-testing
description: "Service container orchestration in CI/CD, database healthchecks, network handshake latency, automated seeding, and Docker compose validation."
risk: low
source: custom
date_added: "2026-09-26"
---

# Infrastructure Smoke Testing

## 1. Dual Infrastructure Smoke Testing Protocols
In continuous integration pipelines, infrastructure smoke testing validates that:
1. **Container Compose Specification:** `docker-compose.yml` configures valid environment variables, networks, volume mounts, port bindings, and healthy restart policies.
2. **PostgreSQL 17 Database Readiness:** PostgreSQL accepts connections, executes `init.sql`, creates required extensions, and handles concurrent transactions.
3. **Redis 8 Engine Readiness:** Redis handles ephemeral key writes, TTL expirations, and command pipelines.
4. **Seed Consistency:** Database seed scripts (`CanvasDbSeeder`) execute idempotently without primary key collisions or foreign key violations.
