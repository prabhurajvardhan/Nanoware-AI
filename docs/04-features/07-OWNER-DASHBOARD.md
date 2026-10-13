# Owner Dashboard

- **Document ID:** FEAT-07
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Members see authorized operational data and owners perform permitted actions with clear UI states.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Member; owner; operator with audited access

## Preconditions
Valid membership, active business, query contracts.

## Main user journey
Open dashboard -> load scoped customers/bookings -> inspect -> perform permitted action -> receive state/conflict result.

## Alternative journeys and failure cases
Empty new business, forbidden role, suspended business, stale listener, booking conflict, provider outage.

## Business rules
Forbidden differs from empty; conflicts prompt refresh; no sensitive data in client logs.

## State transitions
View state is derived/read-only; mutations transition domain entities through their feature state machines.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
All queries carry trusted business scope; legacy userId views are not target proof.

## Authentication and authorization
Role-specific actions and server reauthorization.

## Validation rules
Pagination, filters, field projections, and stale version validation.

## Retry, duplicates, and concurrency
Read reconnect safe; mutations idempotent when side effects exist.

## Observability
Load latency, denied actions, stale/conflict, query size, and UI error rates.

## Acceptance criteria
A/B isolation; owner/member matrix; loading/empty/error/forbidden; existing-route regression.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-011](../06-task-specifications/TASK-011-OWNER-DASHBOARD.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: member role granularity, export access, realtime versus polling.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
