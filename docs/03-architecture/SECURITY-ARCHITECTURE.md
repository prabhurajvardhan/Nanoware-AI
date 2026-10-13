# Security Architecture

- **Document ID:** ARCH-008
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Defense in depth: schema validation; verified identity; membership policy; repository tenant scope; Firestore rules; safe public projections; rate limits; SSRF controls for crawler; signed webhook verification; secrets only server-side; redacted structured logs; dependency scanning; negative tests.

High-risk surfaces from the audit are the public request write, public crawler, Admin SDK, OTP flow, email endpoints, and future assistant tools. Treat each as a separate threat-model item with abuse cases and evidence.
