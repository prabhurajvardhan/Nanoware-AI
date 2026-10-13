# Error Handling and Recovery

- **Document ID:** ARCH-007
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Classify errors as validation, authentication, authorization, conflict, rate-limit, dependency, or internal. Return stable public codes and correlation IDs. Retry only idempotent operations with bounded exponential backoff and jitter. Use an outbox/idempotency record for emails, usage, payment events, and booking transitions. Provider outages must degrade safely: do not confirm a booking without durable state or verified availability.
