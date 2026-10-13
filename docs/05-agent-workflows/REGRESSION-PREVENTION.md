# Regression Prevention

- **Document ID:** FLOW-006
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Protect existing public routes, login, contact submission, dashboard, admin request workflow, and audit viewing with route-level smoke tests. Keep schema migrations backward-compatible until cutover. Use feature flags or staged rollout for target SaaS features. Review diffs for accidental `firestore.rules`, auth, config, and public projection changes.
