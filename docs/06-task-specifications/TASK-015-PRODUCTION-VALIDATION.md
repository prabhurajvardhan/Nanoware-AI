# TASK-015 — Production Validation

- **Document ID:** TASK-015
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PROPOSED
- **Dependencies:** TASK-001..TASK-014
- **Related requirements:** All requirements and release acceptance
- **Related architecture:** Deployment and rollback
- **Related tests:** All release acceptance, security, multi-tenant, booking, route regression, outage, restore, and rollback tests.

## Objective
Validate the assembled implementation in an authorized staging/production-like environment before release.

## Problem statement
Hosting, DNS, provider configuration, CI, backups, and production state are unverified; documentation alone cannot establish readiness.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Run release matrix, security gates, migration rehearsal, backup restore, route regression, provider outage, monitoring, and rollback drills.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-001..TASK-014. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect deployment manifests, CI, environment/secrets, Firebase rules/indexes, provider webhooks, and runbooks after ownership is verified.

## Expected files or components to modify
Release evidence and final audit only; no deployment is performed by this documentation task.

## Detailed implementation workflow
1. Confirm environment ownership, artifact commit, secrets source, provider endpoints, and data classification.
2. Refuse production validation if any required provider or backup owner is unknown; mark UNVERIFIED.
3. Run pinned build/lint/typecheck/test commands and record versions/exits.
4. Execute two-tenant security matrix and existing-route regression.
5. Rehearse migration, backup restore, rollback, webhook replay, provider outage, and incident escalation.
6. Compare evidence with every release-blocking gate; failures become blockers with owners.
7. Produce a signed release report; do not claim PASS from documentation inspection alone.

## Required behavior
Release proceeds only when all critical security, data, operational, and recovery gates have evidence.

## Data contracts or interfaces
Release evidence bundle: artifact commit, command results, test report, migration checkpoint, restore result, monitoring links, approvals.

## Security requirements
Tenant isolation, verified auth, public projection, tool authorization, webhook verification, and secret handling are mandatory gates.

## Error handling
Any failed critical gate is FAIL; missing provider/environment evidence is UNVERIFIED, not PASS.

## Idempotency and retry behavior
Re-run failed isolated checks after correction; do not rerun destructive migration without checkpoint/recovery plan.

## Observability requirements
Verify alerts, dashboards, correlation IDs, and audit trails in the target environment.

## Test strategy
All release acceptance, security, multi-tenant, booking, route regression, outage, restore, and rollback tests.

## Acceptance criteria
Each validation area is marked PASS/FAIL/PARTIAL/UNVERIFIED with evidence, owner, and next action; no unsupported production claim remains.

## Regression risks
False confidence from a local-only run or incomplete provider configuration.

## Rollback or recovery strategy
Use verified artifact rollback and data recovery procedure; never improvise a destructive rollback.

## Documentation updates
Update final audit, release report, deployment, monitoring, backup, and incident docs.

## Definition of done
A responsible owner can approve or reject release from the evidence bundle.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
