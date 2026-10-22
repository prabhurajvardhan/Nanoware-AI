# Environment Variables

- **Document ID:** OPS-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

| Name | Evidence/purpose | Exposure |
|---|---|---|
| `GEMINI_API_KEY` | `.env.example`; intended AI provider key | Server only; provider unverified |
| `APP_URL` | `.env.example` and email links; must be an absolute HTTPS origin in production | Server/config |
| `SMTP_HOST` | SMTP endpoint; defaults to the Zoho India host configured in code | Server only |
| `SMTP_PORT` | SMTP port; defaults to implicit SSL port 465 | Server only |
| `SMTP_SECURE` | Optional explicit TLS/SSL mode; otherwise inferred from port 465 | Server/config |
| `SMTP_USER` | Authenticated Zoho mailbox username | Server secret only |
| `SMTP_PASS` | SMTP password or Zoho app-specific password | Server secret only |
| `ADMIN_EMAIL` | Admin notification recipient | Server/config |
| `EMAIL_FROM` | Sender mailbox or Zoho-configured sender alias | Server/config |
| `SMS_PROVIDER` | Optional shared phone-verification integration; not required for business onboarding | Server/config |
| `TWILIO_ACCOUNT_SID` | Optional Twilio SMS account identifier for phone features outside onboarding | Server secret only |
| `TWILIO_AUTH_TOKEN` | Optional Twilio SMS credential for phone features outside onboarding | Server secret only |
| `TWILIO_FROM_NUMBER` | Optional verified Twilio sender number for phone features outside onboarding | Server/config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Required Firebase Admin credential for production Auth/Firestore; must belong to project `nanoware-ai` | Server secret only |
| `APP_SECRET` | Admin-notify bearer comparison | Server secret; fail closed, rotate |

Vercel does not provide Google Application Default Credentials to this server runtime. Create a service account in Firebase project `nanoware-ai`, grant only the Firebase Admin permissions required by this application, serialize the downloaded JSON as one Vercel Production secret value, and redeploy. The application validates that the credential `project_id` matches the checked-in Firebase client project before using it. Never commit or log the JSON. The supplied web configuration includes the verified web app ID and measurement ID; no named Firestore database ID was supplied, so the client and Admin SDK use the project’s default Firestore database.

Values are not reproduced here. Confirm every runtime variable, secret manager, rotation policy, and environment separation before deployment.

## Email delivery and policy note

Email is sent through a non-pooled Nodemailer SMTP transport. The transport requires `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`; absent or malformed configuration fails closed. Successful delivery requires a nonempty SMTP message ID, acceptance of the target recipient, and no rejected recipients. Authentication and connection errors are logged only with safe protocol codes.

Zoho states that exact SMTP server details depend on account type and data center; verify the host in Zoho Mail's Server Configuration Details before deployment. Zoho's published Mail usage policy lists automated and transactional email, bulk mail, marketing mail, and newsletters as unsupported. The SMTP transport switch does not establish provider approval for those use cases. Use a Zoho product explicitly designed for transactional or campaign delivery, or obtain written confirmation for the intended workload.

Business onboarding does not require SMS or Twilio configuration. Shared phone-verification utilities remain fail-closed when used by other features: absent provider configuration never marks a phone verified. The supported phone countries remain India (`+91`), United States (`+1`), Canada (`+1`), Australia (`+61`), and United Kingdom (`+44`); a configured Twilio account that rejects a request returns a safe provider-failure message.

## Legacy business verification migration plan

This plan is not executed by the application or this PR. Before enabling the strict Firestore rules in production, an admin-only, MFA-gated, dry-run migration should enumerate active `businesses` missing `verificationStatus`, record counts and owners without exporting private evidence, and write an explicit status through an audited server transaction. Businesses with authoritative existing evidence may be reviewed and written as `verified`; all others must be written as `pending_verification` and re-enter the business-domain email review flow. The job must be idempotent, preserve memberships and projects, create one audit event per decision, and be run in staging before production. No automatic legacy approval is permitted.
