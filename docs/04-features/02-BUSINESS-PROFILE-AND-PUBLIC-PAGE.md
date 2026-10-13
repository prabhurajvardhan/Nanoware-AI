# Business Profile and Public Page

- **Document ID:** FEAT-02
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Owners publish an allowlisted, tenant-scoped business profile at a trusted route.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Public visitor; member; owner; routing resolver

## Preconditions
Active verified host mapping, business configured, profile passes validation.

## Main user journey
Owner edits draft -> previews -> publishes version -> visitor reads public projection.

## Alternative journeys and failure cases
Unpublish, suspended business, unknown host, draft-only state, and cache miss/outage.

## Business rules
Publication version, resolver outcome, cache key, and projection errors.

## State transitions
draft -> published; published -> unpublished/superseded; suspended blocks public output.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Public projection is an explicit allowlist; CRM, notes, private bookings, billing, and conversations never appear.

## Authentication and authorization
Public read needs no membership but uses trusted host resolver; owner mutations require membership/owner role.

## Validation rules
Validate contact URLs, text sizes, published service references, and host mapping.

## Retry, duplicates, and concurrency
Publish/unpublish idempotent; cache invalidation repeatable.

## Observability
Public read latency, unknown host rate, publication failures, cache isolation alerts.

## Acceptance criteria
A visitor from host A sees only A’s published fields; draft and private fields are inaccessible.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-007](../06-task-specifications/TASK-007-PUBLIC-PAGE-AND-SERVICES.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: custom domains, DNS verification, exact public fields, legal pages.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
