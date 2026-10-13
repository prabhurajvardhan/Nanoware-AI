# Task Dependency Graph

- **Document ID:** FLOW-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

```text
001 Baseline audit
 ├─> 002 Authentication review
 ├─> 003 Tenant data isolation
 └─> 004 Data/API contracts
      ├─> 005 Business provisioning
      │    └─> 006 Domain routing
      └─> 007 Public page/services
           ├─> 008 CRM
           └─> 009 Booking engine
                ├─> 010 Customer assistant
                └─> 011 Owner dashboard
                     └─> 012 Usage metering
                          └─> 013 Billing
                               └─> 014 Operations/admin
                                    └─> 015 Production validation
```
Tasks may be parallelized only when their dependency evidence is complete and they do not modify the same schema/policy without coordination.
