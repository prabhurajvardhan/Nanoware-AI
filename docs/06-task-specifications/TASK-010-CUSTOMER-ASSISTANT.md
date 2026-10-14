# TASK-010 — Customer Assistant

- **Document ID:** TASK-010
- **Status:** DRAFT
- **Last updated:** 2026-10-13

- **Priority:** P1
- **Status:** PARTIAL — provider-neutral tool allowlist and tenant/idempotency guards implemented; provider, retrieval, retention, and live booking integration remain open. See [Batch 2 domain foundation evidence](../ROADMAP-BATCH-2-DOMAIN-FOUNDATION.md).
- **Dependencies:** TASK-007, TASK-009
- **Related requirements:** PR-02, PR-03; assistant
- **Related architecture:** Security architecture and API contracts
- **Related tests:** Prompt injection, unauthorized tool call, cross-tenant retrieval, duplicate booking tool call, provider outage, rate limit, and safe escalation.

## Objective
Define an assistant that answers from approved tenant context and invokes only independently authorized tools.

## Problem statement
The current chat widget is UI-only/future integration; no production assistant or tool authorization is verified.

## Evidence and context
The current-state evidence is in the linked audit documents and must be rechecked against the repository at task start. Existing code claims are not inferred from this task file. Target SaaS behavior is PROPOSED unless a source and passing test demonstrate otherwise.

## Scope
Define context retrieval, prompt-injection handling, booking handoff, tool allowlist, budgets, refusal/escalation, transcript privacy, and model/provider open decisions.

## Explicit non-goals
Do not implement unrelated product features, change Firebase rules, modify application code during this documentation refactor, select an unapproved provider, or invent exact paths/symbols absent from repository evidence.

## Prerequisites
Complete the listed dependencies, confirm the branch/status, read the relevant audit and architecture documents, and establish the available pinned validation commands. If a prerequisite is absent or contradictory, stop and document the blocker.

## Dependencies
TASK-007, TASK-009. Dependency edges are validated against [the dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md).

## Files or components to inspect
Inspect `components/GlobalChatWidget.tsx`, any model imports, audit data types, public page context, and booking APIs.

## Expected files or components to modify
Assistant feature/security/API docs; no model integration or prompt code.

## Detailed implementation workflow
1. Confirm whether current UI sends messages to a backend; if absent, document it as a future integration.
2. Define tenant context boundary from trusted business resolver, not conversation claims.
3. Separate retrieval from tool authorization; model output never grants permission.
4. Define tools (availability lookup, booking request, FAQ only) with input schemas and role/context checks.
5. Define injection/refusal, rate/budget, sensitive-data, and human-escalation paths.
6. Define transcript retention/redaction and provider selection as OPEN DECISIONS.
7. Test tool calls using forged business IDs and role claims before any implementation.

## Required behavior
The assistant may answer approved public facts and collect booking details; it must refuse private data and unauthorized mutations.

## Data contracts or interfaces
Proposed message `{conversationId?, text, channelContext}` and tool result envelope; model/provider and streaming choice are OPEN DECISIONS.

## Security requirements
Tool authorization is server-side and independent of model output; prompt content is untrusted; secrets/system prompts/private CRM are never exposed.

## Error handling
Rate limit, provider timeout, unsafe request, insufficient context, and tool conflict produce safe responses and optional human handoff.

## Idempotency and retry behavior
Message and tool idempotency keys prevent duplicate booking requests; model retries cannot repeat a mutation without a tool key.

## Observability requirements
Log model/provider latency, refusal/tool-deny codes, token/budget class, and correlation ID; redact prompts and PII.

## Test strategy
Prompt injection, unauthorized tool call, cross-tenant retrieval, duplicate booking tool call, provider outage, rate limit, and safe escalation.

## Acceptance criteria
Every assistant tool has an authorization predicate, schema, retry rule, and negative test; current UI is not mislabeled as an implemented assistant.

## Regression risks
Model prompt injection, data exfiltration, duplicate booking, and unbounded cost.

## Rollback or recovery strategy
Disable assistant entry point/tools while preserving direct booking/public page paths; retain audit evidence.

## Documentation updates
Update assistant, security, API, booking, and operations docs.

## Definition of done
Assistant implementation can be bounded by explicit tool contracts.

## Completion report
Record changed files, evidence reviewed, commands/tool versions/exit codes, tests and results, security findings, unresolved decisions, rollback notes, and reviewer status.
