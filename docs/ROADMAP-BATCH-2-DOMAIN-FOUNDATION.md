# Roadmap Batch 2 — Domain Foundation

- **Branch:** `roadmap/implementation`
- **Base:** `d80e3e0` plus Batch 1 working changes
- **Status:** Partial implementation; not merged, pushed, or deployed
- **Scope:** T007, T008, T009, T010 provider-independent foundations

## Implemented

- **T007 — Public projection:** `lib/public/projection.mjs` exposes only published profile fields and active service fields. Draft businesses, unpublished records, inactive services, billing, notes, and other private fields are excluded or rejected.
- **T008 — CRM:** `lib/crm/customer.mjs` normalizes email/phone contacts, creates business-local deterministic keys, rejects invalid contacts, and returns a private-role projection without private notes. It does not persist or migrate customer records.
- **T009 — Booking:** `lib/booking/lifecycle.mjs` guards the documented booking state transitions, creates a deterministic business/service/time slot key, and validates bounded idempotency keys. It does not claim Firestore atomic reservation or a product-approved availability policy.
- **T010 — Assistant:** `lib/assistant/tools.mjs` allowlists FAQ, availability, and booking-request tool roles; requires trusted tenant equality and mutation idempotency; and detects common private/system-prompt extraction requests. It does not call a model or provider.

## Evidence

`test/roadmap-domain-foundation.test.mjs` covers public-field leakage, draft isolation, business-local CRM identity, invalid contacts, booking transition and key guards, assistant tenant mismatch, mutation idempotency, and sensitive-request refusal. The combined `npm run test:roadmap` suite passed with 8 tests and 0 failures.

## Task status

T007–T010 are **PARTIAL**, not complete. Full acceptance remains blocked by upstream decisions and infrastructure:

- T007 requires an approved tenant resolver, publication persistence, and hosting/DNS mapping.
- T008 requires approved PII, retention, merge, export/delete, and membership persistence policies.
- T009 requires approved availability/timezone/cancellation policy and a durable conditional reservation implementation.
- T010 requires approved AI provider, retrieval source/retention, rate/budget policy, and a live booking contract.

No provider credentials, model calls, Firestore collections, rules, public routing, booking writes, CRM migration, or production data were changed.
