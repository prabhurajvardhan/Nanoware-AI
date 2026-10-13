# Account and Business Provisioning

- **Document ID:** FEAT-01
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
A verified user creates exactly one tenant workspace and owner membership per intentional onboarding operation.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented. Current signup creates `users/{uid}`, legacy `projects`, and subcollections; target workspace is not verified.

## Actors and permissions
Owner; authenticated user; provisioning worker; platform operator

## Preconditions
Verified identity, accepted terms/consent decision, valid business name/timezone, and no conflicting idempotency request.

## Main user journey
Sign in -> submit business details -> create workspace -> create owner membership -> configure -> publish or recover failure.

## Alternative journeys and failure cases
Duplicate submission returns existing provisioning state; slug collision requires correction; partial provider/database failure leaves unpublished recoverable state.

## Business rules
State transition and step events; no half-provisioned public page.

## State transitions
requested -> identity_verified -> provisioning -> configured -> published; provisioning_failed and suspended are terminal/operational states pending retry policy.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Business ID is canonical on all tenant records; owner membership is private; public data is not visible until published.

## Authentication and authorization
Server resolves user identity and creates membership; client cannot assign itself owner role.

## Validation rules
Validate name length, IANA timezone, slug normalization, consent reference, and idempotency key.

## Retry, duplicates, and concurrency
Retry each step by stable resource key; no duplicate owner membership or notifications.

## Observability
Metrics for provisioning duration/failures/retries/orphans; correlation ID.

## Acceptance criteria
One workspace and membership after replay; unauthorized membership creation denied; failure resumes safely.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-005](../06-task-specifications/TASK-005-BUSINESS-PROVISIONING.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: multiple businesses per user, consent/legal copy, slug policy, archive semantics.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
