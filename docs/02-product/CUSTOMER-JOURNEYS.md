# Customer Journeys

- **Document ID:** PROD-003
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Visitor
Discover page -> inspect services/hours -> ask question -> submit booking details -> receive acknowledgement -> await owner decision. Errors must preserve entered data safely and never reveal private records.

## Owner
Register -> verify identity -> provision workspace -> configure profile/services/hours -> publish -> receive request -> confirm/reschedule/decline -> review customer history.

## Operator
Authenticate with privileged control -> select business and reason -> perform bounded action -> audit event -> exit break-glass context.

## Failure journeys
Provisioning retry, unknown business URL, unavailable provider, conflicting slot, duplicate request, expired session, and assistant refusal must each have a visible recovery path and an auditable server event.
