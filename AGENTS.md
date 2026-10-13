# Nanoware AI Agent Instructions

1. Start with [`docs/00-bible/00-MASTER-INDEX.md`](docs/00-bible/00-MASTER-INDEX.md).
2. Read the relevant audit before describing current behavior.
3. Read the linked feature, architecture, task, and test documents before coding.
4. Use evidence labels: VERIFIED, INFERRED, UNVERIFIED, PROPOSED. Never invent paths, providers, commands, or production facts.
5. Tenant isolation is a release-blocking requirement. Derive authorization server-side; never trust client `businessId`, role, plan, or cookie presence.
6. Treat Firebase Admin as privileged because it bypasses Firestore rules.
7. Do not expose secrets or customer data in code, logs, docs, fixtures, or commits.
8. Test positive, negative, cross-tenant, replay, outage, and existing-route regression paths.
9. Update Markdown links and completion reports after every task.
10. Do not deploy or change production configuration without verified environment ownership and approval.

The current repository is a Next.js/Firebase application; the multi-tenant SaaS is a proposed target, not an implemented fact.
