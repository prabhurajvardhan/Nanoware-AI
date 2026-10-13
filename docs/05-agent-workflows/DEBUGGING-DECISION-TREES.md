# Debugging Decision Trees

- **Document ID:** FLOW-005
- **Status:** DRAFT
- **Last updated:** 2026-10-13

**Unauthorized/forbidden:** verify identity -> membership -> role -> resource business ID -> rules/Admin policy -> logs. **Duplicate side effect:** inspect idempotency key/event ID -> transaction/outbox -> retry path. **Provider error:** classify retryable -> check persisted state -> retry boundedly or surface recovery. **Data leak:** reproduce with tenant A/B -> stop rollout -> add negative test -> review logs/caches/projections.
