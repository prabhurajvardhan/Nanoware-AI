# TASK-013 — Billing

- **Document ID:** TASK-013
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PROPOSED
- **Dependencies:** TASK-012
- **Related requirements:** PR-06; subscriptions and pricing
- **Related architecture:** API contracts and security
- **Related tests:** Forged/replayed/out-of-order webhook, cancellation, grace, payment failure, duplicate entitlement, tenant isolation.

## Objective
Define provider-verified subscription state and entitlement reconciliation without selecting an unapproved provider.

## Problem statement
Pricing is only a proposed assumption; no billing provider, webhook, tax, refund, or entitlement implementation is verified.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Document provider selection criteria, subscription lifecycle, signed webhooks, event idempotency, grace/cancellation, usage entitlement mapping, and reconciliation.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-012. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect package manifests and env examples for payment SDKs/secrets; current audit shows no verified provider integration.

## Expected files or components to modify
Billing/pricing/API/security docs; no payment integration or purchase action.

## Detailed implementation workflow
1. Confirm whether a payment provider SDK or route exists; current evidence should remain UNVERIFIED if absent.
2. Record provider alternatives and decision criteria: currencies, tax, webhooks, customer portal, refunds, regional support.
3. Define provider event as source of truth and map it to internal subscription states.
4. Define signature verification, event ID replay, ordering, reconciliation, and manual correction.
5. Define entitlements as server policy linked to usage, never frontend claims.
6. Specify trial/grace/cancel/refund behavior as open decisions until approved.
7. Test forged, duplicate, out-of-order, delayed, and provider outage events.

## Required behavior
Internal subscription state changes only after verified provider evidence or an audited operator correction.

## Data contracts or interfaces
Proposed `Subscription={businessId,provider,providerCustomerId,providerSubscriptionId,state,period,entitlements}`; provider is OPEN DECISION.

## Security requirements
Never accept payment status from browser; protect webhook secrets and minimize payment data.

## Error handling
Invalid signature 401; duplicate 200/no-op; unknown event 202/audit; processing failure retryable.

## Idempotency and retry behavior
Event ID makes webhook handling idempotent; reconciliation repairs missed events.

## Observability requirements
Track signature failures, event IDs, state transitions, lag, reconciliation drift, and provider latency.

## Test strategy
Forged/replayed/out-of-order webhook, cancellation, grace, payment failure, duplicate entitlement, tenant isolation.

## Acceptance criteria
Provider choice and commercial decisions are visibly open or approved; webhook lifecycle and entitlement mapping are testable.

## Regression risks
Granting access on frontend claims or losing entitlements due to event ordering.

## Rollback or recovery strategy
Freeze entitlement changes, reconcile from provider, and retain prior state; do not delete billing history.

## Documentation updates
Update billing, pricing, API, environment, operations, and decision log.

## Definition of done
TASK-014 can operate billing state with an approved provider contract.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
