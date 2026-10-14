# Nanoware AI — Batch 2.1 Security Verification Report

- **Branch:** `security/batch2-p0-remediation`
- **Base commit:** `0d00b9955948fb1127cdec1ce5ba2df787a21a55`
- **Worktree:** `/home/ubuntu/nanoware-ai-batch2`
- **Verification date:** 2026-10-13
- **Status:** **VERIFIED IN ISOLATION; NOT COMMITTED, PUSHED, MERGED, OR DEPLOYED**

## 1. Executive summary

Batch 2.1 independently reviewed the Batch 2 security implementation, re-ran the dependency audit, added direct tests against the outbound-fetch boundary, prepared the tenant architecture for approval, and designed durable audit persistence and distributed abuse controls. The application is **not production-ready** and this branch must not be merged or deployed yet.

The Batch 2 implementation correctly moved sensitive operations toward server-verifiable Firebase sessions, fail-closed admin authorization, bounded public fetching, validated request intake, and truthful missing-audit behavior. This verification also found and corrected two material gaps: session-route bodies were parsed before a hard byte limit, and public-request idempotency could report ordinary success while notification delivery was still claimed or unresolved. Logout now attempts Firebase refresh-token revocation before clearing the session cookie.

The branch still lacks real Firebase Emulator or deployed Firebase integration tests. The tenant model remains a **proposal**, not an implemented authorization guarantee. Audit reports remain process-local. Public endpoint rate limiting and crawler concurrency controls remain design work. Dependency remediation reduced the production audit count from **32 to 23**, but 23 findings remain, including **2 critical** transitive findings.

## 2. Current-state safety checkpoint

The declared branch and worktree matched the task context:

- `security/batch2-p0-remediation`
- `/home/ubuntu/nanoware-ai-batch2`
- HEAD remained the audited base commit `0d00b99`; all implementation work is uncommitted in the isolated worktree.
- `/home/ubuntu/nanoware-ai-batch1` remains a clean `main` worktree.
- `/home/ubuntu/Nanoware-AI` remains on `docs/nanoware-engineering-foundation` with only its previously preserved untracked `docs/BATCH-1-AUDIT-REPORT.md`.
- No merge, rebase, push, deploy, production-data operation, secret modification, or destructive cleanup was performed.
- `AGENTS.md` was not present in the Batch 2 worktree; this is recorded as an environment limitation rather than inferred away.
- `.next` existed from the prior Batch 2 build and is a generated artifact. It is eligible for removal at final cleanup; no user-owned source file is treated as generated.

The current implementation worktree intentionally contains the Batch 2 source changes plus the Batch 2 and Batch 2.1 reports. The original documentation branch and `main` were not used as write targets.

## 3. Findings register

