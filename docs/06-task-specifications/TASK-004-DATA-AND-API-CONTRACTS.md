# TASK-004 — Data and API Contracts

- **Document ID:** TASK-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PARTIAL — generic envelope/correlation foundation implemented; endpoint schemas remain dependent on tenant/provider decisions. See [Batch 1 foundation evidence](../ROADMAP-BATCH-1-FOUNDATION.md).
- **Dependencies:** TASK-001, TASK-003
- **Related requirements:** PR-02–PR-06; API contracts
- **Related architecture:** Data model and API contracts
- **Related tests:** Schema fixtures, contract snapshots, auth matrix, duplicate mutation, malformed JSON, size/rate limits, and safe-error tests.

## Objective
Freeze versioned validation, error, projection, and idempotency contracts before feature implementation.

## Problem statement
Existing routes accept ad-hoc JSON and expose implementation-dependent errors; target workflows need stable contracts and safe public projections.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define schemas for business/public/service/booking/assistant/usage/billing boundaries, error envelope, correlation IDs, idempotency semantics, pagination, and provider adapters.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-001, TASK-003. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect existing `app/api/*/route.ts`, server actions, `lib/audit/types.ts`, email actions, and client fetch callers.

## Expected files or components to modify
Architecture/API docs and contract fixtures; implementation paths remain candidates until code inspection confirms them.

## Detailed implementation workflow
1. Catalogue existing route inputs/outputs and mark them CURRENT, not target contracts.
2. For each proposed endpoint, define caller, auth, tenant resolution, schema, response projection, status codes, and idempotency scope.
3. Define one error envelope with safe public messages and internal correlation ID.
4. Decide whether duplicate keys return the original result or a conflict; document retention.
5. Add contract examples for valid, invalid, unauthorized, conflict, and provider failure paths.
6. If an existing route cannot adopt the contract without breaking callers, document an adapter/versioning path.
7. Validate examples against schemas once a pinned validation library is confirmed.

## Required behavior
No public endpoint trusts plan, role, business ID, or model output supplied by a client.

## Data contracts or interfaces
Proposed `{data,requestId}` success and `{error:{code,message,retryable,requestId},data:null}` error envelopes; endpoint-specific schemas are documented per feature.

## Security requirements
Reject over-posting, sensitive fields, unsafe URLs, and unbounded payloads; public output is an allowlist.

## Error handling
Validation 400, unauthenticated 401, forbidden 403, not-found 404, conflict 409, rate-limit 429, dependency 502/503, internal 500.

## Idempotency and retry behavior
Mutation keys and provider event IDs define replay behavior; only documented idempotent operations retry.

## Observability requirements
Every request has a correlation/request ID and outcome code; payload logging is minimized.

## Test strategy
Schema fixtures, contract snapshots, auth matrix, duplicate mutation, malformed JSON, size/rate limits, and safe-error tests.

## Acceptance criteria
All target feature docs reference a concrete contract or an explicit OPEN DECISION; no endpoint is presented as current unless verified.

## Regression risks
Over-designing provider details before provider selection.

## Rollback or recovery strategy
Version contracts and retain adapters; do not change existing routes in this documentation task.

## Documentation updates
Update API contracts, data model, feature docs, and decision log.

## Definition of done
Feature implementation can proceed without inventing request/response semantics.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
