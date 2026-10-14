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

## Authentication and billing setup

### Firebase Google Sign-In

In Firebase Console, open **Authentication → Sign-in method**, enable **Google**, choose the support email, and add the deployed app domain under **Authentication → Settings → Authorized domains**. The existing Firebase web configuration is used; no second authentication system is introduced. If an email/password account already owns an email address, the login page does not silently merge credentials: the user must sign in with the existing method and link Google through an explicitly authenticated account-settings flow.

### Stripe test mode

Create test-mode Products and recurring Prices in Stripe, then set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, and `APP_URL` in the server environment. The application never accepts a price ID, plan price, business ID, role, or subscription status as authoritative client input.

Configure a Stripe webhook endpoint at `${APP_URL}/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Enable the Stripe Customer Portal in test mode if customers should manage payment methods and invoices. Subscription access is granted only for provider-verified `active` or `trialing` state; `past_due`, cancelled, and expired states do not grant paid-tool access.

The Checkout success URL is informational only. Entitlements are written by the signed webhook handler, which records event IDs and ignores out-of-order events. No live credentials, production configuration, deployment, or merge is performed by this change.

### Production Firebase Admin requirement

The server session endpoint uses Firebase Admin to verify ID tokens and issue the HttpOnly `__session` cookie. Vercel does not provide Application Default Credentials for this runtime, so production must define `FIREBASE_SERVICE_ACCOUNT_JSON` as a single secret containing the Firebase service-account JSON for project `nanoware-ai`. In Vercel: **Project Settings → Environment Variables → Add** `FIREBASE_SERVICE_ACCOUNT_JSON` for **Production**, paste the complete JSON value, save, and redeploy. Do not commit the JSON or place it in client-exposed variables. The application rejects missing, malformed, or project-mismatched credentials and returns a generic temporary-availability response rather than bypassing token verification.

The session endpoint is explicitly pinned to the Node.js runtime, validates same-origin session-establishment requests, requires a recent Firebase sign-in before creating a five-day cookie, and returns redacted request IDs for diagnostics. The client establishes the server session only from the explicit login flow; the auth-state observer does not repost stale ID tokens.

The merged production deployment was confirmed through GitHub’s Vercel deployment status for commit `d26ffde`. The public endpoint currently returns an HTML 500 rather than the route’s JSON diagnostic response. Vercel function logs and environment values are not readable from this repository connection, so after deploying this follow-up, verify one controlled `POST /api/auth/session` response and inspect the matching `x-request-id` in Vercel logs. Do not treat the issue as resolved until that live check passes.
