# API Audit

- **Document ID:** AUDIT-004
- **Status:** IN_REVIEW
- **Last updated:** 2026-10-13

## Verified routes

- `POST /api/audit`: accepts JSON `{url,email?}`, normalizes/validates URL, crawls synchronously, stores report in process memory, returns an audit ID.
- `GET /api/audit?id=...`: reads the process-local map; without ID lists recent in-memory entries.
- `POST /api/email/request-solution`: sends user/admin email through server helper.
- `POST /api/email/admin-notify`: uses an `APP_SECRET` bearer comparison with a development fallback visible in source.

## Risks

The audit route is a public outbound fetch surface and needs SSRF controls, timeouts, response-size limits, redirect policy, concurrency limits, and abuse protection. It returns `details: String(error)` on failures. The in-memory map is not durable or shared across instances. Email endpoints require schema validation, authentication/authorization decisions, rate limiting, and safe error responses.

## Target API rules
Define versioned schemas, correlation IDs, consistent error envelopes, idempotency keys for mutations, tenant resolution from verified identity, and provider adapters. See [API contracts](../03-architecture/API-CONTRACTS.md).
