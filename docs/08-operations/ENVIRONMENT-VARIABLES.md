# Environment Variables

- **Document ID:** OPS-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

| Name | Evidence/purpose | Exposure |
|---|---|---|
| `GEMINI_API_KEY` | `.env.example`; intended AI provider key | Server only; provider unverified |
| `APP_URL` | `.env.example` and email links; must be an absolute HTTPS origin in production | Server/config |
| `RESEND_API_KEY` | Resend client | Server only |
| `ADMIN_EMAIL` | Admin notification recipient | Server/config |
| `EMAIL_FROM` | Used by email actions; must be a sender identity/domain verified in Resend | Server/config |
| `SMS_PROVIDER` | Optional shared phone-verification integration; not required for business onboarding | Server/config |
| `TWILIO_ACCOUNT_SID` | Optional Twilio SMS account identifier for phone features outside onboarding | Server secret only |
| `TWILIO_AUTH_TOKEN` | Optional Twilio SMS credential for phone features outside onboarding | Server secret only |
| `TWILIO_FROM_NUMBER` | Optional verified Twilio sender number for phone features outside onboarding | Server/config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Required Firebase Admin credential for production Auth/Firestore; must belong to project `nanoware-ai` | Server secret only |
| `APP_SECRET` | Admin-notify bearer comparison | Server secret; fail closed, rotate |

Vercel does not provide Google Application Default Credentials to this server runtime. Create a service account in Firebase project `nanoware-ai`, grant only the Firebase Admin permissions required by this application, serialize the downloaded JSON as one Vercel Production secret value, and redeploy. The application validates that the credential `project_id` matches the checked-in Firebase client project before using it. Never commit or log the JSON. The supplied web configuration includes the verified web app ID and measurement ID; no named Firestore database ID was supplied, so the client and Admin SDK use the project’s default Firestore database.

Values are not reproduced here. Confirm every runtime variable, secret manager, rotation policy, and environment separation before deployment.

## Email verification incident finding

The previous implementation did not send an account-verification message at all: signup sent a welcome email, used a fallback `hello@nanowareai.in` sender when `EMAIL_FROM` was absent, and swallowed delivery failures in the browser. Resend requires both a valid API key and a sender identity/domain verified in the Resend project. The repaired flow requires explicit `EMAIL_FROM`, sends a single-use 30-minute link, logs only a non-sensitive delivery failure, and exposes a retryable UI state. No production Resend delivery logs were available in this repository, so provider-level rejection codes must still be confirmed in the Resend dashboard after deployment.

Business onboarding does not require SMS or Twilio configuration. Shared phone-verification utilities remain fail-closed when used by other features: absent provider configuration never marks a phone verified. The supported phone countries remain India (`+91`), United States (`+1`), Canada (`+1`), Australia (`+61`), and United Kingdom (`+44`); a configured Twilio account that rejects a request returns a safe provider-failure message.

## Legacy business verification migration plan

This plan is not executed by the application or this PR. Before enabling the strict Firestore rules in production, an admin-only, MFA-gated, dry-run migration should enumerate active `businesses` missing `verificationStatus`, record counts and owners without exporting private evidence, and write an explicit status through an audited server transaction. Businesses with authoritative existing evidence may be reviewed and written as `verified`; all others must be written as `pending_verification` and re-enter the business-domain email review flow. The job must be idempotent, preserve memberships and projects, create one audit event per decision, and be run in staging before production. No automatic legacy approval is permitted.
