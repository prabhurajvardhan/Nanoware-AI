# TASK-009 — Booking Engine

- **Document ID:** TASK-009
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PARTIAL — lifecycle and deterministic slot/idempotency key foundation implemented; policy, persistence, and atomic reservation evidence remain open. See [Batch 2 domain foundation evidence](../ROADMAP-BATCH-2-DOMAIN-FOUNDATION.md).
- **Dependencies:** TASK-004, TASK-007, TASK-008
- **Related requirements:** PR-03; booking requirements
- **Related architecture:** Data model, error recovery, time handling
- **Related tests:** Given/When/Then cases: valid request; owner confirmation; unauthorized operation; invalid service/time; unavailable slot; concurrent same-slot requests with exactly one confirmation; duplicate submission; rejection; cancellation; notification failure; tenant isolation; partial retry.

## Objective
Specify a concurrency-safe, tenant-scoped booking lifecycle with explicit availability and idempotency rules.

## Problem statement
The current app has no verified booking engine. A normal availability read followed by a write would not prove exclusivity in Firestore.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define booking states, transitions, availability representation, timezone/DST, lead/cancellation rules, duplicate submissions, concurrent confirmation, owner decisions, and notifications.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-004, TASK-007, TASK-008. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect Firebase database technology, current contact/request paths, email actions, and any time utilities; no booking source is currently verified.

## Expected files or components to modify
Booking feature, data model, API, test, and notification documentation only.

## Detailed implementation workflow
1. Confirm current Firestore SDK/database capabilities and whether a transaction or conditional reservation can be used; do not assume a read/write pair is safe.
2. Define candidate states `requested`, `confirmed`, `rejected`, `cancelled`, `completed`, `no_show`; mark approval status and choose only after product decision.
3. Define availability from business timezone, operating hours, service duration, interval, buffers, closed dates, unavailable periods, lead time, and cancellation deadline. Unapproved policies remain OPEN DECISIONS.
4. Define canonical UTC instants plus IANA timezone for display and DST validation.
5. Specify an atomic reservation/conditional-write invariant so two simultaneous confirmations cannot occupy the same business/service/interval.
6. Define idempotency key handling: repeated submission returns the original request/result and creates no duplicate customer, booking, usage, or notification.
7. Define owner/staff confirm/reject/cancel/reschedule authorization and state-transition preconditions.
8. Define notification outbox/attempt record; delivery failure does not silently change booking state.
9. If Firestore transaction limits or provider capabilities are insufficient, stop and record the alternative (reservation token/queue) instead of guessing.

## Required behavior
A booking request is validated against the published service and availability policy; only an authorized owner/staff action may confirm it; confirmed intervals are exclusive within a business.

## Data contracts or interfaces
Proposed request includes business resolver, service ID, requested local time plus IANA timezone, customer contact reference, and idempotency key. Persist canonical UTC start/end, policy version, state, and audit metadata. Exact “qualified request” definition is OPEN DECISION.

## Security requirements
Public submit is rate-limited and bound to published business/service; owner actions require membership; client status/price/business IDs are not trusted.

## Error handling
Invalid service/time 400; unknown tenant 404; slot conflict 409; duplicate returns prior result; dependency outage 503; forbidden action 403.

## Idempotency and retry behavior
Booking write and confirmation must be transactionally or conditionally idempotent. Notification retries use event IDs and bounded backoff; booking state is not rolled back solely because email failed.

## Observability requirements
Record state transitions, slot key hash, policy version, conflict count, idempotency outcome, notification attempts, and correlation ID without exposing full PII.

## Test strategy
Given/When/Then cases: valid request; owner confirmation; unauthorized operation; invalid service/time; unavailable slot; concurrent same-slot requests with exactly one confirmation; duplicate submission; rejection; cancellation; notification failure; tenant isolation; partial retry.

## Acceptance criteria
The document names valid states/transitions with actor, precondition, authorization, validation, result, side effects, and failure behavior; availability/time/idempotency/concurrency are testable; no current booking implementation is claimed.

## Regression risks
Double booking, DST ambiguity, duplicate messages, and confirmation without durable availability.

## Rollback or recovery strategy
Cancel/unpublish affected service or revert policy version; preserve existing bookings; use compensating state transitions, not destructive deletion.

## Documentation updates
Update booking test cases, API/data model, notifications, usage metering, and decision log.

## Definition of done
TASK-010/011 can consume a well-defined booking contract and concurrency invariant.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
