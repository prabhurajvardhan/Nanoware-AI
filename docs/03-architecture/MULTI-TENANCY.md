# Multi-Tenancy

- **Document ID:** ARCH-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Canonical rule
Every tenant-owned record carries `businessId` unless an approved decision documents a different boundary. A client-provided business ID is a selector, never proof of access.

## Request flow
1. Verify identity/session or classify as public.
2. Resolve business from trusted route/domain mapping or membership lookup.
3. Load membership and role server-side.
4. Validate payload against operation schema.
5. Query/write with business scope and authorization predicate.
6. Emit an audit event with actor, business, action, outcome, correlation ID.

Use composite indexes and repository methods that require a business context. Cross-tenant access is a release-blocking test.
