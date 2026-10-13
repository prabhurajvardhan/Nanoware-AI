# API Contracts

- **Document ID:** ARCH-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Common envelope

Success: `{ data, requestId }`. Error: `{ error: { code, message, retryable, requestId }, data: null }`. Never return stack traces, provider secrets, or private tenant data to public callers.

## Proposed endpoints

| Method/path | Auth | Idempotency |
|---|---|---|
| `POST /api/v1/businesses` | authenticated | registration key |
| `GET/PATCH /api/v1/businesses/{id}` | member/owner | patch version |
| `GET /api/v1/public/{slug}` | public | n/a; allowlist |
| `POST /api/v1/public/{slug}/booking-requests` | public | required key |
| `GET/POST /api/v1/bookings` | member/owner | mutation key |
| `POST /api/v1/assistant/messages` | authenticated/public context | message key |
| `POST /api/v1/webhooks/{provider}` | signed provider | event ID |

These are proposed contracts, not current routes. Existing `/api/audit` and email routes require hardening before reuse.
