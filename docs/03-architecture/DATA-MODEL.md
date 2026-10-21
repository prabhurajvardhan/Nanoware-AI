# Data Model

- **Document ID:** ARCH-003
- **Status:** IMPLEMENTED FOUNDATION
- **Last updated:** 2026-10-13

## Implemented tenant identity entities

The first tenant boundary is implemented in the application and Firestore rules:

| Collection | Required keys | Authorization invariant |
|---|---|---|
| `businesses/{businessId}` | `name`, `slug`, `ownerId`, `status`, `verificationStatus`, `timezone`, `contactEmail`, timestamps | Provisioned only by the verified server onboarding route; verification details remain server-only |
| `memberships/{businessId}__{userId}` | `businessId`, `userId`, `role`, `status`, timestamps | Deterministic one-user/one-business relationship; role is `owner`, `admin`, or `member` |

The browser discovers memberships only through the HttpOnly session. Firestore client reads for business-owned projects require an active membership; business and membership writes are server-only. Initial onboarding also backfills a user’s legacy projects with `businessId` so existing work is not silently orphaned.

Phase 1 stores the submitted legal/trade identity, registration metadata, contact details, expected use, automatic-check results, website proof metadata, reviewer, decision reason, and timestamps inside `businesses/{businessId}.verification`. The browser receives only the safe verification status projection through `/api/business/access`; operations-style access requires `verificationStatus == verified`. Registration uniqueness is enforced by the server-only `business_registration_keys` collection, and review decisions are recorded in `auditEvents`.

## Proposed operational entities

| Entity | Required keys | Notes |
|---|---|---|
| `businesses` | `id`, `slug`, `status`, `timezone`, timestamps | Public identity and lifecycle |
| `memberships` | `businessId`, `userId`, `role`, `status` | Unique user/business membership |
| `businessProfiles` | `businessId`, allowlisted public fields | Never expose private config |
| `services` | `businessId`, name, duration, active | Owner-managed catalog |
| `availabilityPolicies` | `businessId`, timezone, rules | Validate DST and conflicts |
| `customers` | `businessId`, normalized contact | Private operational data |
| `bookingRequests` | `businessId`, idempotencyKey, state | State machine and audit |
| `conversations`/`messages` | `businessId`, visibility | Prompt injection boundaries |
| `usageEvents` | `businessId`, eventKey, kind | Immutable/idempotent |
| `subscriptions` | `businessId`, provider IDs, state | Provider-sourced |
| `auditEvents` | `businessId?`, actor, action, result | Minimize sensitive payload |

Migration from `projects`, `requests`, and `audits` is unresolved; inventory before schema changes.

## Universal verification model

The implemented onboarding contract is intentionally country-neutral: `businessName`, `website`, and `countryCode` are the only business-detail fields in the standard form. Registration numbers, custom-domain email, website ownership, and Google Business Profile URLs are optional evidence signals and never universal requirements.

`accounts/{uid}` stores server-maintained `emailVerified` and `phoneVerification.status`. Account-email links are hashed, single-use, and expire after 30 minutes. Phone OTPs are rate-limited, expire after 10 minutes, capped at five attempts, and use `verified_phone_keys` to prevent silent phone reuse. If no explicitly configured SMS provider exists, the server returns a recoverable unavailable state and does not mark a phone verified.

`businesses/{businessId}.verification` stores `checks.accountEmail`, `checks.phone`, `checks.websiteOwnership`, `checks.businessDomainEmail`, `checks.googleBusinessProfile`, and an evidence list. Approval requires authoritative account email and successful business-domain email verification; phone verification remains an optional shared capability and is not required for onboarding. Other signals support manual review but do not replace the mandatory email checks. Allowed lifecycle states include `pending_verification`, `pending_review`, `more_information_required`, `verified`, `rejected`, and `suspended`.

Legacy businesses with no explicit `verificationStatus` are treated as `pending_verification` by the server and are denied project/billing access by Firestore rules. No silent legacy trust is granted; a migration or administrator must write an explicit decision.

**Naming decision:** `memberships` is the canonical implemented relationship collection. Its deterministic document ID is `{businessId}__{userId}`, preventing duplicate owner records during retries while allowing one user to hold memberships in multiple businesses.
