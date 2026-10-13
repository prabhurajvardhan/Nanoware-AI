# Service Catalog

- **Document ID:** FEAT-04
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Configure services, duration, price/display policy, and active state.

## User stories
- As a permitted user, I can complete the flow for one business and see durable status.
- As an unauthorized user, I cannot read or mutate another business’s data.
- As an operator, I can diagnose failures without exposing secrets or unnecessary personal data.

## Functional requirements
1. Validate all input at the server boundary.
2. Resolve `businessId` from trusted context and enforce membership/role.
3. Make external side effects idempotent and auditable.
4. Provide loading, empty, success, conflict, forbidden, dependency-failure, and retry states.
5. Preserve existing routes unless a reviewed migration says otherwise.

## Current implementation status
**PROPOSED target feature.** Related current code is not proof of this feature. Existing relevant areas include `app/`, `components/`, `lib/firebase.ts`, `lib/firebase-admin.ts`, and `firestore.rules`; confirm exact integration points during TASK-007.

## Dependencies and data
- Dependencies: identity/session verification, tenant repository, schema validation, audit logging, and the linked architecture documents.
- Proposed entities: `services`, each with canonical `businessId` where tenant-owned.
- Proposed state changes must be represented by explicit transitions and versioned timestamps.

## Contracts and authorization
Expose only versioned contracts described in [API contracts](../03-architecture/API-CONTRACTS.md). Public operations use an allowlist; owner operations require membership; admin operations require a separate policy. Never trust client role, plan, or business ID.

## UI and validation states
Show optimistic UI only after the operation is safe to retry. Preserve user input on validation errors, avoid leaking whether private records exist, and make conflicts actionable. Announce asynchronous state changes accessibly.

## Security risks
Cross-tenant access, IDOR, over-posting, replay/duplicate mutation, sensitive-field leakage, abuse/rate exhaustion, provider compromise, and logging of personal data. Add negative tests before marking complete.

## Acceptance criteria
- Happy-path behavior works for the allowed role.
- Invalid, expired, unauthorized, cross-tenant, duplicate, and dependency-failure cases are rejected safely.
- Data is scoped by `businessId` and public output is allowlisted.
- Side effects are idempotent and audit evidence exists.
- Linked task and test cases pass; documentation is updated with changed files and unresolved issues.

## Automated tests
Unit schema/policy tests; integration repository/API tests; security negative tests; UI state/regression tests; retry/idempotency tests; provider contract tests where relevant. Exact commands must be confirmed by TASK-001.

## Operational considerations
Track success/error/conflict/latency, rate-limit events, retries, and provider failures with correlation IDs. Define retention and access for personal data before production.

## Related documents
- [Multi-tenancy](../03-architecture/MULTI-TENANCY.md)
- [Security architecture](../03-architecture/SECURITY-ARCHITECTURE.md)
- [TASK-007](../06-task-specifications/TASK-007-PUBLIC-PAGE-AND-SERVICES.md)
- [Test strategy](../07-testing/TEST-STRATEGY.md)
