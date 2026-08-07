# Next Steps

## End-of-session checkpoint

Phase 7B — Customer Report Polish and PDF Readiness is implemented on the Phase 7 immutable `CustomerReportSnapshot` foundation.

### Phase 7B implemented behavior

- `/customer-reports` now exposes report number, title, type, status, recipient/customer, object/area/address, linked Job reference/title, creation time, approval time, and a direct open action in a scan-friendly table.
- `/customer-reports/new?jobId=...` makes the selected Job and copied customer/address/object context explicit. Every execution report shows its review status and a precise eligibility explanation; only backend-approved options are enabled.
- Attachment selection now states that the snapshot copies metadata and a reference, not file bytes. The office receives an explicit warning that the original currently depends on local attachment storage.
- Cost selection distinguishes individual copied detail lines from the optional full backend-derived Job summary. A live pre-submit summary shows selected report, evidence, and cost-line counts plus the full-summary choice. The client does not invent a selected monetary summary; the backend creates the governed snapshot totals.
- Internal notes are labelled as office-only during creation and draft editing. Detail renders them once in a separate internal panel marked as excluded from customer output.
- Detail has a reusable customer-document component with a stronger header, recipient/customer context, object/address/Job context, authored issue/findings/work/follow-up sections, copied approved reports, evidence metadata references, selected cost details, optional grouped costs, status, and stored approval time.
- The customer component receives the detail object only after `internalNotes`, `createdBy`, and `approvedBy` projections are removed. It performs no API calls and does not resolve original attachment files.
- A `Browserdruck oeffnen` control calls the browser print dialog. A4-oriented print CSS hides the sidebar, links/actions, forms, lifecycle controls, flash messages, internal notes, live actor attribution, source diagnostics, and original attachment controls while keeping the customer document readable.

## Snapshot and permission boundary

The customer/print presentation renders only persisted `CustomerReportSnapshot` scalar fields plus its versioned `snapshotSourceData` and `snapshotCostBreakdown`. It does not reread mutable `Job`, `Customer`, `Address`, `Object`, `ObjectArea`, `JobReport`, `JobCostLine`, or attachment metadata records. Evidence is printed as the copied caption/filename/type/size/date reference only.

Original attachment files remain separately available to the office through the existing authorized attachment route. The file bytes are not part of the snapshot and may be missing from local storage; the UI says so rather than claiming embedded or durable availability.

Phase 7B changed no Prisma schema, migration, shared contract, API route/service, permission, lifecycle rule, source immutability rule, concurrency check, or JobActivity behavior. OWNER/OFFICE-only customer-report access and WORKER denial remain backend-enforced.

## Checkpoint validation

On 2026-08-07, all eleven migrations were applied/current on a local PostgreSQL 16 instance. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The unchanged smoke flow still passes all 163 assertions: 121 Phase 1–6 predicates plus 42 Phase 7 predicates covering source eligibility, copied snapshot content, internal-note persistence, detail stability after live-source mutations, lifecycle/activity, OWNER/OFFICE behavior, WORKER denial, wrong-Job rejection, and tenant isolation.

No API smoke assertions were added because Phase 7B is presentation-only and its relevant backend invariants were already covered. The print boundary, print selectors, internal-note exclusion, and evidence-reference behavior were inspected in code and compiled in the production Next.js build. There is no automated browser-print or pagination regression suite; long reports should still be reviewed in Chromium/Edge A4 print preview during normal acceptance.

## Known current limitations

- Browser print exists, but there is no generated PDF/file artifact, server-side PDF generator, export/download endpoint, template/version model, customer portal, download history, or email delivery.
- Browser pagination, user-selected print margins, and optional browser headers/footers can vary.
- Attachment metadata is copied, but file bytes remain in local filesystem storage and depend on the original attachment ID and retention.
- There is no customer-report revision, supersession, correction chain, source reselection, or snapshot refresh. A different source set requires a separate unlinked report.
- Customer reports remain grounded in one Job. Multi-Job object-history aggregation and object-only generation are absent.
- Tax rates, vendor data, and receipt references remain copied metadata. No tax calculation, invoice, offer, payment, accounting, or commercial issuance behavior exists.
- Authentication remains development-only, and lint/test scripts remain placeholders.

## Next recommended phase

The next recommended phase is exactly:

`Phase 8 — Recurring Service Contracts Foundation`

Phase 7B now has a complete enough snapshot presentation and browser-print boundary that a separate Phase 7C is not the default. Phase 8 should add the smallest durable object/customer-grounded recurring-service model with explicit schedule/timezone and idempotent Job-generation semantics. Generated Jobs must remain normal governed operational records.

## Explicitly deferred

Do not add actual PDF generation/export, invoice or offer issuance, payments, customer email sending, AI summaries, item movement/logistics, warehouse behavior, command board, drag-and-drop, QR/barcodes, or mobile features. Those require separate later approval and prerequisites.

## Exact recommended prompt

```text
Read `/docs` first.

`Phase 8 — Recurring Service Contracts Foundation`

This is an implementation session. Preserve the verified Phase 1–7B tenant isolation, role enforcement, Job lifecycle, assignments, worker findings, Job costs, immutable CustomerReportSnapshot behavior, and browser-print/customer-visible presentation boundary. Inspect the current Customer, Object, Job, Assignment, report, cost, Prisma migration, shared-contract, API, web, and smoke implementations before changing behavior; verify the baseline first.

Implement the smallest durable recurring-service foundation for object- and customer-grounded service definitions. Define explicit company ownership, lifecycle, service/template content, recurrence schedule and timezone rules, start/end behavior, exception handling, and idempotent Job-generation semantics before adding convenience UI. Generated Jobs must remain normal governed operational records and repeated generation must not create duplicates. Add shared contracts, strict runtime validation, tenant-safe OWNER/OFFICE write rules and deliberate WORKER read behavior, additive migration(s), focused real-API administration, Job/Object integration where useful, JobActivity or an explicit audit decision where generation changes work, and representative happy-path, validation, role, idempotency, and cross-tenant smoke coverage.

Do not implement browser-only reminders, hidden timezone assumptions, automatic commercial commitments, invoice or offer issuance, payments, customer email sending, AI summaries, item movement/logistics, warehouse behavior, command-board drag-and-drop, QR/barcodes, mobile workflows, or actual PDF generation/export. Preserve browser print as print-only readiness, not a generated artifact.

Run Prisma validate/generate and migration status, focused checks, root `pnpm typecheck`, root `pnpm build`, full `pnpm smoke:api`, and `git diff --check`. Update affected docs/checklist with only verified behavior and report exact results and limitations.
```
