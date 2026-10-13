# Notifications

- **Document ID:** FEAT-10
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Deliver booking, provisioning, billing, and security notifications without duplicating side effects.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
System worker; customer; owner; operator

## Preconditions
Domain event committed; recipient preference/consent; provider configured.

## Main user journey
Domain transition -> notification event/outbox -> delivery attempt -> success/failure/retry.

## Alternative journeys and failure cases
Provider outage, invalid address, duplicate event, opt-out, partial delivery, sensitive content.

## Business rules
Delivery failure is visible and does not silently reverse domain state unless feature explicitly decides otherwise.

## State transitions
pending -> sending -> sent/failed; retry/dead-letter policy OPEN DECISION.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Notification references business/event and contains only necessary fields.

## Authentication and authorization
Recipient authorization and consent are checked before dispatch; internal notes never sent publicly.

## Validation rules
Template variables escaped and bounded; channel/provider schema validated.

## Retry, duplicates, and concurrency
Event ID prevents duplicate sends; bounded retry with backoff and dead-letter.

## Observability
Delivery latency/failure/retry, provider response class, redacted recipient hash.

## Acceptance criteria
Duplicate booking event sends one notification; failed email is retryable and audited.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-014](../06-task-specifications/TASK-014-OPERATIONS-AND-ADMIN.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: channels, preferences, retention, provider, dead-letter owner.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
