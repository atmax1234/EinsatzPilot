# Next Steps

## End-of-session checkpoint

Phase 7 — Customer/Object Report Generator Foundation is implemented on top of the already verified Phase 5 execution-report and Phase 6 job-cost foundations.

### Phase 7 implemented behavior

- `CustomerReportSnapshot` is a company-owned aggregate created from one tenant-validated Job. Optional Job, Customer, Address, Object, and ObjectArea identity links are retained alongside copied display/context values.
- Types are `JOB_COMPLETION`, `INCIDENT`, `DAMAGE_REPORT`, `MAINTENANCE`, `OBJECT_STATUS`, `COST_OVERVIEW`, and `OTHER`.
- Statuses are `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, and `ARCHIVED`. Allowed transitions are `DRAFT -> READY_FOR_REVIEW|ARCHIVED`, `READY_FOR_REVIEW -> DRAFT|APPROVED`, and `APPROVED -> ARCHIVED`; `ARCHIVED` is terminal.
- Only `DRAFT` allows changes to report type, title, recipient, period, authored summaries, cost note, and internal notes. The source selection and copied context are immutable after creation.
- Creation copies a schema-versioned, timestamped Job/directory snapshot and retains legacy `Job.customerName` and `Job.location` fallbacks when structured links are absent.
- JobReport inclusion is explicit and limited to reports in `APPROVED` review state. Selected report order, structured work/finding/follow-up content, actor/reviewer/team context, review state, and timestamps are copied.
- Attachment inclusion is explicit. The snapshot copies stable metadata/reference fields and order, including attachment ID, optional JobReport ID, kind, filename, MIME type, size, caption, and timestamps. It does not embed file bytes; the current UI opens the original locally stored attachment by ID.
- Selected cost lines are copied with detailed values, optional Item/vendor/receipt/tax metadata, source timestamps, order, and a backend-derived selected-line summary. `includeFullCostSummary` can additionally copy the full Job's grouped backend summary without copying every unselected line.
- Transitioning to `READY_FOR_REVIEW` requires authored content or at least one selected report, attachment, or nonempty cost source. Approval stores the actor and timestamp. Creation and status transitions create readable Job activity while the Job relation exists.
- Customer-report reads, source-data reads, creates, draft updates, and status transitions are all backend-restricted to `OWNER` and `OFFICE`; `WORKER` is denied. Company scope comes from the authenticated membership.

### Implemented API and web surface

- `GET /api/jobs/:jobId/customer-report-source-data`
- `GET /api/customer-reports` with optional `jobId` and `status` filters
- `POST /api/customer-reports`
- `GET /api/customer-reports/:reportId`
- `PATCH /api/customer-reports/:reportId`
- `PATCH /api/customer-reports/:reportId/status`
- `/customer-reports` lists and filters real snapshots.
- `/customer-reports/new?jobId=...` loads real eligible sources and creates a draft with explicit report, attachment, selected-cost, and full-cost-summary choices.
- `/customer-reports/[reportId]` displays copied context, report content, evidence, cost breakdowns, approval attribution, draft editing, and allowed lifecycle actions.
- OWNER/OFFICE navigation and Job detail link to the customer-report workflow; WORKER does not receive those entry points.

## Checkpoint validation

On 2026-08-03, all eleven migrations were applied and current on the local PostgreSQL database. Focused Prisma/schema/contracts/API checks, root `pnpm typecheck`, root `pnpm build`, and `pnpm smoke:api` passed. The smoke flow passed all 163 assertions: the 121 Phase 1-6 predicates remained intact and 42 new Phase 7 predicates cover source/context eligibility, snapshot contents and stability after live-source mutations, selected and full cost data, list/detail/draft updates, lifecycle/activity, OWNER/OFFICE behavior, WORKER denial, wrong-Job sources, and cross-tenant isolation. `git diff --check` also passed for this handoff. Lint/test scripts remain placeholders and were not counted as quality checks. The smoke command creates additional development records in the local database by design.

## Next recommended phase

The next recommended phase is exactly:

`Phase 7B — Customer Report Polish and PDF Readiness`

This is an implementation phase on top of the existing persisted snapshot, not a redesign of Phase 7 and not a claim that PDF export already exists. A coherent slice can improve the customer-readable layout, add a browser print view, separate customer-visible output from office-only internal notes, prepare reusable rendering/template boundaries, and clarify source-selection and selected-versus-full-cost UX. Any preview or print surface must render persisted snapshot data rather than silently resolving current mutable source records.

## Known current limitations

- There is no generated PDF/file artifact, server-side PDF/export endpoint, print-specific route or stylesheet, template/version model, customer portal, download history, or email delivery.
- There is no explicit customer-report revision, supersession, or correction chain. Different source selection requires a separate unlinked report.
- Snapshot sources cannot be refreshed or reselected after creation, including while the report is a draft.
- Attachment metadata is copied, but file bytes remain in local filesystem storage and still depend on the original attachment ID and retention.
- Internal notes appear in the office detail UI; a later customer-facing view must deliberately exclude them.
- Tax rates and receipt references are metadata. There is no net/gross tax calculation, invoice issuance, payment, or accounting behavior.
- The optional full-cost snapshot contains grouped totals; detailed copies exist only for explicitly selected cost lines.
- Customer reports are single-Job grounded. Multi-Job object-history reports and object-only generation are absent.
- Authentication remains development-only, and lint/test scripts remain placeholders.

## Explicitly deferred

Do not add invoice or offer issuance, payments, customer email sending, AI summaries, recurring contracts, item movement or logistics, warehouse behavior, command board, drag-and-drop, QR/barcodes, or mobile features. Invoice and email behavior require separate later approval; Phase 7B does not authorize them.

## Exact recommended prompt

```text
Read `/docs` first.

`Phase 7B — Customer Report Polish and PDF Readiness`

This is an implementation session. Preserve the implemented Phase 7 CustomerReportSnapshot ownership, source-snapshot invariants, lifecycle, tenant isolation, and OWNER/OFFICE-only access. First inspect the Prisma model/migration, shared contracts and schema helpers, customer-report API services/controllers, attachment access, the current `/customer-reports` pages and Job-detail integration, and Phase 1-7 smoke coverage. Verify the baseline before changing behavior.

Implement a focused polish/readiness slice on the real persisted snapshot data. Improve the customer-readable report layout and information hierarchy; make office-only internal notes unmistakably separate and exclude them from any customer-facing or print presentation; add a practical browser print view or print stylesheet; extract reusable presentation/template boundaries where they reduce future PDF-export risk; and improve source-selection clarity, eligibility feedback, ordering, and selected-versus-full-cost explanation without weakening backend validation. A print-ready browser view is not a generated PDF. Do not implement or claim actual PDF generation/export in this slice; that requires separate later approval.

Render only stored CustomerReportSnapshot data in preview/print output. Do not silently reread mutable Job, Customer, Address, Object, ObjectArea, JobReport, attachment metadata, or JobCostLine values. Preserve attachment authorization and make any missing-original-file limitation honest. Keep lifecycle and source immutability unless a narrowly required change is explicitly justified, migrated, contracted, tenant-checked, and smoke-covered.

Run relevant Prisma checks if the schema changes, focused package/API/web typechecks, production builds, the full PostgreSQL smoke flow, and `git diff --check`. Update the affected docs and checklist with only verified behavior.

Do not implement invoice or offer issuance, payments, customer email sending, AI summaries, recurring contracts, item movement/logistics, warehouse behavior, command-board drag-and-drop, QR/barcodes, or mobile features. Invoice and email behavior are forbidden unless separately approved in a later phase.
```
