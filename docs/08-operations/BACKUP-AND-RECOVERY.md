# Backup and Recovery

- **Document ID:** OPS-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Backup provider and retention are UNVERIFIED. Define encrypted backups, access control, retention, point-in-time objective, restore owner, and quarterly restore test. Recovery order: stop writes or enable maintenance; preserve evidence; restore to isolated environment; validate counts, tenant boundaries, indexes/rules, and secrets; replay idempotent events; cut over with approval; monitor and document gaps.
