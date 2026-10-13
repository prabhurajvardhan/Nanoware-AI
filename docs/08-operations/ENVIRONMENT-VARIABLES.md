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
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin credential | Server secret only |
| `APP_SECRET` | Admin-notify bearer comparison | Server secret; fail closed, rotate |

Values are not reproduced here. Confirm every runtime variable, secret manager, rotation policy, and environment separation before deployment.
