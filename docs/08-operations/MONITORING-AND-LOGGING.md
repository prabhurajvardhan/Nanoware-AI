# Monitoring and Logging

- **Document ID:** OPS-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Track request rate, latency, 4xx/5xx, auth failures, cross-tenant denials, booking conflicts, provisioning retries, queue lag, provider failures, webhook replay/signature failures, usage reconciliation, and notification delivery. Logs require timestamp, environment, route, correlation ID, business ID where allowed, actor class, outcome, and error code—never tokens, OTPs, full prompts, payment data, or unnecessary personal data.
