# Data Model

- **Document ID:** ARCH-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Proposed logical entities

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

**Naming decision:** The repository has no verified `memberships` or `businessMembers` collection/model. `memberships` is the canonical **PROPOSED** target name used by these documents because it describes the relationship generically; it is not a current collection and must be approved before implementation.

**Naming decision:** The repository has no verified `memberships` or `businessMembers` collection/model. `memberships` is the canonical **PROPOSED** target name used by these documents because it describes the relationship generically; it is not a current collection and must be approved before implementation.
