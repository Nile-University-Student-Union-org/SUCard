---
name: redis-state-pipeline-auditor
description: "Redis 8 cache verification, sliding window rate limiter tests, token revocation blocklist validation, and Redis persistence checks in CI/CD."
risk: low
source: custom
date_added: "2026-09-26"
---

# Redis State & Pipeline Auditor

## 1. Core Principles for Redis Validation in CI/CD
- **Healthcheck & Ping Response:** Ensure Redis 8 container responds with `PONG` to `redis-cli ping`.
- **Token Blocklist Revocation:** Verify `blocklist:token:<jti>` entries are written with exact TTL expiration.
- **Sliding Window Rate Limiter:** Verify rate limiting buckets reject brute-force operations after 5 attempts and apply 15-minute lockouts.
- **Distributed Caching:** Ensure cache serialization/deserialization for user orders (`orders:user:<userId>`) and platform settings operates without deserialization faults.

## 2. CI/CD Redis Service Container Configuration
```yaml
services:
  redis:
    image: redis:8-alpine
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 5
```