| ID | Current finding | Classification | Result |
|---|---|---|---|
| AUTH-001 | Cookie presence must not prove identity. | Implemented; partially integration-tested | `__session` is HttpOnly and created only after Admin SDK ID-token verification. Protected server helpers verify the session cookie with revocation checking. Middleware remains UX-only. Actual Firebase forged/expired/revoked-token execution is not exercised without emulator/credentials. |
| AUTH-002 | Admin privilege must be server-resolved. | Implemented; not Firebase integration-tested | Admin actions call `requireAdminActor`, load `admins/{uid}` server-side, and resolve request recipient data by trusted request ID. Client flags and caller-supplied recipient fields no longer authorize the operation. |
| AUTH-003 | OTPs require secure generation, hashing, limits, and atomic consumption. | Implemented; not Firebase integration-tested | `crypto.randomInt`, SHA-256 hash-only storage, opaque challenges, ten-minute expiry, five-attempt limit, resend window, actor binding, and Firestore transaction consumption are present. Concurrent emulator verification remains unverified. |
| AUTH-004 | Authentication errors must be safe. | Implemented | Public/session/admin paths use stable generic messages and log only redacted reason text. |
| TENANT-001 | No approved business/membership/tenant context exists. | Proposed; blocked by approval | No `businessId`, membership collection, tenant rules, or migration was added. The architecture proposal below is approval-ready but not canonical. |
| TENANT-002 | Admin SDK calls need application authorization. | Partially implemented; tenant boundary blocked | Current admin-sensitive helpers use verified actor/admin checks. A complete tenant repository/policy boundary cannot be implemented until the membership model is approved. |
| TENANT-003 | Public request intake needs validation, idempotency, and abuse controls. | Partially implemented | Runtime bounds, normalized email, server persistence, idempotency conflict detection, and truthful processing responses are implemented. Distributed rate limiting and external-side-effect exactly-once semantics remain open. |
| API-001 | Public crawler needs SSRF and bounded-resource controls. | Implemented for screened synchronous fetch; production abuse controls open | DNS addresses are screened, IPv4 destinations are pinned to the connection, IPv6 fails closed, ports/schemes/redirects/content type/size/time are bounded. Distributed concurrency/rate controls and a background execution boundary remain open. |
| API-002 | Audit reports must be durable, owned, and never fabricated. | Partially implemented | Missing reports no longer render mock data. The current process-local `Map` remains and must be replaced by the approved durable design. |
| API-003 | Admin notification must fail closed. | Implemented; route integration not exercised | Development fallback is removed. The route requires a configured bearer secret or a verified admin actor and bounds the payload. |
| API-004 | Public API/email contracts need safe validation/idempotency/errors. | Partially implemented | Public request and admin notification boundaries are bounded and stable. Existing email helper paths and provider-side exactly-once delivery still require integration coverage. |
| API-005 | Dynamic email values need HTML escaping. | Implemented; pure regression-tested | Reviewed text and attribute contexts use `escapeHtml`. Hostile markup/quotes are covered by the security suite. |
| API-006 | Error contracts must not expose raw exceptions. | Implemented in reviewed routes | Public routes return safe generic errors; detailed provider/network reasons remain server logs only. |

## 4. Independent authentication and authorization review

### Session creation

`POST /api/auth/session` now reads the request body through a bounded stream with a 24,000-byte limit. It rejects oversized declared or chunked bodies before JSON parsing completes, validates that `idToken` is a string and is bounded, calls Firebase Admin `verifyIdToken(idToken, true)`, and only then creates a five-day Firebase session cookie. Cookie settings are HttpOnly, SameSite=Lax, Path=/, and Secure in production.

The earlier implementation’s weakness was that `request.json()` parsed the entire body before the token length check. That was corrected in this batch. Invalid token, malformed token, revoked token, and Firebase configuration errors return a generic 401 response. The route does not return the token, decoded claims, provider error, or credential material.

`DELETE /api/auth/session` attempts to verify the existing session cookie and revoke the actor’s Firebase refresh tokens before clearing the cookie. A malformed or expired cookie is still cleared idempotently. Revocation invalidates all refresh-derived sessions for the actor, which is a deliberate security trade-off that should be documented in the product logout/session policy.

### Middleware and sensitive boundaries

Middleware reads only `__session` for redirect UX. It does not claim that cookie presence authorizes a request. `getVerifiedSession` verifies the Firebase session cookie with revocation checking, and `requireAdminActor` resolves `admins/{uid}` with Admin SDK access. Sensitive server actions use this boundary independently of middleware and independently of `sessionStorage`.

The admin acceptance action now takes only a request ID, loads the request server-side, obtains the recipient/name/service from the trusted record, sends the email, and records the accepting actor. It cannot be redirected to a caller-supplied email recipient through function parameters.

### Remaining integration gap

The repository has no Firebase Emulator configuration or test harness. No production credentials were used. Therefore the following are **not claimed as passed**: forged-cookie rejection through a live Next route, real expired/revoked session verification, non-admin Firebase membership denial, Admin SDK authorization against isolated Firestore data, or concurrent Firestore OTP transaction behavior.

## 5. OTP review

The OTP implementation uses `crypto.randomInt(100000, 1000000)`, random 24-byte challenge IDs, SHA-256 OTP and email hashes, a ten-minute expiration, a five-attempt maximum, and a one-minute resend window keyed by an email hash. Verification checks the verified actor’s email hash, increments attempts or deletes the challenge inside a Firestore transaction, and deletes a valid challenge in the same transaction. A reused or expired challenge therefore cannot succeed through the normal path.

The code is designed for atomic single-use behavior, but the Firestore Emulator was not available/configured for this session. Tests for transaction conflicts, two concurrent correct verifications, and non-admin actor attempts remain a required follow-up.

