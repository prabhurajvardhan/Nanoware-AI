# TASK-007 — Public Page and Services

- **Document ID:** TASK-007
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PROPOSED
- **Dependencies:** TASK-004, TASK-005, TASK-006
- **Related requirements:** PR-02, PR-03; profile and service catalog
- **Related architecture:** Public projection and data model
- **Related tests:** Allowlist leakage, draft isolation, invalid duration, unpublished service, owner/member authorization, and existing-route regression.

## Objective
Define owner publishing of an allowlisted profile/service catalog and safe public read behavior.

## Problem statement
Current pages are Nanoware marketing pages; no business profile/service tenant feature is verified.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define draft/published versions, profile fields, service fields, validation, visibility, ordering, public projection, and owner permissions.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-004, TASK-005, TASK-006. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect current public routes/components for regression boundaries, plus routing and Firebase access patterns.

## Expected files or components to modify
Feature and API documentation; no public UI or data implementation in this PR.

## Detailed implementation workflow
1. List current public routes that must remain unchanged.
2. Define private draft versus published projection and publication version.
3. Define service duration/availability dependencies without deciding unapproved pricing policy.
4. Define owner/member permissions for edit, publish, unpublish.
5. Define projection tests proving CRM, notes, billing, and private booking details never serialize.
6. If business fields or legal copy are undecided, record options and block implementation of those fields.

## Required behavior
Visitors see only active published profile/services; owners can preview drafts without exposing them publicly.

## Data contracts or interfaces
Public response contains approved identity, description, contact channels, services, hours, and publication metadata only after allowlist review.

## Security requirements
Public reads do not require membership but never accept a client-selected private collection or business ID as authorization.

## Error handling
Invalid service data remains draft; publish conflict is explicit; unknown tenant is safe 404.

## Idempotency and retry behavior
Publish operation uses version/idempotency semantics; repeated publish does not duplicate data.

## Observability requirements
Track publication version, validation failures, public read errors, and projection size.

## Test strategy
Allowlist leakage, draft isolation, invalid duration, unpublished service, owner/member authorization, and existing-route regression.

## Acceptance criteria
A reviewer can enumerate every public field and every non-public field; publication and rollback states are testable.

## Regression risks
Accidental serialization of private fields or cache of draft content.

## Rollback or recovery strategy
Unpublish current version and restore previous publication version; retain audit event.

## Documentation updates
Update profile, service catalog, routing, API, and security docs.

## Definition of done
TASK-008 and public booking can depend on a stable, safe projection.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
