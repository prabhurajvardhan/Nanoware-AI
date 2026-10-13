# Business Onboarding

- **Document ID:** PROD-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Proposed states
`requested -> identity_verified -> provisioning -> configured -> published -> suspended -> archived`.

Provisioning must be idempotent: a retry resumes or verifies each resource rather than creating duplicates. Required inputs are business name, owner identity, timezone, contact channel, and an explicit consent/terms record once legal requirements are settled. A failed step records an error code safe for the user and detailed diagnostics for operators.

Acceptance: repeated submission creates one business, one owner membership, and no orphaned secrets or public page.
