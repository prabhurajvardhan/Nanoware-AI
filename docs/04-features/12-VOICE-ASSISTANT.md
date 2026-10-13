# Voice Assistant

- **Document ID:** FEAT-12
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
Later-phase voice channel that applies the same tenant, booking, consent, and tool rules as text.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Customer; owner; voice provider; assistant worker

## Preconditions
Explicit voice-phase approval, provider, consent, phone identity policy, assistant contracts.

## Main user journey
Consent -> call/session -> approved question/booking flow -> confirmation/handoff -> retention policy.

## Alternative journeys and failure cases
Caller identity uncertainty, recording consent, prompt injection by speech, provider outage, duplicate booking, emergency/unsupported request.

## Business rules
No booking confirmation without durable authorized tool result; provider failure gives safe handoff.

## State transitions
Session proposed states initiated, consented, active, completed, failed; no current implementation.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Voice transcript/audio is tenant-scoped and high-sensitivity; retention is an OPEN DECISION.

## Authentication and authorization
Voice identity is not automatically owner authorization; tool policy matches text assistant.

## Validation rules
Audio/transcript size, language, time, booking fields, consent, and provider callbacks validated.

## Retry, duplicates, and concurrency
Session/tool event IDs prevent duplicate mutations; reconnect/resume policy OPEN DECISION.

## Observability
Session latency, consent, tool denies, provider errors, redacted outcome metrics.

## Acceptance criteria
Unauthorized voice tool call denied; no recording without consent; duplicate booking prevented.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-010](../06-task-specifications/TASK-010-CUSTOMER-ASSISTANT.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: phase priority, provider, consent/legal, languages, retention, emergency handling.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
