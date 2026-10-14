# Nanoware AI — Batch 2 Security Foundation

- **Branch:** `security/batch2-p0-remediation`
- **Base:** `main` at `0d00b9955948fb1127cdec1ce5ba2df787a21a55`
- **Worktree:** `/home/ubuntu/nanoware-ai-batch2`
- **Status:** **IMPLEMENTED IN ISOLATION; NOT MERGED, PUSHED, OR DEPLOYED**
- **Date:** 2026-10-13

## Scope decision

This batch was authorized to modify application code and add tests. It explicitly prohibits inventing an unapproved tenant schema or performing irreversible migration decisions. The canonical data model remains **DRAFT**: `businesses`, `memberships`, and tenant-owned resources are proposed, while migration from `projects`, `requests`, and `audits` remains unresolved.

Therefore:

- Authentication, privileged operation controls, OTP hardening, SSRF controls, public request validation, audit-report truthfulness, API error safety, and email escaping were implemented.
- The tenant membership/schema foundation was **not implemented**. This is a deliberate architecture gate, not a claim that TENANT-001 is resolved.
- No production data, Firestore tenant collections, migrations, booking/CRM features, or SaaS product features were added.

## Implemented workstreams

### A. Authentication and privileged actions

- Replaced the client-writable `authToken` cookie with a Firebase Admin-created `__session` cookie.
- Session creation verifies the Firebase ID token with revocation checking and creates an HttpOnly session cookie.
- Session cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- Middleware now only performs UX route gating from `__session`; it is explicitly not the authorization boundary.
- Added server utilities for verified session lookup and server-side admin membership checks.
- Admin acceptance action now requires a verified admin actor, resolves the request by trusted request ID, loads recipient data server-side, sends the email, and records the accepting actor.
- Admin notification route now requires a configured bearer secret or verified admin actor, validates bounded fields, and fails closed rather than using `dev-secret`.
- Authentication and server-action errors return stable safe messages rather than raw provider/error text.

### B. OTP hardening

- OTPs use `crypto.randomInt` rather than `Math.random`.
- OTPs are stored only as SHA-256 hashes.
- Challenges use random opaque IDs rather than email-derived document IDs.
- Challenges expire after ten minutes, are limited to five attempts, and are consumed transactionally.
- Resend requests are limited to one per email hash per minute.
- Verification binds the challenge to the verified actor’s email hash.
- OTP values are not logged.
- The admin UI carries a server-issued challenge ID rather than treating `sessionStorage` as proof of authorization.

### C. SSRF and bounded public fetching

- `/api/audit` accepts only HTTP/HTTPS URLs without embedded credentials and applies URL-length bounds.
- Public fetching resolves DNS and rejects private, loopback, link-local, reserved, multicast, and other prohibited IPv4 ranges.
- IPv6 destinations fail closed until an equivalent connection-time policy is implemented.
- The outbound connection is pinned to the screened address rather than allowing a second hostname resolution by ordinary `fetch`.
- Only ports 80 and 443 are accepted.
- Redirects are rejected rather than followed without revalidation.
- Only HTML/XHTML content types are accepted.
- Response size is bounded to 1 MB and request timeout is bounded to ten seconds.
- Internal network details are not returned to public callers.
- The crawler no longer performs a second unrestricted `fetch` after the bounded crawl.

**Remaining limitation:** the endpoint is still synchronous and process-local, and a production-grade distributed rate/concurrency limiter is not present. The implementation is safer and fail-closed for screened destinations, but the endpoint should not be considered fully production-ready until deployment-level abuse controls and durable report ownership are approved.

### D. Public request and audit integrity

- Added `/api/requests` as the validated server boundary for public request intake.
- Public inputs have explicit field lengths, normalized email validation, and bounded idempotency keys.
- Firestore client-side direct creation of `requests` is disabled; public intake now uses the server endpoint.
- Idempotency keys are hashed and bound to a request-data fingerprint; reuse with different data returns `409`.
- Duplicate submissions reuse the original request ID and avoid duplicate notification sends when the prior send is recorded.
- Audit input and optional email are validated with bounded values and safe error responses.
- Missing audit reports now produce a truthful not-found UI instead of fabricated mock data.
- The audit route no longer returns raw exception text.

