# TASK-016 — Voice Assistant

- **Document ID:** TASK-016
- **Status:** DRAFT
- **Last updated:** 2026-10-14
- **Priority:** P2
- **Status:** PARTIAL — provider-neutral consent/session/tool contract implemented; provider and legal decisions remain open. See [Roadmap Batch 4 release and voice foundation](../ROADMAP-BATCH-4-RELEASE-VOICE.md).
- **Dependencies:** TASK-010
- **Related requirements:** PR-02, PR-03; voice assistant feature
- **Related architecture:** API contracts, security architecture, and error recovery
- **Related tests:** Consent, caller/session identity, unauthorized tool call, cross-tenant access, duplicate booking event, provider outage, recording/retention policy, and safe handoff.

## Objective
Define and safely bound a later-phase voice channel that follows the text assistant’s tenant, booking, consent, and tool authorization rules.

## Scope
Implement provider-neutral session and consent contracts, voice event identity, tool authorization guards, and release gating. Do not integrate a voice provider until phase approval, legal consent, phone identity, language, recording, and retention decisions are approved.

## Required behavior
No voice recording or tool mutation occurs without explicit consent and a trusted business context. Voice identity is not owner authorization. Booking mutations require the same independently authorized server tool path as text.

## Data contracts
A voice session includes `sessionId`, trusted `businessId`, consent state, and one of `initiated`, `consented`, `active`, `completed`, or `failed`. Tool events require a session, business match, allowlisted tool, and unique event ID. Audio/transcript fields are high-sensitivity and must not be logged by default.

## Security and privacy
Reject cross-tenant tool calls, unsupported tools, missing consent, expired/invalid sessions, and duplicate mutation events. Never expose prompts, secrets, private CRM data, or unredacted audio/transcripts. Provider callbacks require verification after provider selection.

## Acceptance criteria
A provider-independent test proves consent is required, tenant mismatch is denied, unsupported tools are denied, and authorized event IDs are returned without claiming provider delivery. Provider integration, recording retention, emergency handling, and legal approval remain `UNVERIFIED` or `OPEN` until supplied.

## Rollback
Disable the voice entry point and preserve text/public booking paths. Do not delete audio/transcript data during rollback; use the approved retention and incident procedure once defined.
