# TASK-001 — Baseline Audit

- **Document ID:** TASK-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PROPOSED
- **Dependencies:** none
- **Related requirements:** All product requirements; all current-state audits
- **Related architecture:** Repository boundaries and evidence protocol
- **Related tests:** Run inventory checks, Markdown-link checks, and the repository-pinned lint/typecheck/build commands only if dependencies are installed from the lockfile. Do not add application tests in this audit task.

## Objective
Produce a reproducible, evidence-backed baseline of the repository before any product transformation.

## Problem statement
The repository is a Next.js/Firebase application with no verified automated test suite, while the target SaaS is only proposed. Implementation agents need a current inventory and must not mistake roadmap language for existing behavior.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Inspect root files, routes, components, hooks, libraries, auth flows, Firebase client/Admin setup, Firestore rules, API handlers, environment examples, tests, CI, deployment files, and existing documentation. Record source symbols and command results.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
none. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, ESLint config, `.env.example`, `app/`, `components/`, `lib/`, `middleware.ts`, `firebase-applet-config.json`, `firestore.rules`, and `.github/` if present.

## Expected files or components to modify
Documentation audit files only: `docs/01-audit/*`, `docs/FINAL-DOCUMENTATION-AUDIT.md`, and the master index. Do not select application files for implementation.

## Detailed implementation workflow
1. Record `git status`, branch, commit, Node/npm versions, and whether `node_modules` exists.
2. Inventory files and map each route to its imports and persistence calls.
3. Trace auth from `AuthProvider`/login through middleware and server actions; distinguish cookie routing from authorization.
4. Trace every Firestore client/Admin call and compare it with rules.
5. Read scripts and lockfile; if dependencies are absent, either run `npm ci` using the lockfile or record why environment policy prevents it. Never use an arbitrary latest `npx` compiler as the project baseline.
6. Run only repository-pinned commands available after step 5; record command, tool version, exit code, and reproducibility.
7. If a claimed component is absent, mark it UNVERIFIED and document the missing evidence rather than creating it. If source contradicts a document, correct the document and open a decision.
8. Finish with findings, impact, recommended follow-up tasks, and a completion report.

## Required behavior
The result is an audit record, not a product implementation. Every finding has evidence, classification, impact, and follow-up.

## Data contracts or interfaces
Not applicable — this task establishes evidence rather than a runtime contract.

## Security requirements
Identify auth, Admin SDK, public endpoint, secret, SSRF, and tenant-boundary risks; do not remediate them in this task.

## Error handling
If inspection or a command fails, preserve the failure and classify it; do not convert absence of evidence into a passing result.

## Idempotency and retry behavior
Not applicable — read-only inspection should be rerunnable and timestamped.

## Observability requirements
Record command output summaries, commit, environment versions, and source paths; redact secrets and customer data.

## Test strategy
Run inventory checks, Markdown-link checks, and the repository-pinned lint/typecheck/build commands only if dependencies are installed from the lockfile. Do not add application tests in this audit task.

## Acceptance criteria
Every required repository area has a verified, inferred, unverified, or proposed status; current routes and data paths are cited; command evidence is reproducible or explicitly unavailable; no application file changes occur.

## Regression risks
Agents may overclaim from filenames, confuse Admin SDK access with rules protection, or report TypeScript 6 behavior as the project baseline.

## Rollback or recovery strategy
Revert only documentation changes from this task; no data or application rollback is applicable.

## Documentation updates
Update all affected audit documents, master index status, and decision log.

## Definition of done
Audit evidence is reviewed, discrepancies are recorded, and TASK-002 can begin without guessing.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
