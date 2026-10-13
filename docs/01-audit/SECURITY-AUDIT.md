# Security Audit

- **Document ID:** AUDIT-007
- **Status:** IN_REVIEW
- **Last updated:** 2026-10-13

## Critical findings

1. Middleware trusts a client-writable cookie’s presence.
2. Admin SDK operations are not visibly protected by a shared authorization layer.
3. Public `requests` creation is unrestricted in rules.
4. `/api/audit` performs public outbound fetching without documented SSRF/abuse controls.
5. Admin OTPs use weak generation, plaintext storage, and no attempt/rate controls.
6. `firebase-applet-config.json` contains a browser Firebase API key; this is not a server credential, but authorized Firebase restrictions and rules must be verified.
7. `app/api/email/admin-notify/route.ts` has a development secret fallback; production must fail closed.

## Required negative tests
Expired/invalid sessions, unauthorized membership, cross-tenant reads/writes, public field leakage, OTP replay/brute force, assistant tool authorization, request spam, SSRF targets, duplicate mutations, and provider outage recovery. Security completion requires evidence, not only policy text.
