# Authentication Audit

- **Document ID:** AUDIT-002
- **Status:** IN_REVIEW
- **Last updated:** 2026-10-13

## Verified implementation

- `components/AuthProvider.tsx` subscribes to Firebase `onAuthStateChanged`, obtains an ID token, and writes a non-HttpOnly `authToken` cookie with `SameSite=Lax` and one-day max age.
- `app/login/page.tsx` uses Firebase email/password sign-in and creates a `users/{uid}` record plus a project and subcollections on sign-up.
- `middleware.ts` redirects selected routes when the cookie is absent and redirects `/login` when it is present.
- `app/admin/auth-actions.ts` stores email-keyed OTP records in `admin_otps`, sends the OTP through Resend, and deletes it after successful comparison.

## Security observations

- **RELEASE BLOCKER:** middleware checks cookie presence, not cryptographic validity or expiry.
- **RELEASE BLOCKER:** the cookie is client-writable and not HttpOnly; server route authorization evidence is not established.
- **HIGH:** OTP generation uses `Math.random`, stores plaintext OTP, has no attempt counter/rate limit, and derives a predictable document ID from email.
- **HIGH:** admin authorization is not demonstrated by the OTP actions themselves; membership checks must be added before privileged operations.
- **UNVERIFIED:** Firebase Auth provider settings, session revocation, MFA, email verification, and production identity configuration.

## Required target flow
Verify the Firebase ID token or establish a server session, resolve the user, load membership, and authorize each operation. Treat middleware as routing convenience only, not the authorization boundary.
