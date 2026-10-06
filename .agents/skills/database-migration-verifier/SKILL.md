---
name: database-migration-verifier
description: "PostgreSQL 17 schema validation, extension provisioning (uuid-ossp, pgcrypto), DDL idempotency, EF Core migration health, and database connection resiliency."
risk: low
source: custom
date_added: "2026-09-26"
---

# Database Migration & Schema Verifier

## 1. Core Principles for PostgreSQL Validation in CI/CD
- **Extension Pre-Flight Check:** Verify `database/init.sql` runs cleanly and enables `uuid-ossp` and `pgcrypto` extensions before application startup.
- **EF Core DDL Idempotency:** Ensure all automated DDL additions (such as `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and index creations) execute without syntax or type errors on clean and populated schemas.
- **Tenant Isolation Verification:** Ensure every entity table includes `TenantId` with appropriate B-tree indexes (`ix_<table_name>_tenant_id`).
- **Connection String Health:** Validate that connection pools handle transient drops and reconnect with SSL/TLS configurations.

## 2. CI/CD PostgreSQL Service Container Configuration
```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_DB: thecanvas_test
      POSTGRES_USER: canvas_admin
      POSTGRES_PASSWORD: canvas_test_password
    ports:
      - 5432:5432
    options: >-
      --health-cmd "pg_isready -U canvas_admin -d thecanvas_test"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 5
```
