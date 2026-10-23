# Batch 4 — Unified business platform implementation report

**Branch:** `feature/modes-crm-bookings-client-portal`
**Base:** `phase1/business-verification-gate` (rebased; authentication/session files were not modified).
**Status:** Implemented locally; not deployed or merged.

## Implemented

- Added a persistent, responsive User Mode / Client Mode switcher to the authenticated desktop and mobile navigation. Mode preference is stored per identity; route layouts require a verified server session.
- Added tenant-scoped CRM APIs and UI for customer creation, listing/search, editing, notes/tags, soft archiving, and a persisted customer activity panel. Contact matching uses normalized email/phone within the business; names alone are not used to merge records.
- Added manual booking APIs and UI for listing, creation, cancellation, completion/no-show, and rescheduling. Booking creation uses idempotency keys, business-local time validation, weekly availability, DST rejection for ambiguous/nonexistent times, atomic quarter-hour locks, and linked customer-history entries. Business timezone and availability remain server-authoritative.
- Added a server-authorized analytics endpoint for counts/status/source and recent persisted activity. Token and storage metrics are explicitly unavailable, not estimated.
- Added WhatsApp AI agent settings and a truthful disconnected/not-activated boundary. Activation is blocked unless a verified connection exists; the repository does not yet include the Meta authorization/webhook/agent runtime.
- Added authenticated Client Mode service requests, unique references, idempotency, private per-user request history, rate limiting, and MFA-protected admin status/customer-update operations. Added the Daken² sales-enquiry service; it does not create a fixed-price checkout.
- Centralized Daken ($9/month, 2 GB, 2,000,000 monthly tokens, no booking quota), Daken+ ($19/month, 5 GB, 5,000,000 monthly tokens, no booking quota), and Daken² (custom allowances) configuration. Legacy Starter/Pro identifiers remain hidden from new sales for existing-subscription reconciliation. Daken/Daken+ checkout stays disabled until matching Razorpay monthly plan IDs and explicit server-side rollout flags are configured.
- Removed the prior payment-gateway integration and dependency in favor of Razorpay Subscriptions. Server-side checkout resolves Razorpay monthly Plan IDs from environment configuration, creates hosted subscription authorization links, and prevents parallel pending or already-active subscriptions. Raw-body `X-Razorpay-Signature` HMAC-SHA256 verification, required provider event IDs, duplicate suppression, plan/business metadata checks, stale-event protection, fail-closed lifecycle mapping, and owner/admin cycle-end cancellation are implemented. Entitlements change only through verified webhook state.
- Added a one-time, owner-claimed, server-recorded seven-day Daken trial and remaining-time display. Trial claims are atomic across an owner's workspaces; expired unpaid trials receive a server-side 402 response while billing remains reachable and customer data is retained.
- Added the required Firestore composite indexes and regression tests.

## Important implementation files

- `components/ModeSwitcher.tsx`, `components/Navigation.tsx`, `app/workspace/layout.tsx`, `app/client-mode/layout.tsx`
- `app/workspace/page.tsx`, `components/CustomerHistoryPanel.tsx`, `lib/workspace/records.mjs`
- `app/api/workspace/**`, `app/api/business/trial/route.ts`, `lib/billing/trial.ts`
- `app/client-mode/page.tsx`, `app/api/client-requests/route.ts`, `app/api/admin/service-requests/**`
- `lib/billing/config.ts`, `app/billing/page.tsx`, `app/api/billing/plans/route.ts`, `firestore.indexes.json`

## Validation performed

- `npm run test:workspace` — **14 passed, 0 failed**.
- `npm run test:security` — **61 passed, 0 failed**.
- Razorpay HMAC/status/config/cancellation regression tests are included in `npm run test:security`.
- `./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — **passed**.
- `npm run lint` — **passed**.
- `npm run build` — **passed**; Next.js compiled and generated the production route manifest.
- `git diff --check` — **passed**.
- `firestore.indexes.json` and `package.json` — valid JSON.

No live Firestore, Razorpay, Meta, or production-hosting operation was performed.

## Required setup and known limitations

1. Create Razorpay monthly Plans matching the existing plan catalogue and set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_DAKEN_PLAN_ID`, and `RAZORPAY_DAKEN_PLUS_PLAN_ID` server-side. Optionally set `RAZORPAY_SUBSCRIPTION_TOTAL_CYCLES` (default 1200 monthly cycles). Configure the Subscriptions webhook; only set `DAKEN_CHECKOUT_ENABLED` / `DAKEN_PLUS_CHECKOUT_ENABLED` true after end-to-end provider and entitlement checks. No Razorpay credentials or plan IDs were supplied, so checkout remains unavailable. Daken² is sales enquiry only.
2. Meta WhatsApp Business integration is not connected. A Meta developer app with WhatsApp product/Embedded Signup, business and phone-number approval, app credentials, webhook callback/signature settings, secure token storage, and a verified connection/health workflow is still required. No number is presented as connected, and WhatsApp-originated bookings/conversation history are not implemented.
3. This repository has no model-call path that returns provider token usage and no atomic storage meter. The configured token/storage allowances are displayed, but consumption, remaining quota, monthly resets, concurrent token reservations, and storage-limit enforcement are **not implemented**. Daken+ advanced analytics and evidence-backed marketing recommendations are also not implemented; no fabricated values are shown.
4. The Firestore index definitions are in source but were not deployed. Deploy them through the project's authorized Firebase process before relying on indexed queries in production.
5. No live database-backed end-to-end test or deployment was performed. Existing deployment/session configuration should be verified independently before release.
