# Master Implementation Workflow

- **Document ID:** FLOW-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

1. Read [master index](../00-bible/00-MASTER-INDEX.md) and the task’s linked documents.
2. Inspect status, current implementation, tests, and environment.
3. Write/confirm a small design and migration plan.
4. Implement schema/policy first, then service, API, UI, and observability.
5. Test positive and negative paths after each logical change.
6. Review security, tenant scope, idempotency, logs, and error contracts.
7. Update docs, links, and completion report.
8. Only then propose merge/deploy using the verified environment runbook.

Stop if a provider, schema, legal, or security decision is unresolved.
