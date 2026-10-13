# CRM

- **Document ID:** FEAT-03
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Members manage business-local customer records and permitted history.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Owner; member; public visitor (creates bounded lead/request); operator

## Preconditions
Tenant membership for private views; consent/retention policy; customer input validated.

## Main user journey
Request/booking creates or links customer -> member views history -> owner edits permitted fields.

## Alternative journeys and failure cases
Duplicate contact, merge conflict, deletion/export request, forbidden note access, cross-tenant lookup.

## Business rules
Reject ambiguous merge and forbidden fields without existence leakage.

## State transitions
customer active -> merged/soft_deleted; history remains auditable according to retention policy.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Every record has businessId; business-local identity unless an approved global identity design exists.

## Authentication and authorization
Public writes create only bounded lead/request; member/owner roles govern private CRM.

## Validation rules
Normalize contact, cap fields, validate consent and note visibility.

## Retry, duplicates, and concurrency
Upsert/merge key must prevent duplicate customer creation; history writes use event IDs.

## Observability
Record merge/delete/export actions and access denials without raw PII.

## Acceptance criteria
A/B cannot search each other; public cannot enumerate CRM; duplicate submission converges.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-008](../06-task-specifications/TASK-008-CRM.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: global versus business-local identity, retention, export/delete obligations.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
