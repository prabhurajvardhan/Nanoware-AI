# Release Acceptance Tests

- **Document ID:** TEST-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Before release: existing route smoke tests pass; signup/login/logout and expiry work; onboarding is idempotent; unknown domain is safe; public projection leaks no private fields; A/B isolation passes; booking conflicts/replays pass; assistant tools authorize independently; usage and webhook replay pass; logs/alerts work; backup restore and rollback drill pass; no secrets or customer data are in the artifact; reviewer signs the security gate.