**Remaining limitation:** audit reports remain process-local and unowned. No production database migration was introduced. A durable persistence/ownership design remains required before claiming API-002 complete in a multi-instance deployment.

### E. Email safety

- Dynamic values in reviewed HTML email templates are escaped for text and attribute contexts, including names, services, details, email addresses, action URLs, and security-code content.
- A reusable security regression suite covers HTML metacharacters and public validation/destination controls.

## Tenant foundation decision

The engineering documents explicitly mark the tenant model as proposed and unresolved. The intended target naming is `memberships`, but there is no verified current membership collection. Implementing `businessId` fields or Firestore rules now would create a competing/incomplete authorization model and could create false isolation confidence.

**TENANT-001 and TENANT-002 remain open.** Before tenant-owned features, approve and implement:

1. Business identity and lifecycle.
2. User-to-business membership uniqueness and roles.
3. Trusted server tenant-context resolution.
4. Resource ownership and public projections.
5. Migration/inventory strategy for `projects`, `requests`, and `audits`.
6. Shared authorization wrappers for all Admin SDK paths.
7. Real cross-tenant read/write/list/nested-resource tests.

## Tests and validation

| Command | Result |
|---|---|
| `npm run test:security` | **PASS** — 4 tests, 0 failures |
| `./node_modules/.bin/eslint .` | **PASS** — exit 0 |
| `./node_modules/.bin/tsc --noEmit` | **PASS** — exit 0 |
| `npm run build` | **PASS** — Next.js 15.5.15 compiled and generated 28 pages |
| `npm audit --omit=dev` | **NON-ZERO / TRIAGE REQUIRED** — 32 production-scope findings: 14 moderate, 15 high, 3 critical |

The security suite uses isolated pure helpers and does not contact internal infrastructure or require production credentials. It currently covers:

- HTML escaping of malicious markup and quotes.
- Public request normalization and invalid-input rejection.
- Private/reserved IPv4 rejection.
- Explicit outbound-port allowlisting.

The full roadmap-required suite remains incomplete for Firebase integration, including actual expired/revoked sessions, unauthorized Admin SDK calls, OTP transaction concurrency, tenant A/B isolation, and API route integration. These must not be reported as passed merely because the helper tests pass.

## Dependency triage

`npm audit --omit=dev` was run without modifying the lockfile or applying `npm audit fix`. The report includes transitive production findings through Firebase/Admin SDK and related packages, including `firebase-admin` via `@google-cloud/storage`, `@grpc/grpc-js`, `@fastify/busboy`, `fast-uri`, `ip-address`, and others. No blind upgrades were made because the repository uses broad ranges and compatibility/breaking-change analysis is still required.

Dependency remediation is a separate decision gate: identify the exact lockfile versions, reachability, minimum compatible fixed versions, and Next.js/Firebase compatibility before changing the lockfile.

## Files changed

- `app/api/auth/session/route.ts`
- `app/api/audit/route.ts`
- `app/api/email/admin-notify/route.ts`
- `app/api/requests/route.ts`
- `app/admin/AdminLogin.tsx`
- `app/admin/actions.ts`
- `app/admin/auth-actions.ts`
- `app/admin/page.tsx`
- `app/audit/[id]/page.tsx`
- `app/contact/page.tsx`
- `components/AuthProvider.tsx`
- `firestore.rules`
- `lib/audit/crawler.ts`
- `lib/auth/server.ts`
- `lib/email/templates.ts`
- `lib/security/safe-fetch.ts`
- `lib/security/validation.mjs`
- `middleware.ts`
- `package.json`
- `test/security-regression.test.mjs`
- `docs/BATCH-2-SECURITY-FOUNDATION.md`

Generated `node_modules` and `tsconfig.tsbuildinfo` artifacts are not part of the implementation and must be removed before commit review.

## Final gate

This branch contains a **safe, isolated security-hardening implementation**, not a completed SaaS security foundation. It must not be merged or deployed until reviewers address:

- The unapproved tenant/membership architecture.
- Durable audit-report ownership and multi-instance behavior.
- Deployment-level rate/concurrency controls for public endpoints.
- Firebase integration tests for actual session/admin/OTP paths.
- Dependency advisory triage and any narrowly scoped compatible fixes.
