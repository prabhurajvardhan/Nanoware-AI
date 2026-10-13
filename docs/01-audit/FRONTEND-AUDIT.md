# Frontend Audit

- **Document ID:** AUDIT-005
- **Status:** IN_REVIEW
- **Last updated:** 2026-10-13

## Verified routes and UI areas

App Router pages include public marketing/research/services/contact pages, `/login`, `/dashboard`, `/projects`, `/admin`, `/audit/[id]`, and calculator/report flows. Shared components include navigation, footer, auth provider, chat widget, visual networks, and audit sections.

## Verified behavior

Firebase listeners in dashboard pages query projects by `userId` and subcollections by order. Contact submits a Firestore request. The global chat widget contains a comment that production AI API integration is future work. The dashboard and admin UI are not evidence of server-side authorization.

## Target UX requirements
Every tenant view needs loading, empty, forbidden, stale, retry, and mutation-confirmation states. Public pages must use an allowlisted projection; owner pages must not render data merely because a client query returned it. Preserve existing public routes during migration and add route regression tests.
