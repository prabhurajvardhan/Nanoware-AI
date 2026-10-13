# Agent Operating Protocol

- **Document ID:** BIBLE-004
- **Status:** DRAFT
- **Last updated:** 2026-10-13

Before changing code, read the master index, relevant audit, feature, task, architecture, and test documents. Inspect the current tree and status. Do not infer a file path from this specification without confirming it.

For each change:
1. State the objective and non-goals.
2. Record affected files and data/security impact.
3. Implement the smallest coherent change.
4. Run the narrowest relevant test, then the full verified suite.
5. Inspect the diff for secrets, tenant leaks, unintended app changes, and stale links.
6. Update the linked documentation and completion report.
7. Stop on unresolved security or migration ambiguity rather than guessing.

Evidence labels are mandatory. “Implemented” requires code plus passing acceptance evidence; a planned file or interface is not implementation evidence.
