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
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Required Firebase Admin credential for production Auth/Firestore; must belong to project `nanoware-ai` | Server secret only |
| `APP_SECRET` | Admin-notify bearer comparison | Server secret; fail closed, rotate |

Vercel does not provide Google Application Default Credentials to this server runtime. Create a service account in Firebase project `nanoware-ai`, grant only the Firebase Admin permissions required by this application, serialize the downloaded JSON as one Vercel Production secret value, and redeploy. The application validates that the credential `project_id` matches the checked-in Firebase client project before using it. Never commit or log the JSON. The checked-in public web configuration does not include an app ID or named Firestore database ID because those values were not available from the existing project’s public configuration; the client and Admin SDK therefore use the project’s default Firestore database.

Values are not reproduced here. Confirm every runtime variable, secret manager, rotation policy, and environment separation before deployment.
