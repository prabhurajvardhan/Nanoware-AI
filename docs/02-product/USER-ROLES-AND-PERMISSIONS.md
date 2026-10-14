# User Roles and Permissions

- **Document ID:** PROD-002
- **Status:** DRAFT
- **Last updated:** 2026-10-13

| Role | Scope | Can | Cannot |
|---|---|---|---|
| Public visitor | Published business | Read public projection, submit bounded request | Read CRM, private booking details, billing, internal notes |
| Member | One business | Read assigned operational data, send workspace feedback | Change configuration or billing, manage members, access other businesses |
| Admin | One business | Manage operational configuration, projects, services, hours, and members | Change ownership or billing, access other businesses |
| Owner | One business | Configure business, services, hours, members, bookings, and billing | Access another tenant |
| Platform operator | Platform | Support/admin workflows with audited break-glass access | Browse tenant data without reason/scope |
| System worker | Specific job/provider event | Perform only declared idempotent operation | Act on arbitrary tenant IDs from untrusted input |

Every permission must be enforced server-side and tested at object, collection, and provider-tool boundaries.
