# TASK-012 — Usage Metering

- **Document ID:** TASK-012
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PARTIAL — immutable event identity and replay classification implemented; qualifying-event, period, persistence, and limit policy remain open. See [Batch 3 product foundation evidence](../ROADMAP-BATCH-3-PRODUCT-FOUNDATION.md).
- **Dependencies:** TASK-009, TASK-010, TASK-011
- **Related requirements:** PR-05; pricing
- **Related architecture:** Data model and error recovery
- **Related tests:** Duplicate event, replay after timeout, two tenants same event key, period boundary, concurrent count, over-limit, repair.

## Objective
Define exactly which business events count toward usage and record them once with reconciliation.

## Problem statement
The proposed free allowance depends on “qualified booking request,” but that term is not yet defined and current app has no usage system.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define event taxonomy, qualification point, business period/timezone, immutable event key, counter/reconciliation, owner display, limits, and backfill policy.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-009, TASK-010, TASK-011. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect booking, assistant, dashboard, and any current request/email persistence; no usage collection is verified.

## Expected files or components to modify
Usage/pricing/data-model/test docs only; do not enforce limits in this PR.

## Detailed implementation workflow
1. Enumerate candidate events: public submit, qualified request, owner confirmation, assistant tool call; document trade-offs.
2. Obtain product decision for qualified event before implementation.
3. Define immutable event key from source event ID and business ID; duplicate/replay behavior.
4. Define weekly period boundary and timezone, including late events.
5. Define counter projection versus source-of-truth events and reconciliation.
6. Define over-limit behavior and owner explanation; do not infer billing entitlement from client UI.
7. Test replay, partial failure, migration/backfill, and cross-tenant aggregation.

## Required behavior
One qualifying source event yields one business-scoped usage event; counts are explainable from immutable evidence.

## Data contracts or interfaces
Proposed `UsageEvent={businessId,eventKey,kind,occurredAt,periodKey,sourceRef}`; qualification remains OPEN DECISION.

## Security requirements
Only trusted server events count; client plan/count claims are ignored.

## Error handling
Reconciliation mismatch is visible to operators; ingestion retry does not double count.

## Idempotency and retry behavior
Event ingestion is idempotent by event key; counter repair is deterministic.

## Observability requirements
Track accepted/duplicate/rejected events, counter drift, period, and reconciliation status.

## Test strategy
Duplicate event, replay after timeout, two tenants same event key, period boundary, concurrent count, over-limit, repair.

## Acceptance criteria
The qualifying event, period, data source, idempotency key, and user-visible explanation are explicitly approved or marked open.

## Regression risks
Charging/limiting the wrong event or counting assistant retries.

## Rollback or recovery strategy
Disable enforcement while retaining immutable events; rebuild counters from source after correction.

## Documentation updates
Update pricing, usage feature, data model, billing, and test docs.

## Definition of done
TASK-013 can map usage to provider entitlements without ambiguity.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