## 6. SSRF and outbound request review

The actual path from `/api/audit` to the socket was reviewed. URL parsing accepts only HTTP/HTTPS without embedded credentials, and ports are restricted to 80/443. `dns.lookup(..., {all:true})` screens every resolved record. IPv4 loopback, private, link-local, reserved, multicast, benchmark, and other blocked ranges are rejected. Any IPv6 result fails closed because the current runtime implementation does not provide an equivalent connection-time policy.

The connection uses Node `http`/`https` with the screened IP as the socket hostname, while preserving the original Host header and TLS server name. This avoids a second hostname resolution by ordinary `fetch`. Redirects are rejected, only HTML/XHTML content types are accepted, response bytes are capped at 1 MB, and the socket timeout is ten seconds. The crawler no longer performs a second unrestricted fetch after the bounded fetch.

This is not a claim of complete production crawler security. The endpoint remains synchronous, process-local, and without a distributed concurrency/rate limiter. A background worker or quota-controlled execution service is recommended before public production exposure.

## 7. Security tests added and results

### Tests added

- `test/security-regression.test.mjs` covers HTML escaping, public request normalization and length validation, blocked IPv4 ranges, and port allowlisting.
- `test/security-integration.test.mjs` imports the actual TypeScript `safe-fetch` module using Node 22 type stripping and covers loopback IPv4, IPv6 literal fail-closed behavior, unsupported schemes, disallowed ports, and embedded credentials.

### Current test status

The updated security command is:

```text
node --experimental-strip-types --test test/security-regression.test.mjs test/security-integration.test.mjs
```

The final security command passed **9 tests**: five direct safe-fetch boundary tests and four validation/escaping regression tests. The tests ran against the exact lockfile installation and did not contact internal infrastructure or use production credentials. No test uses real internal infrastructure, production credentials, or real OTP email delivery.

The following remain **unverified**, not skipped-and-passed:

- Forged, expired, and revoked Firebase sessions through the actual Next route.
- Logout invalidation against Firebase refresh-token state.
- Authenticated non-admin calls against actual Admin SDK data.
- OTP expiry, replay, attempt limit, actor substitution, and concurrent verification against Firestore.
- Redirect/oversized/slow/content-type cases through a controlled externally reachable test server.
- Full `/api/requests` idempotency behavior with mocked email provider failures and concurrent route calls.
- Full truthful 404 behavior through a rendered route integration test.
- A/B tenant isolation, because no tenant boundary exists yet.

## 8. Dependency vulnerability triage

### Dependency changes made

The lockfile was updated narrowly as follows:

| Direct package | Before | After | Reason | Compatibility result |
|---|---:|---:|---|---|
| `next` | 15.5.15 | 15.5.27 | Covers the current 15.x security advisories without taking the audit tool’s suggested Next 16 major update. | Requires final lint/typecheck/build after exact `npm ci`; no application API migration was introduced. |
| `postcss` | 8.5.12 | 8.5.30 | Covers direct PostCSS advisories through 8.5.22. | Patch-level update; Tailwind/autoprefixer contract retained. Next still carries a nested 8.4.31 copy, recorded below. |
| `firebase-admin` | 14.1.0 | 14.4.0 | Moves beyond the audited vulnerable 11.x–14.3.0 range and refreshes Google Cloud transitive packages. | Same major; exact lockfile install completed. Firebase integration validation remains required. |

No `npm audit fix`, major Next upgrade, production secret change, or production data operation was performed.

### Remaining production audit table

The current `npm audit --omit=dev` result is **23 findings: 2 critical, 12 high, 9 moderate**. The table groups advisories by package to keep the report reviewable; advisory IDs are the npm audit source IDs.

