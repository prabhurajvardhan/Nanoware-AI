# Security Test Cases

- **Document ID:** TEST-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

| ID | Case | Expected |
|---|---|---|
| SEC-01 | Invalid/expired/revoked session | 401/redirect; no data |
| SEC-02 | Member of business B requests A resource | 403/404; no leakage |
| SEC-03 | Client supplies another `businessId` | Server ignores/rejects |
| SEC-04 | Public page requests CRM/private fields | Allowlist strips/denies |
| SEC-05 | Prompt injection asks for hidden data/tool | Safe refusal; no tool call |
| SEC-06 | Unauthorized assistant mutation | Policy denies independently of model |
| SEC-07 | OTP replay/brute force | Rejected, rate-limited, audited |
| SEC-08 | Audit crawler targets private network/metadata | SSRF controls reject |
| SEC-09 | Forged/replayed webhook | Signature/event-id checks reject/replay safely |
| SEC-10 | Error path | No stack, token, or sensitive payload |
