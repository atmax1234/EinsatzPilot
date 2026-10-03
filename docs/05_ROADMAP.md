# Roadmap

Phases are dependency order, not calendar promises. EinsatzPilot is a modular all-in-one operations platform for everyday work across business types and industries. Facility, Hausmeister, cleaning, and gardening workflows are the first proof workflows, not the final boundary. The operating principle is **specific execution, broad architecture**.

## Phase 0 — Protect and verify existing foundation

**Status:** Implemented baseline and continuously reverified.

**Goals:** Protect tenant isolation, roles, teams, jobs, lifecycle, activity, reports, attachments, migrations, builds, and smoke coverage.

## Phase 1 — Customers, addresses, objects

**Status:** Implemented and verified in schema, migration, shared contracts, API, simple web administration, and the expanded PostgreSQL smoke flow.

**Purpose:** Establish customer/Verwaltung and object memory for operational work.

## Phase 2 — Link jobs to customers/objects/addresses

**Status:** Implemented and verified while preserving required `customerName` and `location` compatibility fields.

**Purpose:** Ground recurring, one-time, incident, and follow-up jobs in real customer and object context.

## Phase 3 — Items/materials/assets supporting foundation

**Status:** Implemented and verified.

**Purpose:** Provide stable optional identities for materials, tools, consumables, and assets referenced by jobs, costs, purchases, or proof. This is supporting context, not an inventory-product pivot.

## Phase 4 — Generic assignments

**Status:** Implemented and verified while keeping `Job.teamId` working and independent.

**Purpose:** Provide the control layer for responsibility and supporting-resource allocation without building a command board yet.

## Phase 5 — Job Execution Reports / Worker Findings

**Status:** Implemented and verified with an additive migration, shared contracts, tenant-safe service rules, explicit review transitions, real-data web flows, and expanded Phase 1-5 smoke coverage.

**Goals:** Evolve current reports and attachments additively to capture findings, issue condition, work performed, work still needed, follow-up required, photos/evidence, worker attribution, submission, and office review. Preserve existing report and attachment behavior.

**Product outcome:** A worker visit produces structured, reviewable operational proof that can drive follow-up work, costs, and customer communication.

**Must not build yet:** Cost accounting, PDF generation, recurring job generation, command-board drag-and-drop, or AI-generated official records.

## Phase 6 — Job Cost Ledger

**Status:** Implemented and verified with an additive migration, shared contracts/schema helpers, tenant-safe API rules, backend-derived summaries, real-data job-detail UI, and expanded Phase 1-6 smoke coverage.

**Goals:** Record job-grounded material purchases/use, labor time, travel costs, external/subcontractor costs, and custom cost lines. Define units, amounts, currency/tax boundaries, actor/review behavior, corrections, and invoice-ready summaries.

**Dependencies:** Stable jobs and reviewed execution findings. Item references are optional supporting context, not mandatory inventory transactions.

**Implemented boundary:** Cost lines are editable operational records with actor attribution. Material/labor/travel totals derive from quantity and unit cost; external/fee/other totals may be manual. One currency is enforced per job. No delete/correction history, approval lifecycle, invoice issuance, payment, tax calculation, accounting export, or item movement exists.

## Phase 7 — Customer/Object Report Generator

**Status:** Implemented and migrated with shared contracts/schema helpers, tenant-safe OWNER/OFFICE-only API rules, stable job-grounded source snapshots, a real reviewable web UI, job activity, and expanded Phase 1-7 smoke coverage.

**Goals:** Assemble clean customer-facing damage, maintenance, service, proof-of-work, and object-history report data from jobs, reviewed findings, photos, work performed, cost summaries, and follow-up notes. Define reproducible snapshots and explicit inclusion rules before adding presentation/export channels.

**Dependencies:** Reviewed execution findings, stable attachment IDs/metadata with the local-storage limitation documented, object/customer context, and governed cost summaries where included.

