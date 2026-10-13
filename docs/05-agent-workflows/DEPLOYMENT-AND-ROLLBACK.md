# Deployment and Rollback

- **Document ID:** FLOW-007
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Before deployment, verify target provider, artifact, environment, rules/index plan, migration checkpoint, health checks, and rollback artifact. Roll back application code independently from data migrations; never assume reversing code reverses data. For a security incident, disable the feature/key, preserve evidence, rotate affected secrets, and follow [incident response](../08-operations/INCIDENT-RESPONSE.md). Provider-specific commands remain UNVERIFIED.
