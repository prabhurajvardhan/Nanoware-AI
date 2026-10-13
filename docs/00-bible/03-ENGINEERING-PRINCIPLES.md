# Engineering Principles

- **Document ID:** BIBLE-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

1. **Evidence before assertion:** label findings VERIFIED, INFERRED, UNVERIFIED, or PROPOSED.
2. **Tenant isolation by construction:** derive tenant scope on the server and include it in every tenant query.
3. **Least privilege:** public, member, owner, operator, and system actions have distinct capabilities.
4. **Idempotent side effects:** retries must not duplicate bookings, emails, usage, or payments.
5. **Explicit state machines:** invalid transitions are rejected and logged.
6. **Secure defaults:** deny by default, allowlist public fields, validate schemas, and avoid secrets in clients.
7. **Observable changes:** every task records evidence, tests, migration impact, and rollback.
8. **Small reversible increments:** preserve the current application until target behavior has acceptance evidence.
9. **Privacy minimization:** collect only fields needed for the user-visible outcome.
10. **Provider isolation:** external providers are behind adapters with contract tests.
