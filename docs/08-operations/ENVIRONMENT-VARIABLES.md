# Environment Variables

- **Document ID:** OPS-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

| Name | Evidence/purpose | Exposure |
|---|---|---|
| `GEMINI_API_KEY` | `.env.example`; intended AI provider key | Server only; provider unverified |
| `APP_URL` | `.env.example` and email links | Server/config |
| `RESEND_API_KEY` | Resend client | Server only |
| `ADMIN_EMAIL` | Admin notification recipient | Server/config |
| `EMAIL_FROM` | Used by email actions | Server/config; not in example |
| `SMS_PROVIDER` | Set to `twilio` only when the Twilio adapter is configured; absent means phone verification is explicitly unavailable | Server/config |
| `TWILIO_ACCOUNT_SID` | Twilio SMS account identifier | Server secret only |
| `TWILIO_AUTH_TOKEN` | Twilio SMS credential | Server secret only |
| `TWILIO_FROM_NUMBER` | Verified Twilio sender number | Server/config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Required Firebase Admin credential for production Auth/Firestore; must belong to project `nanoware-ai` | Server secret only |
| `APP_SECRET` | Admin-notify bearer comparison | Server secret; fail closed, rotate |

Vercel does not provide Google Application Default Credentials to this server runtime. Create a service account in Firebase project `nanoware-ai`, grant only the Firebase Admin permissions required by this application, serialize the downloaded JSON as one Vercel Production secret value, and redeploy. The application validates that the credential `project_id` matches the checked-in Firebase client project before using it. Never commit or log the JSON. The supplied web configuration includes the verified web app ID and measurement ID; no named Firestore database ID was supplied, so the client and Admin SDK use the project’s default Firestore database.

Values are not reproduced here. Confirm every runtime variable, secret manager, rotation policy, and environment separation before deployment.

## Email verification incident finding

The previous implementation did not send an account-verification message at all: signup sent a welcome email, used a fallback `hello@nanowareai.in` sender when `EMAIL_FROM` was absent, and swallowed delivery failures in the browser. Resend requires both a valid API key and a sender identity/domain verified in the Resend project. The repaired flow requires explicit `EMAIL_FROM`, sends a single-use 30-minute link, logs only a non-sensitive delivery failure, and exposes a retryable UI state. No production Resend delivery logs were available in this repository, so provider-level rejection codes must still be confirmed in the Resend dashboard after deployment.

Phone verification is deliberately fail-closed when `SMS_PROVIDER` and the Twilio variables are absent; the UI says that SMS is not configured rather than claiming a number was verified.
