# Deployment Runbook

- **Document ID:** OPS-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Provider is UNVERIFIED. Generic safe procedure: freeze release commit -> build in clean environment -> run tests -> review env/secrets -> deploy to staging -> apply rules/index/migrations with backup -> run smoke/security/tenant tests -> approve production -> monitor -> retain rollback artifact. Never run provider-specific commands until ownership and target are confirmed. Roll back app artifact first when safe; handle data migrations with forward-compatible recovery.
