# Implementation and Testing

- **Document ID:** FLOW-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

For each logical change: define contract -> implement validation/policy -> add unit tests -> implement service/repository -> add integration tests -> wire API/UI -> add regression/security tests -> run lint/typecheck/build and the verified test suite. Use fixtures for two businesses and an attacker user. Never rely on a green UI test as proof of server authorization.
