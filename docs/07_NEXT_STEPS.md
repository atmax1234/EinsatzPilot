# Next Steps

## Completed gate

Phase 6 — Job Cost Ledger is complete in the verified local setup.

- All ten migrations are applied to PostgreSQL.
- Job cost lines cover material purchase/use, labor, travel, external service, fees, and other costs.
- Cost lines are scoped to company and job; optional Item references are tenant-validated.
- Quantity is positive, monetary values are nonnegative, tax metadata is bounded, and one currency is enforced per job.
- Material, labor, and travel totals are derived by the backend from quantity times unit cost. External, fee, and other lines may use a validated manual total.
- OWNER/OFFICE can create and update; WORKER can read but cannot write.
- The job detail uses real API data for cost entry, editing, line review, and category/grand totals.
- The expanded smoke flow preserves Phase 1/2/3/4/5 checks and covers Phase 6 calculations, updates, summaries, item validation, roles, wrong-job access, and tenant isolation.

## Recommended next implementation slice

Begin `Phase 7 — Customer/Object Report Generator` only after confirming the Phase 6 migration, Prisma validation/generation, root typecheck, API/web builds, expanded smoke flow, and diff checks remain clean.

Phase 7 should turn governed operational data into clean customer-facing report data. It should combine the job and customer/object context with reviewed findings, work performed, photos/evidence, follow-up state, and backend-derived cost summaries. The first slice should define reproducible report snapshots and inclusion rules; it must not issue invoices, take payments, or automatically send unreviewed documents.

## Required scope

- Define a tenant-safe customer/object report record or snapshot owned by company and grounded in one job.
- Include customer, address, object, and job context without removing legacy Job text fields.
- Include only explicitly selected or approved reports/findings and durable attachment references.
- Include work performed, outstanding work/follow-up notes, and the current governed job cost summary where selected.
- Record who generated the snapshot, when it was generated, and which source records/versions were included.
- Add OWNER/OFFICE generation/update controls and company-member read behavior in service logic.
- Add minimal real-API job-detail visibility for generating and reviewing report data.
- Expand smoke coverage without weakening Phase 1-6 assertions.

## Still out of scope

- Invoice or offer issuance, payment handling, numbering, and accounting export.
- Automatic customer sending or unreviewed AI-generated official content.
- Recurring service contracts.
- Item movement, stock, warehouse, delivery, or custody workflows.
- Command-center dashboard, drag-and-drop, QR/barcodes, AI/automation, or mobile features.

## Known current limitations

- Job cost lines are editable current state and have no delete/correction event history or approval workflow.
- Tax rate is stored as metadata and does not calculate net/gross tax totals.
- Cost summaries support one currency per job; currency conversion is absent.
- Receipt references are text and cost lines do not directly own receipt attachments.
- Report review decisions are terminal; worker editing/resubmission and review correction are not implemented.
- Attachments remain in local filesystem storage without production retention or object storage.

## Exact recommended prompt

```text
Read `/docs` first.

Implement:

`Phase 7 — Customer/Object Report Generator`

Before coding, verify all ten migrations are applied and Prisma validate/generate, `pnpm typecheck`, `pnpm build`, `pnpm smoke:api`, and `git diff --check` pass. Stop if existing Phase 1/2/3/4/5/6 smoke coverage breaks.

Add a tenant-safe, job-grounded customer/object report snapshot foundation that turns jobs, customer/address/object context, approved or explicitly selected findings, work performed, outstanding/follow-up notes, photo/file evidence references, and backend-derived job cost summaries into clean reproducible customer-facing report data.

Keep source inclusion explicit and record generator, generation time, and source identities/versions. OWNER/OFFICE may generate or update report snapshots; company members may read according to existing job access rules. Add strict service validation, shared contracts/schema helpers, minimal real-API job-detail generation/review UI, expanded smoke coverage, and documentation updates.

Preserve all existing tenant, role, Job lifecycle, directory, item, assignment, report/review, attachment, and cost-ledger behavior. Do not add invoice or offer issuance, payment handling, automatic sending, recurring contracts, item movement, warehouse/logistics behavior, command-board drag-and-drop, QR/barcodes, AI/automation, or mobile features.
```
