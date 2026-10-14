# Roadmap Batch 3 — Product and Operations Foundation

- **Branch:** `roadmap/implementation`
- **Status:** Partial implementation; not merged, pushed, or deployed
- **Scope:** T011, T012, T013, T014 provider-independent foundations

## Implemented

- **T011 — Dashboard:** `lib/dashboard/view-model.mjs` filters records by trusted business scope, returns projections rather than raw documents, and exposes explicit loading/forbidden/error/empty/ready view states.
- **T012 — Usage:** `lib/usage/events.mjs` validates immutable business-scoped usage-event identity, normalizes event timestamps, and classifies replay/duplicate events deterministically. It does not choose the unresolved qualifying event or enforce limits.
- **T013 — Billing:** `lib/billing/subscription.mjs` accepts only explicitly verified provider events, rejects tenant mismatches, ignores out-of-order events, and handles duplicate event IDs. It does not select a provider or grant access from browser claims.
- **T014 — Operations:** `lib/operations/audit-event.mjs` requires attribution/correlation fields and redacts sensitive keys and object payloads from operational audit details.

## Evidence

`test/roadmap-operations-foundation.test.mjs` covers dashboard cross-tenant filtering and view states, usage replay classification, billing verification/order/tenant checks, and operational audit redaction. The combined `npm run test:roadmap` suite passed with 12 tests and 0 failures.

## Task status

T011–T014 are **PARTIAL**, not complete. Full acceptance remains blocked by the documented dependencies and open decisions:

- T011 requires persisted tenant membership, booking/CRM repositories, and route-level UI regression evidence.
- T012 requires an approved definition of “qualified booking request,” period/timezone policy, and durable event/counter reconciliation.
- T013 requires an approved billing provider, signed webhook adapter, commercial policy, and secret configuration.
- T014 requires verified operator ownership, break-glass policy, monitoring/backup/restore evidence, and production incident drills.

No provider SDK integration, webhook endpoint, entitlement enforcement, Firestore persistence, production data, secrets, or infrastructure was changed.
