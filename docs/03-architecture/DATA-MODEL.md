# Data Model

- **Document ID:** ARCH-003
- **Status:** IMPLEMENTED FOUNDATION
- **Last updated:** 2026-10-13

## Implemented tenant identity entities

The first tenant boundary is implemented in the application and Firestore rules:

| Collection | Required keys | Authorization invariant |
|---|---|---|
| `businesses/{businessId}` | `name`, `slug`, `ownerId`, `status`, `timezone`, `contactEmail`, timestamps | Provisioned only by the verified server onboarding route |
| `memberships/{businessId}__{userId}` | `businessId`, `userId`, `role`, `status`, timestamps | Deterministic one-user/one-business relationship; role is `owner`, `admin`, or `member` |

The browser discovers memberships only through the HttpOnly session. Firestore client reads for business-owned projects require an active membership; business and membership writes are server-only. Initial onboarding also backfills a user’s legacy projects with `businessId` so existing work is not silently orphaned.

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
