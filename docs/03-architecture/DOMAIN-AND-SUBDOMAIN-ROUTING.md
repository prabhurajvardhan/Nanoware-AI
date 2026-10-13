# Domain and Subdomain Routing

- **Document ID:** ARCH-006
- **Status:** DRAFT
- **Last updated:** 2026-10-13

The roadmap proposes `business.nanowareai.in`; domain ownership and DNS are **UNVERIFIED**. Proposed resolution: normalize host -> reject unknown/unsafe host -> resolve active business by verified slug/custom-domain mapping -> render only published public projection -> cache with safe invalidation. Never use an arbitrary host header as tenant proof. Test unknown hosts, suspended businesses, lookalike slugs, preview URLs, and cache isolation.
