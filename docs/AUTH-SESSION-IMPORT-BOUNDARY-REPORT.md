# Auth Session Import-Boundary Report

- **Scope:** `app/api/auth/session/route.ts` module initialization and its static import graph.
- **Status:** Local fix verified; production 500 not yet confirmed fixed (requires a controlled deployed POST and Vercel log check).

## Evidence

- **VERIFIED:** Before this change, the session route imported `MFA_COOKIE`, `SESSION_COOKIE`, and `SESSION_MAX_AGE_SECONDS` from `@/lib/auth/server`. That module statically imports `firebase-admin/auth` and `@/lib/firebase-admin`, which in turn import `firebase-admin/app` and `firebase-admin/firestore`.
- **VERIFIED:** In the compiled baseline bundle `.next/server/app/api/auth/session/route.js`, the route module contained 4 top-level async module initializations. Firebase Admin modules were loaded while the route module was being evaluated, before any handler ran.
- **VERIFIED:** After the change, the route bundle has 0 top-level async modules. Firebase Admin is reached only through lazy chunks (`c.e(8850)`, `c.e(9758)`) and `import()` calls inside `POST`.
- **VERIFIED:** The README (Production section) reports that the public endpoint returns an HTML 500, which is consistent with a failure before Next's JSON error boundary runs. The client shows "Unable to establish a secure session" only when the response is non-OK and has no JSON `error` string (`app/login/page.tsx`).
- **VERIFIED:** Locally, the baseline build also returns 405 for GET. The module loads without credentials, so local runs did not reproduce the production 500.
- **UNVERIFIED:** The exact Vercel runtime error. Vercel function logs are not readable from this repository, so the specific exception is not confirmed.

## Change

- `lib/auth/constants.ts` (new): dependency-free `SESSION_COOKIE` (`__session`), `MFA_COOKIE` (`__admin_mfa`), `SESSION_MAX_AGE_SECONDS` (432000), `MFA_MAX_AGE_SECONDS` (43200).
- `lib/auth/server.ts`: imports and re-exports the constants, so existing importers are unchanged.
- `app/api/auth/session/route.ts`: imports the constants from `@/lib/auth/constants`.
- `test/auth-session-regression.test.mjs`: constant values, re-export contract, and a static import-graph test that fails if Firebase packages become statically reachable from the session route.

Security behaviour is unchanged: ID-token verification with revocation, the recent sign-in check, same-origin checks, rate limiting, concurrency guard, HttpOnly secure cookies, and DELETE logout were not modified.

## Remaining uncertainties

- **UNVERIFIED:** Whether removing the module-level Firebase load is sufficient for production. If the production failure is in a dependency that also loads on the POST path, POST will still fail, but as a JSON 503 with a logged `x-request-id`.
- **INFERRED:** Other routes still import `@/lib/auth/server` statically (for example `/api/business/access`, `/api/business/onboard`, admin routes, billing authorization). They keep the eager Firebase load. They were out of scope for this change because they are not part of the session route's initialization path.

## Production verification checklist

1. Deploy the change (not done by this task).
2. `curl -i https://nanowareai.in/api/auth/session` should return 405 with JSON or an empty body, not an HTML 500.
3. Send a controlled POST with an invalid token and a same-origin `Origin` header. Expect a JSON 400 or 401/503, not HTML.
4. Use the `x-request-id` from the response to find the matching Vercel log entry.
