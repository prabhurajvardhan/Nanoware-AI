# Subscriptions and Billing

- **Document ID:** FEAT-09
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Represent provider-verified plan state and entitlements for one business.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Owner; billing provider; webhook worker; operator

## Preconditions
Provider decision, business identity, usage policy, webhook secret.

## Main user journey
Owner selects plan -> provider checkout -> signed event -> internal state -> entitlement enforcement/reconciliation.

## Alternative journeys and failure cases
Forged frontend claim, duplicate/out-of-order webhook, payment failure, grace, cancellation, refund, provider outage.

## Business rules
Invalid signatures rejected; unknown event audited; processing retryable.

## State transitions
Proposed states active, trialing, past_due, cancelled, expired; provider mapping OPEN DECISION.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Subscription belongs to business; payment data minimized; entitlement server-side.

## Authentication and authorization
Only verified provider event or audited operator correction changes status.

## Validation rules
Webhook signature/event ID, provider IDs, currency/tax, and state transitions validated.

## Retry, duplicates, and concurrency
Event ID idempotency and reconciliation; never duplicate entitlements.

## Observability
Signature failures, event lag, drift, state transitions, and provider latency.

## Acceptance criteria
Frontend cannot grant plan; replay/out-of-order tests preserve correct state.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-013](../06-task-specifications/TASK-013-BILLING.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: provider, prices, tax, refunds, trial/grace, portal, regional availability.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
