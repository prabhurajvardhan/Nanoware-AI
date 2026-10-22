# Authentication and Authorization

- **Document ID:** ARCH-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Proposed flow
Browser authenticates with the identity provider -> server verifies token/session -> server resolves membership -> operation policy authorizes role and resource -> repository enforces `businessId` scope. Middleware may redirect for UX but is not the authorization boundary.

## Required controls
HttpOnly/Secure/SameSite session strategy where applicable; token expiry and revocation; email verification/MFA decision; CSRF strategy for cookie sessions; rate limits; audit logs; fail-closed admin access. Admin SDK calls require explicit authorization because they bypass Firestore rules.

Account email verification is server-authoritative: the authenticated session can request an email link, but only a hashed single-use token callback can update Firebase Auth `emailVerified`. Business onboarding and operations routes call the fresh-user check rather than trusting a client flag. Email actions use the server-only SMTP adapter and fail closed unless SMTP confirms the recipient was accepted. Owner mobile verification uses a provider adapter with rate limits, expiry, attempt caps, and reuse prevention; absent provider configuration is an explicit unavailable state, never a successful verification.

Business approval requires both account email and mobile verification. Website ownership, business-domain email, registration records, and Google Business Profile URLs are optional evidence signals that support review. A Google URL is stored as a user claim unless an actual provider integration is configured; no OAuth or ownership is implied. Firestore project and activity rules additionally require `businesses/{businessId}.verificationStatus == 'verified'`.
