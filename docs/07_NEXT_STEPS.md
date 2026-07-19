# Next Steps

## Completed gate

Phase 5 — Job Execution Reports / Worker Findings is complete in the verified local setup.

- All nine migrations are applied to PostgreSQL.
- Existing simple reports remain compatible as `GENERAL`/`SUBMITTED`.
- Structured findings, performed and outstanding work, follow-up data, reviewer attribution, and linked evidence are implemented.
- WORKER submission is limited to jobs reached through direct team membership, active user-to-job assignment, or active team-to-job assignment.
- OWNER/OFFICE can submit for any company job and make explicit approve, needs-revision, or reject decisions.
- Review decisions create readable `JobActivity`; WORKER review and cross-tenant report access are blocked.
- The real-data job detail and Reports pages display structured execution and review context.
- The expanded smoke flow preserves Phase 1/2/3/4 checks and covers Phase 5 compatibility, validation, roles, evidence, activity, and tenant isolation.

## Recommended next implementation slice

Begin `Phase 6 — Job Cost Ledger` only after confirming the Phase 5 migration, root typecheck, API/web builds, expanded smoke flow, and diff checks remain clean.

The purpose of Phase 6 is a tenant-safe, job-grounded money layer for actual operational costs. Cost lines should describe materials purchased or used, labor time, travel, external/subcontractor work, and custom expenses without turning items into a warehouse ledger or issuing invoices prematurely.

## Required scope

- Define additive company- and job-owned cost-line models with explicit cost kinds.
- Decide quantity, unit, unit price, totals, currency, tax boundary, dates, notes, actor, and correction behavior.
- Support optional Item references for material context without requiring catalog items for every expense.
- Keep totals backend-derived from validated persisted lines.
- Enforce OWNER/OFFICE write and company-member read rules in services.
- Add minimal real-API job cost entry/list/edit behavior and an invoice-ready summary that is clearly not an invoice.
- Expand smoke coverage without weakening Phase 1/2/3/4/5 assertions.
- Update current-state, domain, dependency, roadmap, next-step, checklist, and README documentation.

## Guiding workflow

After an approved incident finding at `Musterstr. 1`, the office should record labor time, travel, purchased replacement material, and any external plumber cost against the same job. The resulting summary should be understandable and ready to support a later customer report, offer, or invoice workflow, but it must not issue commercial documents in Phase 6.

## Still out of scope for Phase 6

- Offers, invoices, payment, numbering, or accounting integration.
- Customer PDF/report generation.
- Recurring service contracts.
- Item movement, stock, warehouse, delivery, or custody workflows.
- Command-center dashboard, drag-and-drop, QR/barcodes, AI/automation, or mobile features.

## Known report limitations

- Review decisions are terminal in Phase 5; worker editing/resubmission and review correction are not implemented.
- Active generic assignment access is status-based and does not interpret assignment date windows.
- Attachments remain in local filesystem storage without production retention or object storage.
- The Reports overview hydrates job details rather than using a dedicated paginated company report endpoint.
- Review output is operational state, not a customer-facing generated document.

## Exact recommended prompt

```text
Implement `Phase 6 — Job Cost Ledger`.

First read `/docs` and verify that all Phase 5 migrations are applied and that Prisma validation/generation, root typecheck, API/web builds, the expanded smoke flow, and git diff checks are clean. Stop if existing Phase 1/2/3/4/5 smoke coverage breaks.

Add an additive, tenant-safe job cost ledger for material purchases/use, labor time, travel costs, external/subcontractor costs, and custom cost lines. Define strict cost kinds, quantities/units, amounts, currency and tax boundaries, actor attribution, notes, dates, correction/update rules, and backend-derived invoice-ready summaries. Item references must be optional supporting context and must belong to the active company when provided.

Enforce OWNER/OFFICE writes and company-member reads in service/business logic, preserve all existing Job, report/review, attachment, assignment, directory, item, role, lifecycle, and tenant behavior, add shared contracts/runtime validation, minimal real-API job cost UI, expanded smoke coverage, and documentation updates. Do not add invoice issuance, payment handling, PDF generation, recurring contracts, item movement, warehouse/logistics behavior, command-board drag-and-drop, QR/barcodes, AI/automation, or mobile features.
```
