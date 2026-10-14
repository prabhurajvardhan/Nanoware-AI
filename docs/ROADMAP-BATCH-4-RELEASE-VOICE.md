# Roadmap Batch 4 — Release and Voice Foundation

- **Branch:** `roadmap/implementation`
- **Status:** Partial implementation; pushed in PR #8, not merged or deployed
- **Scope:** T015 and derived T016

## Implemented

- **T015 — Production validation:** `lib/release/readiness.mjs` evaluates release gates conservatively. A missing/invalid gate is `UNVERIFIED`; any `FAIL`, `UNVERIFIED`, or `PARTIAL` gate prevents readiness. It does not claim staging/production evidence.
- **T016 — Voice:** The repository had no T016 specification, so it was derived from `docs/04-features/12-VOICE-ASSISTANT.md`. `lib/voice/contract.mjs` requires consent, binds a session to a business, allowlists text-equivalent tools, and requires an event ID. It does not integrate a provider, record audio, or claim caller identity.

## Evidence

`test/roadmap-release-voice.test.mjs` covers conservative release-gate status and voice consent, tenant mismatch, tool allowlisting, and event identity. The full `npm run test:roadmap` suite passed with 14 tests and 0 failures after this batch.

## Status and blockers

T015 and T016 are **PARTIAL**. T015 remains unverified until authorized staging/production ownership, provider endpoints, secrets, backups, restore, rollback, monitoring, and release approvals exist. T016 remains blocked on voice-phase approval, provider selection, consent/legal policy, languages, retention, emergency handling, and phone identity policy.

No deployment, provider credential, DNS record, production data, audio, transcript, or production configuration was changed.
