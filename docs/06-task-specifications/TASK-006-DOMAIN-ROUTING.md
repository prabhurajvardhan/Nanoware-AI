# TASK-006 — Domain Routing

- **Document ID:** TASK-006
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PARTIAL — provider-neutral host normalization/classification implemented; DNS mapping and hosting approval remain open. See [Batch 1 foundation evidence](../ROADMAP-BATCH-1-FOUNDATION.md).
- **Dependencies:** TASK-005
- **Related requirements:** PR-02; domain routing
- **Related architecture:** Domain and subdomain routing
- **Related tests:** Unknown host, suspended business, duplicate mapping, cache isolation, preview privacy, and custom-domain verification.

## Objective
Resolve a verified business URL to exactly one published tenant without trusting arbitrary host input.

## Problem statement
The proposed `business.nanowareai.in` domain and DNS ownership are unverified; no current tenant routing implementation exists.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define host normalization, slug/custom-domain verification, unknown/suspended states, preview behavior, cache keys, and ownership workflow.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-005. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `middleware.ts`, Next route structure, `next.config.ts`, and any domain references; do not assume a hosting provider.

## Expected files or components to modify
Routing architecture and feature docs only until DNS/hosting is verified.

## Detailed implementation workflow
1. Confirm whether current routes inspect the host; current audit indicates no verified tenant routing.
2. Separate platform host, business slug, custom domain, and preview URL.
3. Define mapping lifecycle and domain verification challenge.
4. Specify unknown, unverified, suspended, and unpublished responses.
5. Define cache key as normalized host plus published version and test cross-tenant cache poisoning.
6. Record DNS/hosting as OPEN DECISION and stop before provider-specific commands.

## Required behavior
Only an active, published, verified mapping may render public business data.

## Data contracts or interfaces
Proposed resolver output `{businessId, publicationVersion, status}`; host input is a selector, not proof of membership.

## Security requirements
Reject lookalike/invalid hosts, prevent host-header injection, and isolate caches.

## Error handling
Unknown host 404; unverified/suspended host safe non-public response; dependency outage 503 without stale private data.

## Idempotency and retry behavior
Domain verification and mapping updates are idempotent; cache invalidation is repeatable.

## Observability requirements
Log normalized host hash, resolution result, publication version, and latency without unnecessary visitor data.

## Test strategy
Unknown host, suspended business, duplicate mapping, cache isolation, preview privacy, and custom-domain verification.

## Acceptance criteria
Routing behavior and open infrastructure decisions are explicit; no production DNS claim is made.

## Regression risks
Publishing a business under an attacker-controlled domain or serving stale tenant content.

## Rollback or recovery strategy
Disable mapping/publication and purge affected cache according to verified provider procedure.

## Documentation updates
Update routing, public page, deployment audit, and decision log.

## Definition of done
TASK-007 can use a trusted public tenant resolver.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
