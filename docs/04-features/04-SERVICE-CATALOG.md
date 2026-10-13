# Service Catalog

- **Document ID:** FEAT-04
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Owners configure services that can be safely displayed and referenced by booking.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Owner; authorized member; public visitor

## Preconditions
Business configured; owner membership; service data valid.

## Main user journey
Create draft service -> validate duration/display fields -> publish/activate -> visitor views -> owner archives.

## Alternative journeys and failure cases
Invalid duration, duplicate name, archived service referenced by booking, unauthorized edit.

## Business rules
Validation errors retain draft; archive does not delete historical booking references.

## State transitions
draft/inactive -> active -> archived; archived service cannot accept new booking requests.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Service belongs to one business; public sees only active published fields.

## Authentication and authorization
Owner writes require membership; public reads use projection.

## Validation rules
Duration, interval, price display, description, and ordering rules require product decisions where not approved.

## Retry, duplicates, and concurrency
Publish/archive/retry by stable service ID; no duplicate records.

## Observability
Catalog change audit, invalid publish count, booking rejection due to inactive service.

## Acceptance criteria
Inactive/archived service is rejected for new requests; historical records remain readable to authorized roles.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-007](../06-task-specifications/TASK-007-PUBLIC-PAGE-AND-SERVICES.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: price/currency, staff assignment, buffer rules, service versioning.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
