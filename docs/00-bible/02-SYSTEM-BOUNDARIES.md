# System Boundaries

- **Document ID:** BIBLE-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Verified boundary

The repository contains a Next.js App Router web application. Browser code uses Firebase Auth/Firestore; server code uses route handlers, server actions, Firebase Admin, and Resend helpers. `middleware.ts` gates selected paths using an `authToken` cookie. No provider deployment manifest was found.

## Proposed boundary

```text
Browser/public page -> Next.js UI/API -> authenticated application services
                                      |-> Firestore (tenant data)
                                      |-> identity provider
                                      |-> payment provider (webhooks)
                                      |-> email/notification provider
                                      |-> model/retrieval provider
```

## Trust boundaries

- Browser input is untrusted, including IDs, URLs, booking data, and assistant messages.
- Public visitor to public-page API is unauthenticated and rate-limited.
- Authenticated owner to tenant APIs is trusted only after server-side identity and membership checks.
- Admin operations are a separate privileged boundary and must be audited.
- Provider webhooks are untrusted until signature and replay checks succeed.

## In scope for target product

Business identity, memberships, configuration, public content, services, availability, customers, conversations, booking requests, usage events, subscription state, notifications, administration, and observability.

## Explicitly unresolved

Hosting, DNS, provider credentials, data residency, retention periods, privacy/legal text, payment provider, AI model provider, and migration ownership.