**Implemented boundary:** Creation requires one tenant-owned Job and copies versioned job/directory context, explicitly selected `APPROVED` JobReports, explicitly selected attachment metadata references, selected cost-line details/summaries, and optionally the full backend-derived Job cost summary. Authored fields are editable only in `DRAFT`; copied sources are immutable. Lifecycle is `DRAFT -> READY_FOR_REVIEW -> APPROVED -> ARCHIVED`, with the allowed return from `READY_FOR_REVIEW` to `DRAFT`, direct draft archival, and terminal archival. OWNER/OFFICE alone can read or manage customer reports. The UI supports list/filter/create/review/edit/status flows against the real API.

**Known boundary:** There is no linked revision/supersession/correction chain, source refresh/reselection, multi-job object-history aggregation, production attachment retention, rendered file, PDF export, print template, customer portal, invoice, payment, or email delivery.

## Phase 7B — Customer Report Polish and PDF Readiness

**Status:** Implemented and verified as a web-only presentation slice. PDF generation/export is not implemented.

**Goals:** Improve the existing customer-report presentation and information hierarchy, make selected-source review clearer, define customer-visible versus internal-only fields, add a deliberate print view if justified, prepare the PDF-export boundary, and establish practical template behavior without weakening snapshot reproducibility.

**Dependencies:** The implemented Phase 7 snapshot contract, stable attachment access, explicit permissions, and a documented rendering/template strategy. Any eventual PDF artifact must be generated from persisted snapshot data rather than silently rereading current Job, directory, report, attachment metadata, or cost state.

**Implemented boundary:** The list is easier to scan; creation explains source eligibility, attachment-reference limitations, selected cost details versus the optional full grouped summary, and the exact selected counts. Detail uses a reusable customer-visible component that receives stored snapshot data without internal notes or live actor projections. A browser-print button and A4 print stylesheet hide the admin shell, controls, diagnostics, original-file actions, and internal notes. Evidence is printed as stored metadata references. No Prisma, API, lifecycle, permission, or shared-contract change was required.

**Must not build without separate later approval:** Actual PDF generation/export, invoice or offer issuance, payments, customer email sending, AI summaries, recurring contracts, item movement/logistics, command-board interactions, drag-and-drop, QR codes, or mobile flows. Phase 7B preparation must not be presented as working PDF export.

## Phase 8 — Daily Worksheets / Team Protocols Foundation

**Status:** Implemented and verified with an additive migration, shared contracts/schema helpers, tenant-safe role and relation rules, a real office/worker web workflow, and expanded smoke coverage.

**Goals:** Give the office a dated execution paper for a team and/or worker, preserve ordered free-text planning alongside optional customer/address/object/object-area/Job context, deliberately send and lock planning, let assigned workers record actual work and submit, and let the office review and archive.

**Implemented boundary:** `WorkdaySheet` and `WorkdaySheetRow` are company-owned. Lifecycle is forward-only `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED`. OWNER/OFFICE manage planning, send, review, and archive. Assigned WORKER users see sent-or-later sheets, edit only row `actualText` in `SENT`, and must complete every row before submission. Workers do not receive office internal notes. Cross-tenant relation IDs use safe not-found behavior.

**Must not build yet:** Automatic follow-up conversion, recurring service agreements, generated future Jobs, command-board interactions, or a parallel Job system.

## Phase 8B — Daily Worksheets Usability and Hardening

**Status:** Implemented and verified without a schema migration.

**Goals:** Make the Phase 8 worksheet workflow immediately easier to scan, execute, review, and print while preserving the existing aggregate, lifecycle, role boundaries, and distinction from Jobs.

**Implemented boundary:** The role-aware list accepts exact date/status/team/worker filters and shows clearer German status, assignment, row, and completion information. A dedicated today endpoint and `/workday-sheets/today` page give assigned workers current rows, actual-text entry, guarded submission, and a small upcoming-sent view. Row context, time ranges, completion, review actors/times/notes, and locked states are clearer. Detail has A4-oriented browser-print styling that excludes navigation, controls, and office-internal notes. Status-scoped transactional guards prevent row writes from racing past send/submit transitions. No Prisma model or lifecycle state changed.

