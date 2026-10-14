# TASK-003 — Tenant Data Isolation

- **Document ID:** TASK-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PARTIAL — foundation primitive implemented; tenant schema/migration approval remains open. See [Batch 1 foundation evidence](../ROADMAP-BATCH-1-FOUNDATION.md).
- **Dependencies:** TASK-001, TASK-002
- **Related requirements:** PR-01, PR-02; multi-tenancy
- **Related architecture:** Multi-tenancy and data model
- **Related tests:** A/B reads and writes, list queries, subcollections, public projection, cache isolation, worker authorization, and migration replay.

## Objective
Define the canonical tenant boundary and a migration-safe proof that business A cannot access business B.

## Problem statement
Current collections use `userId`, public `requests`, legacy `projects`, and Admin SDK `audits`; the target requires business-scoped records and explicit server authorization.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Inventory collection ownership, choose the proposed tenant identifier, define membership lookup, repository query invariants, rules/Admin paths, migration and deletion behavior.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-001, TASK-002. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `firestore.rules`, `app/login/page.tsx`, dashboard pages, `app/admin/page.tsx`, `lib/firebase/auditService.ts`, and all collection calls.

## Expected files or components to modify
Architecture/audit documents and later migration plans; do not alter rules or data in this documentation task.

## Detailed implementation workflow
1. Build a collection-by-collection ownership table from source and rules.
2. Mark legacy `userId` paths CURRENT and `businessId` requirements TARGET.
3. Verify whether `memberships` or `businessMembers` exists; current repository evidence shows neither, so any name is PROPOSED.
4. Define authorization before query construction and require repositories to accept trusted tenant context.
5. Define migration backfill, orphan handling, dual-read/write period, cutover, and rollback.
6. Model attacker fixtures A/B and test direct get, list, subcollection, cache, export, worker, and Admin SDK paths.
7. Stop if ownership of existing production data is unknown.

## Required behavior
Tenant-owned records require canonical `businessId`; public projections are the only exception and must be allowlisted.

## Data contracts or interfaces
Proposed `TenantContext={businessId,userId,role}`; no current implementation contract exists.

## Security requirements
Client-supplied business IDs, roles, and plan claims are untrusted. Admin SDK must repeat authorization because rules do not protect it.

## Error handling
Cross-tenant reads return 403/404 without existence leakage; missing membership fails closed.

## Idempotency and retry behavior
Migration retries are idempotent by document ID and recorded checkpoint; no partial backfill is silently treated as complete.

## Observability requirements
Track denied cross-tenant attempts, migration counts, orphan counts, and reconciliation results without private payloads.

## Test strategy
A/B reads and writes, list queries, subcollections, public projection, cache isolation, worker authorization, and migration replay.

## Acceptance criteria
The data model and migration plan name every current collection, tenant rule, exception, test fixture, and unresolved production-data decision.

## Regression risks
A superficially correct Firestore rule may not protect Admin SDK or API repositories.

## Rollback or recovery strategy
Use dual-read/forward-compatible migration and restore checkpoints; do not delete legacy data until reconciliation is approved.

## Documentation updates
Update database audit, multi-tenancy, data model, security audit, and decision log.

## Definition of done
TASK-004 has an approved tenant context and collection inventory.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
