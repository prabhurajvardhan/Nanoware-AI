# Business Onboarding

- **Document ID:** PROD-004
- **Status:** IMPLEMENTED FOUNDATION
- **Last updated:** 2026-10-13

## Proposed states
`requested -> identity_verified -> provisioning -> configured -> published -> suspended -> archived`.

Provisioning must be idempotent: a retry resumes or verifies each resource rather than creating duplicates. Required inputs are business name, owner identity, timezone, contact channel, and an explicit consent/terms record once legal requirements are settled. A failed step records an error code safe for the user and detailed diagnostics for operators.

Acceptance: repeated submission creates one business, one owner membership, and no orphaned secrets or public page.

## Current implementation evidence

- `/api/business/onboard` accepts only the authenticated HttpOnly session, validates the business name/timezone, and creates `businesses/{businessId}` plus `memberships/{businessId}__{userId}` in one transaction.
- Repeated onboarding is safe: deterministic business and membership IDs return the existing owner workspace instead of creating duplicates.
- Existing legacy projects for the authenticated user are backfilled with `businessId` in the same transaction so the dashboard does not lose access during migration.
- `/api/business/access` returns only businesses resolved from active membership records. The dashboard revalidates a selected business before reading business-scoped projects.
- Invite-based association to a second business is intentionally not created by this batch; when an approved invite workflow exists, it must write the same canonical membership shape. Existing memberships already support multiple businesses and the dashboard renders a selection screen.
