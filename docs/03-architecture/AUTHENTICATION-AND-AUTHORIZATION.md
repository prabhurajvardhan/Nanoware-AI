# Authentication and Authorization

- **Document ID:** ARCH-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Proposed flow
Browser authenticates with the identity provider -> server verifies token/session -> server resolves membership -> operation policy authorizes role and resource -> repository enforces `businessId` scope. Middleware may redirect for UX but is not the authorization boundary.

## Required controls
HttpOnly/Secure/SameSite session strategy where applicable; token expiry and revocation; email verification/MFA decision; CSRF strategy for cookie sessions; role-change invalidation; rate limits; audit logs; fail-closed admin access. Admin SDK calls require explicit authorization because they bypass Firestore rules.
