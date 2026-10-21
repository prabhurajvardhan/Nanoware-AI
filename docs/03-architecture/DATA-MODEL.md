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

**Naming decision:** `memberships` is the canonical implemented relationship collection. Its deterministic document ID is `{businessId}__{userId}`, preventing duplicate owner records during retries while allowing one user to hold memberships in multiple businesses.
