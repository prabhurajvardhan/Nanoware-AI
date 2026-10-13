# Multi-Tenant Test Cases

- **Document ID:** TEST-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Run every read/write as A, B, public, member, owner, operator, and system worker. Verify direct IDs, list queries, subcollections, caches, exports, notifications, logs, assistant retrieval, and background jobs. A passing suite must prove no A record, count, existence signal, or public projection is exposed to B without an explicit approved public field.