| Package / installed version | Scope and path | Advisory IDs / severity | Fixed version or remediation | Exposure assessment and decision |
|---|---|---|---|---|
| `@fastify/busboy` 3.2.0 | Transitive production via `firebase-admin` | 1240981, 1240982 high; 1241276 moderate | `>=3.2.2` | Firebase Admin dependency; multipart functionality is not directly called by this app. Keep under upstream control; monitor Firebase Admin update. |
| `@grpc/grpc-js` 1.14.3 | Transitive production via Firestore/Google GAX | 1120582, 1120588, 1240622 high plus related IDs | `>=1.14.5` for current branch of advisories | Server Firestore/Admin SDK path is reachable, so this is a meaningful transitive production risk. Do not force an override without testing Google GAX compatibility; prefer a compatible Firebase Admin/Firestore update. |
| `@hono/node-server` 1.19.14 | Transitive production | 1139322 moderate | `>=1.19.15` | No identified Nanoware request path uses Hono directly. Parent update required. |
| `@modelcontextprotocol/sdk` 1.29.0 | Transitive through production AI packages | 1241339 high | `>=1.31.0` | OAuth client advisory; reachability depends on the AI/MCP code path. Audit parent package usage before update. |
| `@protobufjs/utf8` 1.1.0 | Transitive | 1118933 moderate | Patched upstream release | No direct application import identified; update through protobuf parent. |
| `baseline-browser-mapping` 2.10.23 | Transitive build/runtime tooling | 1193686 moderate | `>=2.11.0` | Build metadata path, not identified as public request input. Parent update. |
| `body-parser` 1.20.5 | Transitive server tooling | 1123976/1123977 moderate/low | `>=2.3.0` or patched 1.x | No direct Next route import; parent-controlled. |
| `brace-expansion` affected nested range | Transitive | 1123896, 1130589, 1130736, 1240101, 1240105 high/moderate | `>=2.1.7` where the affected branch is present | Primarily tooling/dependency traversal; avoid broad overrides without tree validation. |
| `browserslist` 4.28.2 | Transitive build tooling | 1153171, 1153172 high | Patched release beyond 4.28.6 | Build-time path; update parent tooling. |
| `dompurify` 3.4.11 | Transitive | 1138538, 1240978, 1241204 moderate/low | Patched release beyond 3.4.15 | No direct server-side use identified; inspect parent before update. |
| `express-rate-limit` 8.4.1 | Transitive | npm audit moderate | Patched later 8.x | Not used as the application’s limiter; no distributed limiter exists yet. Parent update. |
| `fast-uri` 3.1.0 | Transitive URL utility | 1124064, 1130720, 1145559, 1153168, 1158524, 1158530, 1204921, 1239943 high | `>=3.1.8` | URL parsing advisory is security-relevant, but no direct import was found in the app’s SSRF path; the app uses the reviewed Node URL/DNS/socket path. Update parent dependency after compatibility review. |
| `fflate` 0.8.2 | Transitive archive utility | 1164782, 1164784 moderate | `>=0.8.3` | No direct archive ingestion path identified. |
| `hono` 4.12.15 | Transitive | 1117915 and related IDs high/moderate | `>=4.13.7` | No direct Nanoware route identified; parent update. |
| `ip-address` 10.1.0 | Transitive network utility | 1130722 high and related IDs | `>=10.7.1` | The application’s SSRF helper does not use this package; it performs its own IPv4 checks and fails closed for IPv6. Still update upstream parent when safe. |
| `next` 15.5.27 via nested PostCSS | Direct package with nested dependency audit effect | npm audit reports moderate via `postcss` | Next 16.4.0 is the audit tool’s broad fix, but that is a major upgrade | Do not take the major upgrade in this batch. The remaining audit entry is caused by Next’s nested PostCSS 8.4.31; compatibility-safe resolution requires upstream Next packaging or a separately tested override. |
| `postcss` 8.5.30 plus Next nested 8.4.31 | Direct root and nested production/build dependency | 1117015, 1124252, 1130709, 1139510 high/moderate | `>=8.5.23` | Root direct copy is patched; nested Next copy remains. A direct override attempt conflicted with npm’s direct-dependency rules and was removed rather than forcing an unreviewed tree. |
| `protobufjs` 7.5.5 | Transitive Google Cloud dependency | 1118641, 1118924, 1118926, 1118928, 1118930 high/moderate | Patched release beyond 7.6.4 | Google Cloud/Firestore path; update through Firebase/Google parent where compatible. |
| `proxy-addr` 2.0.7 | Transitive Express tooling | 1241210 critical | `>=2.0.8` | Critical IP trust-subnet issue in Express dependency tree; direct application routes are Next-managed, but Firebase tooling and Express transitive paths remain in the install. Parent update required. |
| `qs` 6.15.1 | Transitive request parser | 1119502, 1158506, 1158507 moderate | `>=6.16.0` | No direct body-parser/qs route identified; parent update. |
| `sharp` 0.34.5 | Transitive image tooling | 1124066, 1193725, 1241331 high | Patched release beyond affected libvips/libheif ranges | Next image path may be reachable depending on deployment; verify compatible patched Sharp/Next combination before update. |
| `websocket-driver` 0.7.4 | Transitive Firebase browser websocket path | 1123482 moderate; 1123483 critical | `>=0.7.5` | Firebase client can use the affected websocket dependency; update requires a compatible Firebase release or reviewed override. |
| `ws` 8.20.0 | Transitive AI/MCP path | 1119108 moderate; 1123259 high | `>=8.21.0` | Potentially reachable if production AI websocket code is used; update parent package after compatibility validation. |

