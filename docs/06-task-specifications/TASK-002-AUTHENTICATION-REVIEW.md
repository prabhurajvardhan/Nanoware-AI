# TASK-002 — Authentication Review

- **Document ID:** TASK-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P0
- **Status:** PROPOSED
- **Dependencies:** TASK-001
- **Related requirements:** PR-01; authentication audit
- **Related architecture:** Authentication and authorization
- **Related tests:** Invalid/expired/revoked session; unauthorized membership; OTP replay, brute force, expiry, and rate limit; login/logout regression.

## Objective
Define and verify the boundary between identity, session establishment, route gating, and authorization.

## Problem statement
Current `middleware.ts` checks only the presence of a client-writable `authToken`; this is not proof that a token is valid or that a user belongs to a business.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Review Firebase Auth usage, cookie/session lifecycle, admin OTP actions, protected routes, role/membership lookup requirements, expiration/revocation, rate limiting, and migration constraints.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-001. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `components/AuthProvider.tsx`, `app/login/page.tsx`, `middleware.ts`, `app/admin/auth-actions.ts`, `lib/firebase.ts`, `lib/firebase-admin.ts`, and all server actions/routes using auth.

## Expected files or components to modify
Documentation first. If later implementation is authorized, candidate files must be selected only after TASK-001 evidence; this task must not modify auth code.

## Detailed implementation workflow
1. Trace a signed-in browser event and list every trust decision.
2. Determine whether any server handler verifies an ID token; if absent, record a release blocker.
3. Compare admin OTP generation/storage/expiry/attempt behavior with the intended privileged boundary.
4. Choose between verified per-request tokens and a server session only after documenting trade-offs; do not silently choose a provider behavior.
5. Define role and membership checks separately from authentication.
6. Specify migration and rollback for existing cookies.
7. Add negative-test requirements; stop if identity-provider settings or session ownership are unknown.

## Required behavior
A valid identity is necessary but insufficient: every tenant operation also requires role and resource authorization.

## Data contracts or interfaces
Proposed session context: `{userId, authTime, sessionExpiry, authStrength}` plus a server-resolved membership; exact implementation remains OPEN DECISION.

## Security requirements
HttpOnly/Secure/SameSite strategy, token verification, revocation, OTP hashing/attempt limits, rate limiting, CSRF decision, and Admin SDK authorization are mandatory review items.

## Error handling
Return stable unauthenticated versus forbidden outcomes without revealing resource existence or provider internals.

## Idempotency and retry behavior
OTP/email retries must not extend expiry or permit replay; session refresh behavior requires provider verification.

## Observability requirements
Log auth outcome, actor class, route, correlation ID, and reason code; never log tokens or OTPs.

## Test strategy
Invalid/expired/revoked session; unauthorized membership; OTP replay, brute force, expiry, and rate limit; login/logout regression.

## Acceptance criteria
The authentication document names each trust boundary, current evidence, unresolved provider decisions, and testable remediation criteria; no client indicator is described as authorization.

## Regression risks
Breaking existing login or confusing route redirects with server authorization.

## Rollback or recovery strategy
Keep the legacy route behavior documented; any future session migration needs a feature flag and expiry-based rollback.

## Documentation updates
Update authentication audit, architecture, security audit, and decision log.

## Definition of done
Security reviewers can identify exactly what must be implemented before tenant features.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
