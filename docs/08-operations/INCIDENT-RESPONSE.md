# Incident Response

- **Document ID:** OPS-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

1. Detect, classify severity, and assign incident owner.
2. Contain: disable feature/provider key/session, rate-limit, or isolate tenant as appropriate.
3. Preserve logs and evidence without copying secrets.
4. Assess affected tenants/data and notify authorized stakeholders under the applicable policy.
5. Eradicate, rotate credentials, patch, and add a regression test.
6. Recover via verified rollback/restore.
7. Write a post-incident report with timeline, impact, root cause, controls, and follow-up owner.

For suspected cross-tenant exposure, treat as critical and stop rollout until scope is understood.
