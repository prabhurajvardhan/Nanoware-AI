# Customer Assistant

- **Document ID:** FEAT-06
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Purpose
An assistant answers approved public business questions and safely collects booking details.

## Current implementation status
**PROPOSED target feature.** The current repository evidence is documented in the audits; related UI/helpers do not prove this feature is implemented.

## Actors and permissions
Public visitor; customer; owner escalation; assistant worker

## Preconditions
Trusted business context, approved knowledge, rate/budget policy, booking contract.

## Main user journey
Ask -> retrieve approved facts -> answer or clarify -> collect details -> invoke authorized booking request tool or hand off.

## Alternative journeys and failure cases
Prompt injection, private-data request, tool denial, provider timeout, hallucination/unknown answer, duplicate tool call.

## Business rules
Safe refusal and escalation; provider failures do not create bookings.

## State transitions
conversation active -> escalated/closed; tool calls have independent event status.

## Inputs and outputs
Inputs and outputs must follow the versioned schemas in [API contracts](../03-architecture/API-CONTRACTS.md). Do not accept client role, plan, or tenant ID as proof.

## Data ownership and tenant boundaries
Tenant context comes from resolver, not message content; CRM/private notes are never part of public context.

## Authentication and authorization
Model output never authorizes a tool; server policy checks actor, business, tool, and payload.

## Validation rules
Input size, rate, sensitive data, tool schema, and booking fields validated.

## Retry, duplicates, and concurrency
Message/tool idempotency prevents duplicate booking mutations; model retry is read-only unless tool key is reused.

## Observability
Redacted latency/refusal/tool-denial/budget metrics.

## Acceptance criteria
Injection cannot reveal prompts or private data; unauthorized tool call denied; duplicate booking tool call is one mutation.

## Negative test cases
- Expired/invalid session or missing membership is denied.
- Business A cannot read, list, mutate, or infer business B data.
- Public output contains only approved fields.
- Malformed input, replay, rate exhaustion, dependency outage, and partial failure are safe and observable.
- Existing routes remain covered by regression tests.

## Dependencies on other features
See [TASK-010](../06-task-specifications/TASK-010-CUSTOMER-ASSISTANT.md) and the [task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Open decisions
Open: provider, retrieval, retention, streaming, human handoff.

## Implementation status and evidence
No target behavior in this document should be marked implemented until code, tests, and operational evidence exist.
