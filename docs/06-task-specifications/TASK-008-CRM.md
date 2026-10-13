# TASK-008 — CRM

- **Document ID:** TASK-008
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PROPOSED
- **Dependencies:** TASK-003, TASK-004, TASK-007
- **Related requirements:** PR-01; CRM
- **Related architecture:** Multi-tenancy and data model
- **Related tests:** A/B isolation, public denial, duplicate contact, merge conflict, deletion, export authorization, and retry.

## Objective
Define tenant-scoped customer records, consent/visibility, search, and history without leaking across businesses.

## Problem statement
No target CRM collection or current customer-management implementation is verified; booking and assistant features need a privacy boundary.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define customer identity normalization, duplicate/merge policy, notes, conversations linkage, retention, member visibility, and exports/deletion.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-003, TASK-004, TASK-007. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect current request/contact payloads, dashboard/admin UI, Firebase access, and email flows for existing personal data.

## Expected files or components to modify
CRM/data-model/feature docs and test fixtures; do not migrate existing requests without a separate approved task.

## Detailed implementation workflow
1. Inventory current personal fields and their sources.
2. Define minimum customer record and consent/communication preferences.
3. Decide whether customer identity is business-local or globally deduplicated; record trade-offs.
4. Define member/owner visibility and private notes.
5. Specify merge/export/delete behavior and auditability.
6. Add cross-tenant and public-projection tests before linking booking data.

## Required behavior
A customer belongs to one business context; CRM views and mutations are membership-authorized.

## Data contracts or interfaces
Proposed customer fields: business ID, normalized contact identifier, display name, consent/preferences, timestamps, and audit references; exact PII policy is OPEN DECISION.

## Security requirements
Minimize PII, protect notes/conversations, and prevent public enumeration.

## Error handling
Duplicate/invalid contact, forbidden visibility, retention deletion, and provider failure are explicit.

## Idempotency and retry behavior
Customer upsert/merge requires an idempotency or deterministic normalization strategy; retries cannot duplicate history.

## Observability requirements
Log business-scoped action, actor role, result, and merge reason without raw PII.

## Test strategy
A/B isolation, public denial, duplicate contact, merge conflict, deletion, export authorization, and retry.

## Acceptance criteria
CRM ownership, visibility, lifecycle, and privacy decisions are concrete and link to booking/assistant boundaries.

## Regression risks
Cross-business global search and irreversible merge errors.

## Rollback or recovery strategy
Soft-delete/merge reversal plan required before implementation; preserve audit trail.

## Documentation updates
Update CRM, data model, privacy operations, and test cases.

## Definition of done
TASK-009 can create or link a customer safely.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
