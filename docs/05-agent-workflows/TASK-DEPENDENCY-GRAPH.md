# Task Dependency Graph

- **Document ID:** FLOW-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

## Source of truth
This graph is derived from the `Dependencies` field in every file under `docs/06-task-specifications/`. A task is not ready to start until every direct dependency is complete and its evidence is available.

```text
TASK-001 Baseline audit
  └─> TASK-002 Authentication review
       └─> TASK-003 Tenant data isolation
            └─> TASK-004 Data and API contracts
                 ├─> TASK-005 Business provisioning
                 │    └─> TASK-006 Domain routing
                 │         └─> TASK-007 Public page and services
                 │              ├─> TASK-008 CRM
                 │              │    └─> TASK-009 Booking engine
                 │              │         ├─> TASK-010 Customer assistant
                 │              │         │    └─> TASK-012 Usage metering
                 │              │         │         └─> TASK-013 Billing
                 │              │         │              └─> TASK-014 Operations and admin
                 │              │         │                   └─> TASK-015 Production validation
                 │              │         └─> TASK-011 Owner dashboard
                 │              │              └─> TASK-012 Usage metering
                 │              └─> (no independent branch)
                 └─> (transitive prerequisites retained in task metadata)
```

## Direct dependency table

| Task | Declared direct dependencies |
|---|---|
| 001 | none |
| 002 | 001 |
| 003 | 001, 002 |
| 004 | 001, 003 |
| 005 | 002, 003, 004 |
| 006 | 005 |
| 007 | 004, 005, 006 |
| 008 | 003, 004, 007 |
| 009 | 004, 007, 008 |
| 010 | 007, 009 |
| 011 | 008, 009 |
| 012 | 009, 010, 011 |
| 013 | 012 |
| 014 | 002, 003, 012, 013 |
| 015 | 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014 |

## Rules
No task is intentionally independent except TASK-001. There are no cycles. Redundant transitive dependencies are retained where declared; they must not be removed silently. The validation script checks every task file, every declared edge, graph membership, and cycles before this documentation is considered complete.
