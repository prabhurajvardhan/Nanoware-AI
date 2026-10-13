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


## Finding register

| ID | Status/evidence | Impact | Recommended remediation | Required regression tests | Current remediation status |
|---|---|---|---|---|---|
| SEC-F01 | **VERIFIED weakness:** `middleware.ts` checks `authToken` cookie presence only. | Expired/forged cookie may reach protected UI routes. | Verify token/server session at the authorization boundary. | Invalid, expired, revoked session. | **OPEN; design documented, code unchanged.** |
| SEC-F02 | **VERIFIED weakness:** `AuthProvider` writes a client-writable non-HttpOnly cookie. | Client can assert route-gating state; XSS/session exposure risk. | Adopt reviewed Secure/HttpOnly session strategy and CSRF controls. | Cookie tamper, logout, expiry, CSRF. | **OPEN.** |
| SEC-F03 | **VERIFIED weakness:** Admin OTP uses `Math.random`, plaintext Firestore storage, email-keyed ID, and no attempt limit. | Brute force/replay and privileged access risk. | Cryptographic OTP, hash-at-rest, attempt/rate limits, one-time expiry, audit. | Replay, brute force, expiry, concurrent verify. | **OPEN.** |
| SEC-F04 | **VERIFIED exposure:** `requests` create is allowed publicly without visible schema/rate validation in rules. | Spam, oversized/malicious data, abuse. | Server validation, abuse controls, bounded writes, reviewed rule/service path. | Fuzz, rate, oversized, duplicate request. | **OPEN.** |
| SEC-F05 | **VERIFIED design risk:** Admin SDK helper bypasses Firestore rules. | Unauthorized server-side reads/writes if callers omit policy. | Central authorization wrapper and audit for Admin SDK operations. | Cross-tenant Admin SDK attempts. | **OPEN.** |
| SEC-F06 | **VERIFIED design risk:** `/api/audit` performs public outbound fetches and uses process memory. | SSRF/DoS and non-durable results. | SSRF egress policy, limits, rate controls, durable job/storage design. | Private IP, redirect, size, timeout, concurrent abuse. | **OPEN.** |

Recommended designs in architecture documents do not fix these findings; only code plus passing regression evidence can change status.


## Finding register

| ID | Status/evidence | Impact | Recommended remediation | Required regression tests | Current remediation status |
|---|---|---|---|---|---|
| SEC-F01 | **VERIFIED weakness:** `middleware.ts` checks `authToken` cookie presence only. | Expired/forged cookie may reach protected UI routes. | Verify token/server session at the authorization boundary. | Invalid, expired, revoked session. | **OPEN; design documented, code unchanged.** |
| SEC-F02 | **VERIFIED weakness:** `AuthProvider` writes a client-writable non-HttpOnly cookie. | Client can assert route-gating state; XSS/session exposure risk. | Adopt reviewed Secure/HttpOnly session strategy and CSRF controls. | Cookie tamper, logout, expiry, CSRF. | **OPEN.** |
| SEC-F03 | **VERIFIED weakness:** Admin OTP uses `Math.random`, plaintext Firestore storage, email-keyed ID, and no attempt limit. | Brute force/replay and privileged access risk. | Cryptographic OTP, hash-at-rest, attempt/rate limits, one-time expiry, audit. | Replay, brute force, expiry, concurrent verify. | **OPEN.** |
| SEC-F04 | **VERIFIED exposure:** `requests` create is allowed publicly without visible schema/rate validation in rules. | Spam, oversized/malicious data, abuse. | Server validation, abuse controls, bounded writes, reviewed rule/service path. | Fuzz, rate, oversized, duplicate request. | **OPEN.** |
| SEC-F05 | **VERIFIED design risk:** Admin SDK helper bypasses Firestore rules. | Unauthorized server-side reads/writes if callers omit policy. | Central authorization wrapper and audit for Admin SDK operations. | Cross-tenant Admin SDK attempts. | **OPEN.** |
| SEC-F06 | **VERIFIED design risk:** `/api/audit` performs public outbound fetches and uses process memory. | SSRF/DoS and non-durable results. | SSRF egress policy, limits, rate controls, durable job/storage design. | Private IP, redirect, size, timeout, concurrent abuse. | **OPEN.** |

Recommended designs in architecture documents do not fix these findings; only code plus passing regression evidence can change status.

## Required negative tests

Invalid/expired sessions, unauthorized membership, cross-tenant reads/writes, public field leakage, OTP replay/brute force, assistant tool authorization, request spam, SSRF targets, duplicate mutations, and provider outage recovery. Security completion requires evidence, not only policy text.
