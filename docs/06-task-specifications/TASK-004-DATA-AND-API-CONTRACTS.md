# TASK-004 — Data and API Contracts

- **Status:** PROPOSED
- **Priority:** P0
- **Dependencies:** TASK-001,TASK-003
- **Related requirements:** PR-02..PR-06
- **Related architecture:** Data model, API contracts
- **Related tests:** Contract tests

## Objective
Freeze versioned schemas, error envelopes, idempotency, and public projections.

## Evidence / Current State
Use the verified facts in the linked audits. Re-inspect the current tree before coding; planned locations are candidates, not guarantees. Record changed symbols and test evidence.

## Scope
Define DTOs, validation, status codes, correlation IDs, and provider adapter boundaries.

## Non-goals
Do not redesign unrelated UI, alter production configuration without approval, or implement later features opportunistically.

## Implementation Plan
1. Confirm current implementation and dependency assumptions.
2. Define schema, policy, errors, observability, and migration/rollback behavior.
3. Implement the smallest change in confirmed locations.
4. Add positive, negative, idempotency, and regression tests.
5. Run available lint/typecheck/build/test commands and record exact results.
6. Update linked docs and this task’s completion report.

## Security and Data Impact
Enforce server-side authorization and canonical `businessId`; consider privacy, retention, migration, replay, rate limits, and Admin SDK bypass of rules.

## Acceptance Criteria
- Behavior is observable and matches the objective.
- Unauthorized, cross-tenant, invalid, expired/replayed, and dependency-failure cases are rejected safely.
- Tests pass and no unrelated application code changed.
- Docs, links, logs, migration notes, and rollback steps are complete.

## Tests
Unit, integration, security, and regression coverage appropriate to the change. If no test command exists, establish it as part of TASK-001 and record the command.

## Documentation Updates
Update the linked requirement, architecture, feature, test, and audit documents with verified implementation status.

## Rollback / Recovery
Disable the feature or revert the application artifact using the verified deployment process; preserve compatible data and follow the migration rollback plan.

## Completion Report
The implementer must record changed files, schema/data actions, commands and results, security evidence, unresolved failures, documentation updates, reviewer, and final status.
