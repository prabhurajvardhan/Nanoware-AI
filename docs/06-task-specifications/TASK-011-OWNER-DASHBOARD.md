# TASK-011 — Owner Dashboard

- **Document ID:** TASK-011
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PARTIAL — tenant-scoped projection and view-state foundation implemented; repositories, UI wiring, and membership evidence remain open. See [Batch 3 product foundation evidence](../ROADMAP-BATCH-3-PRODUCT-FOUNDATION.md).
- **Dependencies:** TASK-008, TASK-009
- **Related requirements:** PR-01, PR-03; owner dashboard
- **Related architecture:** System architecture and authorization
- **Related tests:** A/B dashboard isolation, role matrix, loading/error/empty states, booking conflict, listener reconnect, existing route smoke tests.

## Objective
Define an owner/member dashboard that renders tenant-scoped customers, requests, bookings, and configuration with safe mutation states.

## Problem statement
Current dashboard listens to legacy `projects` by `userId`; it is not evidence of a tenant SaaS dashboard.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define role-aware navigation, query boundaries, loading/empty/error/forbidden states, booking actions, pagination, audit visibility, and stale-data handling.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-008, TASK-009. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `app/dashboard/page.tsx`, `app/dashboard/DashboardContent.tsx`, `app/admin/page.tsx`, route middleware, and current Firestore listeners.

## Expected files or components to modify
Dashboard feature/API/test documentation; preserve existing UI in this PR.

## Detailed implementation workflow
1. Catalogue current dashboard queries and compare them with proposed business scope.
2. Define member versus owner actions and server mutation paths.
3. Define list pagination/order/index needs only after data contract is approved.
4. Specify conflict refresh for booking actions and stale listener recovery.
5. Define no-data, forbidden, suspended-business, and provider-outage UI states.
6. Add route regression cases for existing dashboard/projects pages.

## Required behavior
A user sees only businesses for which current membership is valid; booking/customer mutations re-check authorization server-side.

## Data contracts or interfaces
Proposed view models are projections, not raw Firestore documents; mutations return version/state and correlation ID.

## Security requirements
Client listeners do not replace server authorization; avoid exposing private notes to members without permission.

## Error handling
Forbidden and missing membership are distinct from empty; stale/conflict state prompts refresh.

## Idempotency and retry behavior
Read listeners reconnect safely; mutations require idempotency where side effects exist.

## Observability requirements
Track dashboard load/error latency, denied actions, conflict refreshes, and query sizes.

## Test strategy
A/B dashboard isolation, role matrix, loading/error/empty states, booking conflict, listener reconnect, existing route smoke tests.

## Acceptance criteria
Every dashboard screen has actor, query scope, action authorization, state handling, and regression coverage.

## Regression risks
Legacy `userId` query accidentally exposes or omits target tenant data.

## Rollback or recovery strategy
Keep legacy screens available behind documented migration path; disable target mutations without deleting data.

## Documentation updates
Update dashboard, auth, multi-tenancy, and test docs.

## Definition of done
TASK-012 can consume dashboard events and usage views.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