**Still not implemented by Phase 8B itself:** Phase 9 conversion actions, generated PDF/export artifacts, recurring service agreements, generated future Jobs, automatic downstream records, command-board behavior, or mobile workflows. The separate Phase 9 follow-up-Job slice described below is now implemented.

## Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports

**Status:** In progress. The follow-up Job foundation is implemented and verified; cost/report actions remain deferred to Phase 9B.

**Goals:** Let OWNER/OFFICE deliberately act on reviewed worksheet rows by creating governed follow-up Jobs, attaching appropriate cost/report records, or preparing billable/customer-communication inputs. Retain immutable source identity/text snapshots, actor/time audit, downstream links, action status, and idempotency so retries and repeated review cannot duplicate records.

**Dependencies:** Reviewed Phase 8 sheets/rows, existing Job lifecycle, Job cost/report rules, and tenant-safe source/destination validation.

**Implemented first slice:** `WorksheetReviewAction` records one `CREATE_FOLLOW_UP_JOB` action per reviewed source row. OWNER/OFFICE explicitly provides and previews normal Job fields; row relations are copied by default but may be deliberately changed or cleared with tenant validation. The source worksheet/row text and context are stored as a schema-versioned immutable JSON snapshot alongside actor/time, completion status, request fingerprint, and destination Job identity. Job, activity, and action are committed atomically. An identical retry returns the original result; a changed retry returns conflict. WORKER, non-reviewed/archived, wrong-row, and cross-tenant requests cannot create an action.

**Next slice:** Phase 9B may add explicit cost-line and structured report/finding actions only when a tenant-owned target Job is selected or already established. Each action must use the existing cost/report models, validation, permissions, and lifecycle and must preserve the same provenance/idempotency guarantees.

**Must not build yet:** Silent conversion during review, automatic customer messages, Communication Hub/email delivery, Document Studio, invoices/offers/payments, AI summaries, or a second Job lifecycle.

## Phase 10 — Service Agreements / Recurring Object Duties

**Goals:** Model object/customer-grounded expected duties, reusable planning text, cadence/timezone, effective dates, exceptions, and lifecycle. Agreements should feed flexible worksheet planning inputs close to execution time.

**Dependencies:** Stable worksheet planning and review/follow-up flow plus explicit scheduling/timezone semantics.

**Must not build yet:** Rigid bulk generation of future Jobs, browser-only recurrence, hidden scheduling assumptions, or automatic commercial commitments.

## Phase 11 — Command Center Dashboard

**Goals:** Provide a company-wide operational overview of worksheets, Jobs, teams, assignments, reports awaiting review, costs, objects, incidents, follow-up work, and recurring duties using trusted server-backed metrics.

**Dependencies:** Stable upstream workflows and defined meanings for every count and status.

**Must not build yet:** Drag-and-drop unless assignment commands, conflicts, permissions, and atomic updates are mature; no fake dashboard data.

## Phase 12 — Smart Planning / AI / Automation

**Goals:** Assist with German customer replies, report summaries, planning suggestions, job creation from messages, follow-up suggestions, and offer/invoice drafting. Add event-driven automation only with idempotency, permissions, auditability, and human review.

**Dependencies:** Trusted worksheets, Jobs, findings, reports, costs, customer context, and stable operational workflows.

**Must not build yet:** Autonomous high-impact actions, opaque cross-tenant data use, or AI as a substitute for missing business rules.

## Optional later infrastructure — Item Movement History

Item movement may be implemented later for a demonstrated need such as tool custody, asset traceability, regulated material history, or installation/removal evidence. It is not the next default phase, is not required for job costs or customer reports, and must not turn EinsatzPilot into a warehouse or logistics product.