The audit’s remaining critical findings are `proxy-addr` and `websocket-driver`. The audit is not clean, and no claim of complete dependency remediation is made.

## 9. Approval-ready tenant architecture proposal

This section is a proposal only. It does not create collections, fields, rules, migrations, or guarantees.

### A. Business identity and lifecycle

Use the proposed `businesses` collection with an immutable document ID generated by the server. A business has `id`, unique normalized `slug`, `status` (`provisioning`, `active`, `suspended`, `archived`), timezone, and timestamps. Creation is a server operation. The creator becomes the initial owner only after the server has created both business and membership records in a controlled transaction or compensating workflow. Slug changes require a separate uniqueness/reservation policy.

### B. Membership

Use the proposed `memberships` collection as the canonical relationship name. Enforce uniqueness on `(businessId,userId)` through a deterministic document ID such as `{businessId}_{userId}` after a documented encoding strategy, or a server transaction plus a unique reservation document. Roles are `owner`, `admin`, and `member`; permissions are policy-derived rather than arbitrary client strings. Users may belong to multiple businesses. Revocation sets membership status to `revoked` and increments a membership/policy version used to invalidate cached tenant context. Ownership transfer is an explicit server operation requiring the current owner and a target active member; there must always be at least one active owner.

### C. Trusted tenant context

A request begins with a verified Firebase session. The client may propose a business ID for selection, but the server loads `memberships/{businessId_userId}` and rejects missing, revoked, suspended, or insufficient-role membership. The resulting context is `{userId,businessId,membershipId,role,policyVersion}` and is passed to services/repositories. Repositories require context rather than accepting a free-standing client business ID. Every list, get, update, delete, nested-resource, Admin SDK, job, and export path must use that context.

### D. Data ownership and public projections

Business-owned target collections are `businessProfiles`, `services`, `availabilityPolicies`, `customers`, `bookingRequests`, `conversations`, `messages`, `usageEvents`, and `subscriptions`. `auditEvents` may be business-scoped or system-scoped depending on the actor and operation. User identity remains in Firebase Auth and a minimal `users/{uid}` profile. Existing `projects` are currently user-owned and remain legacy until migration approval. Public pages read only a separate allowlisted projection, never private configuration, customer contact records, internal notes, membership records, provider IDs, usage, billing, or audit details.

### E. Firebase authorization

Firestore Rules protect direct client reads/writes for explicitly supported paths and default-deny everything else. Rules may check signed-in identity, document membership, and immutable ownership constraints, but they are not the only boundary. Every Admin SDK operation uses a shared server policy helper that requires verified actor, business context, permission, target-resource ownership, and an audit event decision. Server repositories accept the context and add business scope to every query. Public endpoints use separate schema/projection functions.

### F. Migration inventory and proposal

