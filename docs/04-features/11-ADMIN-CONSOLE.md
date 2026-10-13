# Admin Console

- **Document ID:** FEAT-11
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Provide least-privilege platform support and operational controls with audited break-glass access.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Platform operator; support agent; system worker

## Preconditions
Privileged identity, approved role, reason/ticket, tenant scope.

## Main user journey
Authenticate -> select bounded operation/reason -> preview -> execute -> audit -> exit.

## Alternative journeys and failure cases
Unauthorized operator, missing reason, cross-tenant query, destructive action, secret exposure, audit failure.

## Business rules
Fail closed if audit write or authorization cannot be established for sensitive action.

## State transitions
Admin action lifecycle proposed: requested -> authorized -> executed/failed -> audited.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Operator access is exceptional, tenant-scoped, and data-minimized.

## Authentication and authorization
Admin SDK calls require explicit application authorization; Firestore rules do not protect them.

## Validation rules
Action schema, scope, reason, approval, and confirmation validated.

## Retry, duplicates, and concurrency
Safe retry only for idempotent reads/operations; destructive actions require explicit idempotency/confirmation.

## Observability
Admin denials, break-glass sessions, action outcomes, audit failures, and access volume.

## Acceptance criteria
Operator cannot access tenant data without scope/reason; every action is attributable.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-014](../06-task-specifications/TASK-014-OPERATIONS-AND-ADMIN.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: operator roles, approval model, retention, emergency disablement.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
