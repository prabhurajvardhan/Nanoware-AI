# System Architecture

- **Document ID:** ARCH-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Current verified architecture
Next.js App Router serves UI and route handlers. Firebase client SDK is used in browser components; Firebase Admin is used in server helpers/actions. Email actions use a server-only Nodemailer SMTP transport with strict recipient-acceptance confirmation and bounded timeouts. The audit pipeline fetches and parses external websites. Persistence is split: current audit route is process memory while an Admin helper targets Firestore.

## Proposed target
```text
Public/Owner UI
  -> request validation + session verification
  -> application services (tenant, booking, assistant, billing)
  -> Firestore repositories (businessId-scoped)
  -> async job/outbox workers
  -> email/payment/model adapters
```

Use repositories/services to centralize authorization, schema validation, idempotency, and audit events. Keep provider calls outside UI components. Add queues only after a verified hosting/runtime choice.

## Deployment boundaries
Separate browser-safe config, server secrets, database rules, provider webhooks, worker runtime, and operator tooling. Exact infrastructure is UNVERIFIED.