| Current collection/path | Current ownership | Target model | Migration method | Orphans/rollback/validation |
|---|---|---|---|---|
| `users/{uid}` | Firebase user ID plus client profile | Minimal identity profile; optional preferences | Inventory and normalize fields; no destructive rewrite | Orphan profiles retained/quarantined; rollback by leaving legacy fields; reconcile UID/email. |
| `admins/{uid}` | Global admin marker | Platform-level operator role, separate from business membership | Dual-read during transition, then explicit operator policy | Unknown admins require review; rollback keeps read-only legacy marker until cutover. |
| `projects/{projectId}` | `userId` field | Decide whether project is user-owned legacy or assigned to one business | Inventory owner and intended business; create mapping proposal, no automatic assignment | Unmatched projects remain legacy; reconcile counts and access before migration. |
| `projects/{id}/steps` | Parent project | Same as parent project | Migrate only with parent mapping; preserve IDs | Orphan nested docs quarantined; parent-child count reconciliation. |
| `projects/{id}/activities` | Parent project | Same as parent project; immutable audit-like history | Same parent mapping, append-only validation | Orphans quarantined; compare timestamps and parent IDs. |
| `requests/{requestId}` | Public-created lead; admin-readable | Either platform lead or business-owned `bookingRequests`/CRM record after product decision | Dual-write or offline idempotent backfill only after target semantics approved | Public leads without business assignment stay platform-owned; replay by source ID. |
| `request_idempotency/{keyHash}` | Server idempotency reservation | Retain as operational idempotency record with owner scope | No destructive migration; add expiry/retention policy | Conflicting fingerprints remain errors; reconcile reservation/request IDs. |
| Audit process-local `Map` | No durable owner | `audits/{auditId}` with visibility/owner fields, or approved storage alternative | New writes durable first, then read compatibility; no fabricated fallback | Lost process-local reports cannot be recovered; report status and ownership reconciliation required. |
| `audits/{id}` helper path, if populated | Admin SDK helper | Business/user ownership plus public share token policy | Inventory existing records and classify visibility | Unknown owners become private/quarantined; rollback via dual-read. |
| Firebase Auth users | Firebase provider identity | Same identity; memberships are separate | Create membership records through approved provisioning flow | Missing/deleted Firebase users produce inactive memberships, not data deletion. |

No migration should start until target ownership, business assignment rules, public visibility, and rollback are approved.

### G. Required tenant tests after approval

The future suite must use real emulator data or a controlled injected repository and prove: Tenant A cannot read, list, update, or delete Tenant B records; nested children enforce parent scope; forged business IDs are rejected; revoked memberships fail immediately; Admin SDK helpers require context; public projections expose only allowlisted fields; migration is idempotent; orphan handling is deterministic; and counts/ownership reconcile before and after cutover.

### H. Owner decisions required

1. Approve `businesses` and `memberships` as canonical target names.
2. Approve multi-business membership and the owner/admin/member role semantics.
3. Approve trusted business-selection/session-context behavior and membership-cache invalidation.
4. Decide whether legacy projects remain user-owned or are assigned to businesses.
5. Decide whether public requests remain platform leads or become business-owned records.
6. Approve durable audit storage, ownership, share-token behavior, and retention.
7. Approve migration tooling, orphan policy, rollback, and production-readiness evidence.

## 10. Durability and abuse-control design

### Audit persistence

The lowest-risk option compatible with the existing Firebase architecture is a durable Firestore `audits/{auditId}` document plus bounded subcollections only if report size requires them. The document should contain `ownerType` (`anonymous`, `user`, `business`), `ownerId` when authenticated/known, normalized target URL, status (`queued`, `running`, `complete`, `failed`, `expired`), schema version, created/updated/expiry timestamps, a safe public-share token hash, and a report reference. Large report payloads should use Firebase Storage with a private object path and a Firestore metadata document; clients receive a server-authorized projection rather than a raw storage URL.

Creation should be an idempotent server operation. The audit worker writes status transitions with a job ID and attempts count. Reads require either the owner context or a high-entropy share token that is stored only as a hash and returns an allowlisted report projection. Reports expire according to an approved retention period, with deletion or archival as a server job. A missing report returns 404; it never falls back to demo data. This design is multi-instance consistent because Firestore is the source of truth rather than a process-local map.

Failure handling requires a durable `queued/running/failed` state, bounded retries, and a dead-letter/manual-review state. Email notification must be separated from report creation and have its own idempotency key. The application should not claim notification success merely because the report write succeeded.

### Rate limiting and concurrency

The recommended design is a server-side limiter backed by a consistent store already approved for the deployment. Firestore counters can work for low volume but have hot-document contention and are not ideal for high-rate IP limits; a managed Redis-compatible store is operationally stronger but introduces cost and infrastructure approval. No limiter is deployed in this batch.

Suggested initial policies, subject to product approval:

