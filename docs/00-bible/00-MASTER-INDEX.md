# Nanoware AI — Master Engineering Index

- **Document ID:** BIBLE-000
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Product summary

Nanoware AI is currently a Next.js web application for presenting Nanoware’s services, research, projects, and a website-audit lead-generation flow. The supplied roadmap proposes transforming it into a self-service, multi-tenant AI customer-management SaaS for independent businesses. The current product and the proposed product are intentionally separated throughout this documentation.

## Evidence status

- **VERIFIED:** Next.js App Router source exists under `app/`; package scripts are `dev`, `build`, `start`, `lint`, and `clean`.
- **VERIFIED:** Firebase client initialization is in `lib/firebase.ts`; Firebase Admin initialization is in `lib/firebase-admin.ts`.
- **VERIFIED:** Firestore rules deny all unmatched access, allow public creation of `requests`, and contain user/admin rules for `projects` and subcollections.
- **VERIFIED:** `/api/audit` uses an in-memory `Map`; `lib/firebase/auditService.ts` provides a separate Admin-SDK persistence service that the route does not call.
- **VERIFIED:** Browser auth writes an `authToken` cookie; middleware checks only cookie presence, not token validity.
- **UNVERIFIED:** Production hosting, DNS, deployment branch, billing provider, AI provider configuration, and production data state.
- **UNVERIFIED:** The referenced roadmap PDF was not present in the workspace.

## Navigation

### Product and governance
- [Product mission](01-PRODUCT-MISSION.md)
- [System boundaries](02-SYSTEM-BOUNDARIES.md)
- [Engineering principles](03-ENGINEERING-PRINCIPLES.md)
- [Agent operating protocol](04-AGENT-OPERATING-PROTOCOL.md)
- [Definition of done](05-DEFINITION-OF-DONE.md)
- [Decision log](06-DECISION-LOG.md)

### Audits
- [Repository audit](../01-audit/REPOSITORY-AUDIT.md)
- [Authentication audit](../01-audit/AUTHENTICATION-AUDIT.md)
- [Database and rules audit](../01-audit/DATABASE-AND-RULES-AUDIT.md)
- [API audit](../01-audit/API-AUDIT.md)
- [Frontend audit](../01-audit/FRONTEND-AUDIT.md)
- [Deployment audit](../01-audit/DEPLOYMENT-AUDIT.md)
- [Security audit](../01-audit/SECURITY-AUDIT.md)

### Product requirements
- [Product requirements](../02-product/PRODUCT-REQUIREMENTS.md)
- [Roles and permissions](../02-product/USER-ROLES-AND-PERMISSIONS.md)
- [Customer journeys](../02-product/CUSTOMER-JOURNEYS.md)
- [Business onboarding](../02-product/BUSINESS-ONBOARDING.md)
- [Subscription and pricing](../02-product/SUBSCRIPTION-AND-PRICING.md)

### Target architecture
- [System architecture](../03-architecture/SYSTEM-ARCHITECTURE.md)
- [Multi-tenancy](../03-architecture/MULTI-TENANCY.md)
- [Data model](../03-architecture/DATA-MODEL.md)
- [Authentication and authorization](../03-architecture/AUTHENTICATION-AND-AUTHORIZATION.md)
- [API contracts](../03-architecture/API-CONTRACTS.md)
- [Domain and subdomain routing](../03-architecture/DOMAIN-AND-SUBDOMAIN-ROUTING.md)
- [Error handling and recovery](../03-architecture/ERROR-HANDLING-AND-RECOVERY.md)
- [Security architecture](../03-architecture/SECURITY-ARCHITECTURE.md)

### Features
- [Account and business provisioning](../04-features/01-ACCOUNT-AND-BUSINESS-PROVISIONING.md)
- [Business profile and public page](../04-features/02-BUSINESS-PROFILE-AND-PUBLIC-PAGE.md)
- [CRM](../04-features/03-CRM.md)
- [Service catalog](../04-features/04-SERVICE-CATALOG.md)
- [Booking engine](../04-features/05-BOOKING-ENGINE.md)
- [Customer assistant](../04-features/06-CUSTOMER-ASSISTANT.md)
- [Owner dashboard](../04-features/07-OWNER-DASHBOARD.md)
- [Usage metering](../04-features/08-USAGE-METERING.md)
- [Subscriptions and billing](../04-features/09-SUBSCRIPTIONS-AND-BILLING.md)
- [Notifications](../04-features/10-NOTIFICATIONS.md)
- [Admin console](../04-features/11-ADMIN-CONSOLE.md)
- [Voice assistant](../04-features/12-VOICE-ASSISTANT.md)

