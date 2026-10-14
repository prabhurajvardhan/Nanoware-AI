# Nanoware AI — Batch 3 Security Hardening Report

- **Branch:** `security/batch3-hardening`
- **Base:** Batch 2.2 commit `f2926b6`
- **Status:** Implementation complete; ready for review; not merged or deployed

## Confirmed fixes

### MFA enforcement

The suspected bypass was confirmed: Firebase session creation occurred before OTP, while `requireAdminActor()` checked only the global admin record. The client’s `sessionStorage` flag was not an authorization boundary, and the admin page also read request records directly from client Firestore.

Implemented:

- Added a server-issued, HttpOnly, 12-hour MFA session cookie backed by `admin_mfa_sessions/{hash}`.
- Successful OTP verification creates the server MFA session; invalid, expired, replayed, or incorrect OTPs do not.
- MFA-required server boundaries now include admin acceptance actions, admin request listing, and admin notification API access.
- Moved admin request listing to `/api/admin/requests`, protected by `requireAdminActor({ requireMfa: true })`.
- Denied client Firestore reads of sensitive `requests` records.
- Preserved OTP expiry, attempt limits, resend controls, and server-side admin lookup.
- Admin account switching and logout clear both the Firebase session cookie and MFA cookie.

### Audit report privacy

- Removed the unauthorised global recent-audit listing.
- Audit creation now issues a 256-bit random share token.
- Firestore stores only the SHA-256 token hash.
- Individual report retrieval requires the high-entropy share token and uses timing-safe comparison.
- Missing, invalid-token, incomplete, or legacy records return 404 rather than report data.
- The generated share link remains compatible with the report UI through `?share=...`; raw share tokens are not stored in Firestore.

This is the safest compatible behavior for the previously ambiguous anonymous-sharing flow. A future owner decision is still required for retention, revocation, ownership, and authenticated-owner semantics.

### Rate-limit and concurrency correctness

- Audit and public-request routes now acquire concurrency slots inside `try` blocks.
- Release callbacks are optional until acquisition succeeds and are idempotent.
- Saturation returns the intended 429 response with `Retry-After` rather than escaping before route handling.
- The pure concurrency/429 implementation is isolated in `lib/security/concurrency.mjs` so it executes under the configured Node strip-only test runtime.
- Existing trusted-proxy behavior remains opt-in; spoofable forwarded headers are not trusted by default.

### Session revocation semantics

Logout now clears only the current browser’s session and MFA cookies. It no longer calls Firebase `revokeRefreshTokens`, which invalidated every refresh-derived session for the user. The current cookie is removed securely; global account-wide logout remains a separate product/security decision.

### Duplicate acceptance side effects

Admin acceptance now claims a request atomically in a Firestore transaction before sending the email:

- `sending` claims block concurrent acceptance actions.
- `sent`/accepted requests are idempotent successes.
- Email failure records `failed` and permits recovery/retry.
- The implementation does not claim exactly-once provider delivery: if the provider succeeds but the final Firestore update fails, an operator/provider idempotency mechanism is still required.

## Changed files and subsystems

- `lib/auth/server.ts`
- `app/admin/auth-actions.ts`
- `app/admin/actions.ts`
- `app/admin/page.tsx`
- `app/admin/AdminLogin.tsx`
- `app/api/admin/requests/route.ts`
- `app/api/email/admin-notify/route.ts`
- `app/api/auth/session/route.ts`
- `app/api/audit/route.ts`
- `app/audit/[id]/page.tsx`
- `lib/firebase/auditService.ts`
- `firestore.rules`
- `app/api/requests/route.ts`
- `lib/security/rate-limit.ts`
- `lib/security/concurrency.mjs`
- `test/batch3-regression.test.mjs`
- `package.json`

## Validation executed

| Check | Result |
|---|---|
| `npm run test:security` | **PASS** — 10 tests, 0 failures |
| `npm run lint` | **PASS** |
| `npx tsc --noEmit --pretty false --incremental false` | **PASS** |
| `npm run build` | **PASS** — Next.js 15.5.27, 29 pages generated |
| `git diff --check` | **PASS** |
| `npm audit --omit=dev` | **NON-ZERO** — 21 findings: 0 critical, 12 high, 9 moderate |

The regression suite directly verifies safe-fetch boundaries and local concurrency saturation/cleanup/429 behavior. Firebase Emulator integration is not configured, so live MFA cookie issuance, Firestore authorization, transaction contention, provider failure recovery, and cross-user audit-token access remain integration-unverified.

## Remaining risks and decisions

1. **Firebase integration coverage:** Configure an isolated Firebase Emulator test harness before claiming live MFA, Firestore rules, transaction, or durable audit behavior.
2. **Audit ownership and lifecycle:** Approve authenticated ownership, token revocation, retention/expiry, and migration policy. Current anonymous access is token-based and intentionally does not invent a tenant model.
3. **Email delivery semantics:** Add provider-side idempotency or an outbox/worker if exactly-once external delivery is required. Current state machine prevents concurrent claims but cannot undo an external send if the final write fails.
4. **Rate limiting:** Firestore counters and local concurrency are bounded protections. Production IP-specific controls require a controlled proxy chain and `TRUSTED_PROXY_IP_HEADER=x-forwarded-for`; a higher-scale limiter would require infrastructure approval.
5. **Dependency audit:** 21 transitive/nested findings remain, with zero critical findings. Parent-package releases or separate compatibility review are still required for the remaining high/moderate advisories.

No production data, secrets, infrastructure, deployment, merge, or tenant migration was changed.
