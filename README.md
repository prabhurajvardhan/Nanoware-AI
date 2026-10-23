<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c55b3822-7db9-404f-bd5a-b22b9046ae91

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` using the checked-in [.env.example](.env.example) as a template to your Gemini API key
3. Run the app:
   `npm run dev`


## Engineering documentation

The implementation-ready product, architecture, audit, task, testing, and operations documentation is indexed at [`docs/00-bible/00-MASTER-INDEX.md`](docs/00-bible/00-MASTER-INDEX.md). Start with the [repository audit](docs/01-audit/REPOSITORY-AUDIT.md) and [TASK-001](docs/06-task-specifications/TASK-001-BASELINE-AUDIT.md).

The current application is documented separately from the proposed multi-tenant SaaS target. Documentation uses VERIFIED, INFERRED, UNVERIFIED, and PROPOSED evidence labels.

The current User Mode, Client Mode, trial, and billing implementation status is documented in the [Batch 4 implementation report](docs/BATCH-4-IMPLEMENTATION-REPORT.md), including verified checks and external blockers.

## Authentication and billing setup

### Firebase Google Sign-In

In Firebase Console, open **Authentication → Sign-in method**, enable **Google**, choose the support email, and add the deployed app domain under **Authentication → Settings → Authorized domains**. The existing Firebase web configuration is used; no second authentication system is introduced. If an email/password account already owns an email address, the login page does not silently merge credentials: the user must sign in with the existing method and link Google through an explicitly authenticated account-settings flow.

### Razorpay test mode

Create matching monthly Daken and Daken+ Plans in Razorpay test mode, then set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_DAKEN_PLAN_ID`, `RAZORPAY_DAKEN_PLUS_PLAN_ID`, `DAKEN_CHECKOUT_ENABLED`, `DAKEN_PLUS_CHECKOUT_ENABLED`, and `APP_URL` as server-only environment variables. Keep both rollout flags false until subscription creation, webhook verification, and entitlement checks pass. The Razorpay plan amount and currency must match the unchanged plan catalogue. Daken² uses a custom sales enquiry and has no fixed-price checkout. The application never accepts a plan ID, amount, business ID, role, or subscription status as authoritative client input.

Configure a Razorpay Subscriptions webhook at `${APP_URL}/api/billing/webhook` and set its secret as `RAZORPAY_WEBHOOK_SECRET`. Enable the subscription events `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.completed`, `subscription.updated`, `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`, and `subscription.cancelled`. Access is granted only after a valid signed event reports an `active` subscription; pending, authenticated, halted, cancelled, completed, expired, and unknown states do not grant paid-tool access. Owners/admins can request cancellation at the end of the current billing cycle from Billing settings.

See Razorpay's official guides for [creating subscriptions](https://razorpay.com/docs/payments/subscriptions/create/), [webhook signature validation](https://razorpay.com/docs/webhooks/validate-test/), [subscription webhook events](https://razorpay.com/docs/webhooks/subscriptions/), and [subscription cancellation](https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription/).

The customer is redirected to the Razorpay subscription authorisation link. Redirects do not grant entitlements; only the signed, deduplicated webhook updates subscription state. No live credentials, production configuration, deployment, or merge is performed by this change.

### Production Firebase Admin requirement

The server session endpoint uses Firebase Admin to verify ID tokens and issue the HttpOnly `__session` cookie. Vercel does not provide Application Default Credentials for this runtime, so production must define `FIREBASE_SERVICE_ACCOUNT_JSON` as a single secret containing the Firebase service-account JSON for project `nanoware-ai`. In Vercel: **Project Settings → Environment Variables → Add** `FIREBASE_SERVICE_ACCOUNT_JSON` for **Production**, paste the complete JSON value, save, and redeploy. Do not commit the JSON or place it in client-exposed variables. The application rejects missing, malformed, or project-mismatched credentials and returns a generic temporary-availability response rather than bypassing token verification.

The session endpoint is explicitly pinned to the Node.js runtime, validates same-origin session-establishment requests, requires a recent Firebase sign-in before creating a five-day cookie, and returns redacted request IDs for diagnostics. The client establishes the server session only from the explicit login flow; the auth-state observer does not repost stale ID tokens.

The merged production deployment was confirmed through GitHub’s Vercel deployment status for commit `d26ffde`. The public endpoint currently returns an HTML 500 rather than the route’s JSON diagnostic response. Vercel function logs and environment values are not readable from this repository connection, so after deploying this follow-up, verify one controlled `POST /api/auth/session` response and inspect the matching `x-request-id` in Vercel logs. Do not treat the issue as resolved until that live check passes. Import-boundary analysis and the production verification checklist are in [docs/AUTH-SESSION-IMPORT-BOUNDARY-REPORT.md](docs/AUTH-SESSION-IMPORT-BOUNDARY-REPORT.md).

### Email delivery through Zoho SMTP

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` as server-only Vercel environment variables. `SMTP_PASS` should be an app-specific password when Zoho account security requires one. `EMAIL_FROM` must be the authenticated mailbox or a sender alias configured and verified in Zoho Mail; a differing address produces a safe warning code and may be rejected by Zoho if it is not an allowed alias. The application defaults to the Zoho India SMTP host requested for this account and uses SSL on the default port; check the Server Configuration Details in the Zoho account before deployment because Zoho says endpoints can vary by account and data center. Never expose these variables with a `NEXT_PUBLIC_` prefix or commit their values.

**Provider policy warning:** although this application can route its existing messages through SMTP, Zoho's published Mail usage policy lists automated and transactional email, bulk mail, marketing mail, and newsletters as unsupported. Confirm the intended operational workload is permitted before enabling this transport in production. Do not build announcements on this SMTP account; use a dedicated campaign product for opted-in announcements and a transactional-email product for verification, OTP, and other automated messages.


## Daken plan configuration

The configured catalogue is Daken ($9 USD/month: 2 GB storage, 2,000,000 monthly tokens, unlimited bookings), Daken+ ($19 USD/month: 5 GB storage, 5,000,000 monthly tokens, unlimited bookings), and Daken² (custom pricing and negotiated allowances). The first two remain unavailable for checkout until matching Razorpay monthly plan IDs are set and their explicit server-side rollout flags are enabled after feature-readiness checks. Daken² deliberately has no fixed-price Razorpay checkout; customers submit a sales enquiry through Client Mode. Legacy Starter/Pro plan identifiers remain hidden from new sales but available for existing subscription reconciliation.

A one-time seven-day trial is created server-side for an eligible business owner and is not reset by creating another owned workspace. Existing business verification gates remain in effect. Trial start/expiry is persisted; the trial is denied access to workspace operations after expiry, while records are retained and the billing/upgrade path remains accessible.

The current repository does not make AI model calls or persist provider-reported token usage, and it has no atomic storage meter. The application must not claim that token or storage consumption is tracked until those provider and persistence paths are implemented; the User Mode dashboard marks the metrics unavailable rather than estimating them.