| Endpoint | Suggested limit | Concurrency/resource control |
|---|---|---|
| `POST /api/audit` anonymous | 3 per IP per 15 minutes; 20 per normalized target per hour | Global worker concurrency cap; one active audit per idempotency key/target; 1 MB response and ten-second fetch cap. |
| `POST /api/requests` anonymous | 5 per IP per hour; 3 per normalized email per hour | Idempotency key plus request fingerprint; notification queue concurrency cap. |
| `POST /api/email/admin-notify` | Admin/secret caller only; 30 per actor per hour | Per-actor and global email-provider concurrency; audit every send. |
| Admin OTP request | 3 per actor/email per 15 minutes; one resend per minute | Existing challenge transaction and attempt cap; provider send queue. |
| Session creation | Per-IP and per-identity burst limit | Request-body byte cap and provider-call timeout. |

The application must use the true client IP only from a configured, trusted proxy chain. Untrusted `X-Forwarded-For` values must not become identity/rate-limit keys. Abuse responses should be stable 429 errors with `Retry-After`, avoid revealing account existence, and emit redacted security events. Limits must be multi-instance consistent, and a fail-closed or bounded-degraded behavior must be chosen for limiter-store outages.

## 11. Remaining P0/P1/P2 risks

| Priority | Risk | State |
|---|---|---|
| P0 | Tenant membership/context does not exist. | **Open and blocked on explicit architecture approval.** |
| P0 | Public audit reports are process-local and unauthenticated/unowned. | **Open; durable design proposed, not implemented.** |
| P0 | Production-grade distributed audit/public-endpoint rate and concurrency control absent. | **Open; design proposed, not deployed.** |
| P1 | Firebase emulator/integration tests for session, admin, OTP, and Firestore rules absent. | **Open; environment/test harness limitation.** |
| P1 | `@grpc/grpc-js` 1.14.3 and `@fastify/busboy` 3.2.0 remain reachable transitive Firebase Admin dependencies. | **Open; parent update required.** |
| P1 | Critical `proxy-addr` and `websocket-driver` transitive findings remain. | **Open; compatibility-aware parent updates required.** |
| P1 | External email side effects cannot be made exactly-once by Firestore reservation alone if provider send succeeds and recording fails. | **Open; provider idempotency or outbox design required.** |
| P2 | Nested Next PostCSS 8.4.31 remains audited while root PostCSS is patched. | **Open; no safe override chosen.** |
| P2 | Logout revocation invalidates all refresh-token-derived sessions for the user. | **Documented trade-off; product/session policy approval required.** |

## 12. Final validation and change summary

### Validation to run after the final dependency installation

| Check | Required result | Current evidence/status |
|---|---|---|
| Security unit and direct boundary tests | Pass | Existing four helper tests passed previously; the new actual `safe-fetch` tests were added after that checkpoint and require final run. |
| ESLint | Pass | **PASS** — exit 0. |
| TypeScript | Pass | **PASS** — exit 0. |
| Production build | Pass | **PASS** — Next.js 15.5.27; 28 pages generated. |
| `npm audit --omit=dev` | Non-zero | **NON-ZERO** — 23 findings: 2 critical, 12 high, 9 moderate. |
| `git diff --check` | Pass | **PASS** — exit 0. |

### Intentional files changed in Batch 2.1

- `app/api/auth/session/route.ts` — bounded body parsing and logout refresh-token revocation.
- `app/api/requests/route.ts` — truthful processing state for idempotent retries.
- `package.json` and `package-lock.json` — security test command and scoped dependency updates.
- `test/security-integration.test.mjs` — direct safe-fetch boundary tests.
- `docs/BATCH-2.1-SECURITY-VERIFICATION-REPORT.md` — this report.

All earlier Batch 2 source changes remain in the isolated worktree and are reviewed as part of this continuation. No production schema, data, secret, infrastructure, main branch, or documentation branch was changed.

## 13. Final merge/deployment recommendation

**Do not merge or deploy this branch.**

The branch has meaningful security improvements and a reduced dependency audit count, but the following gates remain: approve the tenant model; add real Firebase Emulator integration tests; replace process-local audit storage with durable ownership; add deployment-level rate/concurrency controls; resolve or formally accept the remaining critical/high dependency findings; and rerun the complete validation suite against the exact lockfile. Only after those gates have evidence should tenant-owned SaaS implementation begin.
