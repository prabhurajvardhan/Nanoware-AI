# Usage Metering

- **Document ID:** FEAT-08
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Record explainable business usage exactly once for approved qualifying events.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
System worker; owner view; operator reconciliation

## Preconditions
Approved definition of qualifying booking request; trusted source event; business timezone/period.

## Main user journey
Source event -> immutable usage event -> counter projection -> owner explanation -> reconciliation.

## Alternative journeys and failure cases
Duplicate/replayed event, late event, period boundary, counter drift, over-limit.

## Business rules
Mismatch becomes operational alert, not silent correction.

## State transitions
Usage event immutable; counter is derived and repairable; period state depends on approved commercial policy.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Event always has businessId and source reference; owner sees only own business.

## Authentication and authorization
Client counts/plans cannot create usage.

## Validation rules
Event key, kind, occurrence time, period, and source schema validated.

## Retry, duplicates, and concurrency
Event-key idempotency; deterministic rebuild from source.

## Observability
Accepted/duplicate/rejected events, drift, reconciliation lag.

## Acceptance criteria
Replay adds one count; A/B separation; owner explanation links to qualifying source.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-012](../06-task-specifications/TASK-012-USAGE-METERING.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: qualified definition, weekly boundary, allowance enforcement, late-event policy.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
