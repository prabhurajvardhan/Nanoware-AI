# Product Requirements

- **Document ID:** PROD-001
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Proposed core journey
1. A business registers.
2. A workspace and owner membership are provisioned.
3. The owner configures profile, services, hours, and booking policy.
4. A public business page is published at a resolved business URL.
5. A customer asks questions or submits a booking request.
6. The owner manages customers, conversations, and bookings.
7. Usage is attributed to the business and the owner can upgrade.

## Functional requirements

| ID | Requirement | Acceptance signal |
|---|---|---|
| PR-01 | Tenant has owner/member roles | Membership authorization tests pass |
| PR-02 | Public projection is allowlisted | Private-field leakage test passes |
| PR-03 | Booking validates service, time, and policy | Invalid/conflict tests pass |
| PR-04 | Assistant can answer only from approved knowledge and tools | Prompt-injection/tool-auth tests pass |
| PR-05 | Usage event is idempotent and attributable | Replay test yields one count |
| PR-06 | Billing state comes from verified provider events | Forged frontend claim is ignored |

Commercial assumptions from the supplied roadmap are **PROPOSED, not approved**: Free up to 10 qualified booking requests/business/week; Pro US$40/month; guided setup US$200 one-time; `business.nanowareai.in`; voice later. Define “qualified” before implementation.
