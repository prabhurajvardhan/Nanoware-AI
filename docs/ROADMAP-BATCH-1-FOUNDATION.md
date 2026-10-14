# Roadmap Batch 1 — Dependency-Safe Foundation

- **Branch:** `roadmap/implementation`
- **Base:** `d80e3e0` (PR #6 and PR #7 merged into `main`)
- **Status:** Partial implementation; pushed in PR #8, not merged or deployed
- **Scope:** T003, T004, T005, T006 foundation primitives

## Implemented

This batch adds provider-independent, pure server-side primitives that are safe to ship behind future repositories and APIs:

- **T003 — Tenant context:** `lib/tenant/context.mjs` accepts tenant context only when marked as server-trusted, validates the business/user/role shape, rejects inactive memberships, and prevents cross-business access. It does not invent or persist a membership collection and does not migrate current data.
- **T004 — API contracts:** `lib/api/contracts.mjs` provides validated request-correlation IDs, stable success/error envelopes, safe status mapping, and retryability metadata. It does not claim that future tenant/provider schemas are finalized.
- **T005 — Provisioning:** `lib/provisioning/state-machine.mjs` defines the documented onboarding lifecycle and rejects invalid transitions. It has no persistence or external side effects, so retry/orphan recovery still requires the approved business/membership schema.
- **T006 — Domain routing:** `lib/routing/host.mjs` safely normalizes and classifies platform, base-domain slug, and custom-domain hosts. It does not resolve a host to a business or make DNS/hosting claims.

## Evidence

`test/roadmap-foundation.test.mjs` covers trusted-context enforcement, cross-tenant rejection, role checks, request-ID normalization, API envelopes, provisioning transition guards, host normalization, invalid-host rejection, and host classification. `npm run test:roadmap` passed with 4 tests and 0 failures.

## Task status

T003, T004, T005, and T006 are **PARTIAL**, not complete. Their acceptance criteria remain blocked by the documented open decisions:

- **D-006:** migration or retirement of current `projects`, `requests`, and `audits` data.
- **D-008:** canonical `businessId` is proposed, not approved as an implemented production schema.
- **D-004:** hosting, DNS, and `business.nanowareai.in` ownership are unverified.
- Identity/legal consent, provider contracts, and production data ownership remain unresolved where called out by each task specification.

No Firestore collection, rule, migration, DNS record, provider credential, or production configuration was changed. The primitives intentionally fail closed and can be adopted by later repositories once the decisions are approved.

## Remaining work for the next batch

1. Approve the tenant/membership model and current-data migration ownership before wiring `createTenantContext` to Firestore.
2. Adopt the API envelope in the existing routes through compatibility-preserving adapters and add route-level contract tests.
3. Add persisted provisioning only after business/membership IDs, consent, and recovery ownership are approved.
4. Add a trusted host-to-business resolver only after hosting/DNS capability and mapping lifecycle are verified.
5. Continue T007–T010 only after T003–T006 acceptance evidence exists.
