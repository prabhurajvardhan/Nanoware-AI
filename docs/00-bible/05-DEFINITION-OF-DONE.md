# Definition of Done

- **Document ID:** BIBLE-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

A task is done only when:

- Its scope and non-goals match the task specification.
- Code and data changes are listed, including migrations and rollback steps.
- Unit, integration, security, and regression tests appropriate to risk pass.
- Cross-tenant access is denied in negative tests.
- Logs and metrics are sufficient to diagnose failure without secrets or sensitive payloads.
- Documentation links resolve and current/proposed states are not conflated.
- No credentials, customer records, or provider assumptions were introduced.
- Reviewer sign-off is recorded for security-sensitive or schema-changing work.
