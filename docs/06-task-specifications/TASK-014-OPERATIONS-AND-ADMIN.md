# TASK-014 — Operations and Admin

- **Document ID:** TASK-014
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PROPOSED
- **Dependencies:** TASK-002, TASK-003, TASK-012, TASK-013
- **Related requirements:** All security and operations requirements
- **Related architecture:** Security architecture and runbooks
- **Related tests:** Admin role matrix, break-glass audit, notification duplicate/failure, secret redaction, incident tabletop, backup restore.

## Objective
Define least-privilege platform operations, auditability, notifications, monitoring, and incident response.

## Problem statement
Current admin pages/actions and email helpers exist, but privileged boundaries, OTP protection, notification retries, and production ownership are not verified.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define operator roles, break-glass access, admin action audit, notification outbox, monitoring, alert thresholds, backups, incident response, and data-access controls.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-002, TASK-003, TASK-012, TASK-013. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `app/admin/*`, email routes/actions/client, `lib/firebase-admin.ts`, env examples, and deployment audit.

## Expected files or components to modify
Operations/security/admin docs and test matrices only.

## Detailed implementation workflow
1. Inventory current admin actions and Admin SDK calls; mark each authorization gap.
2. Define operator role/approval/reason/audit and tenant-scoped support access.
3. Define notification event/outbox/attempt states and whether delivery failure changes domain state.
4. Define metrics, redaction, alert thresholds, retention, backup/restore, and incident severity.
5. Define OTP/session remediation requirements without implementing them here.
6. Run tabletop scenarios: cross-tenant exposure, provider outage, secret leak, duplicate webhook, and backup restore.
7. Stop if production provider/ownership is unknown; record runbook prerequisites.

## Required behavior
Privileged operations are explicit, attributable, bounded, and reversible; notification failure is observable and not silently treated as business success.

## Data contracts or interfaces
Proposed audit event `{actor,role,businessId?,action,reason,result,correlationId}`; operator identity/approval model is OPEN DECISION.

## Security requirements
Admin SDK authorization, break-glass, secret rotation, redacted logs, rate limits, and no OTP/token logging are mandatory.

## Error handling
Admin denial, provider outage, delivery failure, alert failure, and backup mismatch have separate runbook responses.

## Idempotency and retry behavior
Notifications and provider events retry by event ID; admin actions are not blindly replayed.

## Observability requirements
Define dashboards/alerts for auth denials, tenant denials, queue lag, provider failures, webhook failures, and restore tests.

## Test strategy
Admin role matrix, break-glass audit, notification duplicate/failure, secret redaction, incident tabletop, backup restore.

## Acceptance criteria
Every privileged surface has owner, authorization, audit, alert, test, and recovery evidence; no current security weakness is labeled fixed.

## Regression risks
Operational documentation may imply controls that code does not yet enforce.

## Rollback or recovery strategy
Use documented feature disablement, credential rotation, and restore procedures; preserve evidence.

## Documentation updates
Update security audit, monitoring, backup, incident, deployment, and admin feature docs.

## Definition of done
TASK-015 has an auditable operational release gate.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