### Delivery workflows and tasks
- [Master implementation workflow](../05-agent-workflows/MASTER-IMPLEMENTATION-WORKFLOW.md)
- [Task dependency graph](../05-agent-workflows/TASK-DEPENDENCY-GRAPH.md)
- [Safe repository exploration](../05-agent-workflows/SAFE-REPOSITORY-EXPLORATION.md)
- [Implementation and testing](../05-agent-workflows/IMPLEMENTATION-AND-TESTING.md)
- [Debugging decision trees](../05-agent-workflows/DEBUGGING-DECISION-TREES.md)
- [Regression prevention](../05-agent-workflows/REGRESSION-PREVENTION.md)
- [Deployment and rollback](../05-agent-workflows/DEPLOYMENT-AND-ROLLBACK.md)

### Testing and operations
- [Test strategy](../07-testing/TEST-STRATEGY.md)
- [Security test cases](../07-testing/SECURITY-TEST-CASES.md)
- [Multi-tenant test cases](../07-testing/MULTI-TENANT-TEST-CASES.md)
- [Booking test cases](../07-testing/BOOKING-TEST-CASES.md)
- [Release acceptance tests](../07-testing/RELEASE-ACCEPTANCE-TESTS.md)
- [Environment variables](../08-operations/ENVIRONMENT-VARIABLES.md)
- [Deployment runbook](../08-operations/DEPLOYMENT-RUNBOOK.md)
- [Monitoring and logging](../08-operations/MONITORING-AND-LOGGING.md)
- [Backup and recovery](../08-operations/BACKUP-AND-RECOVERY.md)
- [Incident response](../08-operations/INCIDENT-RESPONSE.md)

## Phase overview and task status

| Phase | Scope | Status | Gate |
|---|---|---|---|
| 0 | Baseline audit and documentation | **IN_REVIEW** | Evidence and links validated |
| 1 | Auth, tenant model, data/API contracts | **PROPOSED** | Security review required |
| 2 | Provisioning, routing, profile, services | **PROPOSED** | Tenant isolation tests pass |
| 3 | CRM, booking, assistant, dashboard | **PROPOSED** | Abuse and authorization tests pass |
| 4 | Metering, billing, notifications, admin | **PROPOSED** | Provider contracts verified |
| 5 | Production validation and operations | **PROPOSED** | Recovery drill complete |

All executable task specifications are in [`docs/06-task-specifications/`](../06-task-specifications/):

- [TASK-001 — Baseline audit](../06-task-specifications/TASK-001-BASELINE-AUDIT.md)
- [TASK-002 — Authentication review](../06-task-specifications/TASK-002-AUTHENTICATION-REVIEW.md)
- [TASK-003 — Tenant data isolation](../06-task-specifications/TASK-003-TENANT-DATA-ISOLATION.md)
- [TASK-004 — Data and API contracts](../06-task-specifications/TASK-004-DATA-AND-API-CONTRACTS.md)
- [TASK-005 — Business provisioning](../06-task-specifications/TASK-005-BUSINESS-PROVISIONING.md)
- [TASK-006 — Domain routing](../06-task-specifications/TASK-006-DOMAIN-ROUTING.md)
- [TASK-007 — Public page and services](../06-task-specifications/TASK-007-PUBLIC-PAGE-AND-SERVICES.md)
- [TASK-008 — CRM](../06-task-specifications/TASK-008-CRM.md)
- [TASK-009 — Booking engine](../06-task-specifications/TASK-009-BOOKING-ENGINE.md)
- [TASK-010 — Customer assistant](../06-task-specifications/TASK-010-CUSTOMER-ASSISTANT.md)
- [TASK-011 — Owner dashboard](../06-task-specifications/TASK-011-OWNER-DASHBOARD.md)
- [TASK-012 — Usage metering](../06-task-specifications/TASK-012-USAGE-METERING.md)
- [TASK-013 — Billing](../06-task-specifications/TASK-013-BILLING.md)
- [TASK-014 — Operations and admin](../06-task-specifications/TASK-014-OPERATIONS-AND-ADMIN.md)
- [TASK-015 — Production validation](../06-task-specifications/TASK-015-PRODUCTION-VALIDATION.md)
- [TASK-016 — Voice assistant](../06-task-specifications/TASK-016-VOICE.md)

The recommended first implementation task is [TASK-001 — Baseline audit](../06-task-specifications/TASK-001-BASELINE-AUDIT.md).

## Release-blocking security gates

1. Every tenant-owned record has a canonical `businessId` or an approved documented exception.
2. Server authorization derives tenant membership from verified identity, never from a client-supplied `businessId`.
3. Admin SDK access has explicit authorization because it bypasses Firestore rules.
4. Public pages return an allowlisted projection only.
5. AI tools independently authorize every mutation and read.
6. Negative cross-tenant, expired-session, replay, and webhook tests pass.

## Unresolved decisions

See the [decision log](06-DECISION-LOG.md). The largest unresolved items are the payment provider, AI provider and retrieval design, hosting/DNS ownership, exact definition of a qualified booking request, migration strategy for current Firebase data, and whether legacy project/audit features remain in the target product.

## Roadmap artifact

No roadmap PDF was available in the workspace at audit time. If an authorized owner supplies it later, reconcile it against the Markdown source of truth and record differences in the [decision log](06-DECISION-LOG.md).
