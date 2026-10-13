# TASK-005 — Business Provisioning

- **Document ID:** TASK-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PROPOSED
- **Dependencies:** TASK-002, TASK-003, TASK-004
- **Related requirements:** PR-01; onboarding
- **Related architecture:** Data model and authentication
- **Related tests:** Duplicate signup, slug collision, retry after each partial step, unauthorized membership, and rollback/orphan scan.

## Objective
Specify an idempotent business/workspace and owner-membership provisioning workflow.

## Problem statement
The current signup creates a `users` document and legacy `projects`; the proposed workspace lifecycle is not implemented or tenant-safe.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define inputs, identity verification prerequisite, slug uniqueness, business lifecycle, owner membership, retries, orphan cleanup, and operator recovery.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-002, TASK-003, TASK-004. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `app/login/page.tsx`, AuthProvider, Firebase Admin helpers, rules, and any existing user/project creation path.

## Expected files or components to modify
Business onboarding and data-model docs; future implementation files must be discovered from current source.

## Detailed implementation workflow
1. Confirm current signup side effects and whether a user may own multiple businesses.
2. Decide when a business ID is allocated and how slug collisions are handled.
3. Define transaction/batch boundaries and an idempotency key derived from verified identity plus request key.
4. Model `requested -> identity_verified -> provisioning -> configured -> published` plus failure/suspended states.
5. Define retry for each resource and orphan reconciliation.
6. Specify UI recovery for duplicate, expired, and partial provisioning.
7. Stop if legal consent, owner identity, or production migration requirements are unresolved.

## Required behavior
A repeated onboarding request converges on one business and one owner membership.

## Data contracts or interfaces
Proposed create input: business display name, timezone, contact, consent reference; output includes business ID and provisioning state.

## Security requirements
Only verified owner identity can create membership; slug/domain claims are not authorization.

## Error handling
Collision, invalid timezone, duplicate request, dependency failure, and suspended identity have distinct outcomes.

## Idempotency and retry behavior
Provisioning steps are individually idempotent and resume from persisted state; no duplicate membership or public mapping.

## Observability requirements
Record state transition, step, retry count, correlation ID, and safe failure code.

## Test strategy
Duplicate signup, slug collision, retry after each partial step, unauthorized membership, and rollback/orphan scan.

## Acceptance criteria
State machine, input/output, ownership, retry, and recovery are explicit and independently testable.

## Regression risks
Creating a second workspace for a retry or exposing a half-configured public page.

## Rollback or recovery strategy
Keep incomplete work unpublished; operator can resume or archive with an auditable action.

## Documentation updates
Update onboarding, data model, feature, and operations docs.

## Definition of done
TASK-006 can rely on a stable published business identity.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
