# Database and Rules Audit

- **Document ID:** AUDIT-003
- **Status:** IN_REVIEW
- **Last updated:** 2026-10-13

## Verified collections and access

| Collection/path | Evidence | Current behavior |
|---|---|---|
| `requests/{id}` | `firestore.rules`, `app/contact/page.tsx`, `app/admin/page.tsx` | Anyone may create; admin may read/update/delete. |
| `admins/{uid}` | rules and admin page | Signed-in users may read; writes denied. |
| `projects/{id}` | login/dashboard and rules | Authenticated user creates own project; owner/admin reads; admin-only update/delete. |
| `projects/{id}/steps` | dashboard/rules | Owner/admin read; admin writes. |
| `projects/{id}/activities` | dashboard/rules | Owner/admin read; admin writes. |
| `users/{uid}` | sign-up page | Client writes are attempted; no explicit rule match was found, so global deny applies. |
| `audits/{id}` | `lib/firebase/auditService.ts` | Admin SDK helper reads/writes; route currently uses in-memory storage instead. |
| `admin_otps/{email-key}` | `app/admin/auth-actions.ts` | Admin SDK stores and deletes OTP records; rules do not govern Admin SDK. |

## Findings

The global deny rule is a safe default, but public `requests` creation has no visible schema validation, size limit, abuse control, or rate limit. Admin SDK bypasses rules and needs application authorization. Current data is not tenant-modeled with `businessId`; `userId` scopes legacy projects only.

## Target constraint
All new tenant-owned records must carry canonical `businessId`; server-side membership checks must precede reads and writes. Design migrations before changing existing collections.
