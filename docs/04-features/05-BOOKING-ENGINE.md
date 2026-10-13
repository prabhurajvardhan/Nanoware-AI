# Booking Engine

- **Document ID:** FEAT-05
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Visitors request time for a published service and authorized owners decide without double booking.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Public visitor; customer; owner/staff; notification worker

## Preconditions
Published business/service; valid time policy; customer input; trusted tenant resolver.

## Main user journey
Submit request -> validate -> owner confirms/rejects -> customer notified -> cancel/reschedule/completion as approved.

## Alternative journeys and failure cases
Invalid service/time, unavailable slot, duplicate request, concurrent confirmation, owner rejection, cancellation deadline, provider outage.

## Business rules
Invalid/past/DST-ambiguous times fail safely; conflict is 409; notification failure does not silently change booking state.

## State transitions
Proposed states: requested, confirmed, rejected, cancelled, completed, no_show. Exact approval of states is OPEN DECISION. Each transition must name actor, precondition, auth, validation, side effects, and failure.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Canonical UTC instants plus IANA business timezone; operating hours, duration, interval, buffers, closed dates, lead time, cancellation deadlines are explicit policy inputs.

## Authentication and authorization
Public submit is bounded/rate-limited; owner actions require membership; customer cannot self-confirm.

## Validation rules
Atomic transaction/conditional reservation must enforce one confirmed interval per business/resource; ordinary read/write is insufficient.

## Retry, duplicates, and concurrency
Idempotency key returns original result; notifications keyed by state event; concurrent attempts yield at most one confirmation.

## Observability
State transitions, conflict, policy version, idempotency outcome, and delivery attempts are observable.

## Acceptance criteria
Given/When/Then cases cover success, confirmation, unauthorized operation, invalid service/time, unavailable slot, concurrency, duplicate, rejection, cancellation, notification failure, tenant isolation, and partial retry.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-009](../06-task-specifications/TASK-009-BOOKING-ENGINE.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
No current booking engine is verified; all lifecycle/policy details are proposed until approved.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
