# Current Repository State

## Snapshot

This reflects the repository implemented and verified on 2026-10-02. Checked-in code is the source of truth if it later differs.

## Session handoff

- Phase 5 — Job Execution Reports / Worker Findings and Phase 6 — Job Cost Ledger remain implemented and smoke-proven.
- Phase 7 — Customer/Object Report Generator Foundation remains implemented with an additive migration, shared contracts, tenant-safe API rules, job-grounded stable snapshots, a real reviewable web UI, and expanded smoke coverage.
- Phase 7B — Customer Report Polish and PDF Readiness is implemented as a web-only presentation slice with no Prisma, API, lifecycle, permission, or shared-contract change.
- Phase 8 — Daily Worksheets / Team Protocols Foundation is implemented with an additive migration, shared contracts, strict payload validation, tenant-safe API rules, real office/worker web flows, and expanded smoke coverage.
- Phase 8B — Daily Worksheets Usability and Hardening is implemented without a schema change: exact list filters, a role-aware today query and worker view, completion/context/status polish, review/lock clarity, browser-print styling, and concurrency-safe worksheet writes are in place.
- The next recommended phase is exactly `Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports`.
- No worksheet follow-up conversion/action model exists yet. Reviewed rows do not silently create Jobs, costs, reports, billable items, or customer messages.
- Recurring service agreements are now a later dependency that should supply planning inputs to worksheets rather than generate rigid Jobs far in advance.
- Browser print exists. No generated PDF/export artifact, invoice issuance, payment, or email delivery exists today.

EinsatzPilot is a pnpm TypeScript monorepo:

- `apps/api`: NestJS API with Prisma and PostgreSQL.
- `apps/web`: Next.js office/admin application.
- `apps/mobile`: reserved Expo package, currently only a scaffold.
- `packages/types`: shared API and domain-facing TypeScript contracts.
- `packages/schemas`: enum lists and parsing helpers, not comprehensive runtime validation.
- `packages/config` and `packages/utils`: minimal placeholders.

## Backend modules

- **Auth:** development login, signed stateless token, session/logout responses, company-context lookup, and temporary development-header fallback. This is not production authentication.
- **Common context:** authentication and active-company guards and current user/company decorators.
- **Operations:** dashboard and company-member reads; team create/update/list and member add/remove; job create/update/list/detail, company-scoped relation options, and controlled status transitions.
- **Directory:** tenant-scoped customer, address, object, and object-area reads and writes. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Items:** tenant-scoped item-category and item reads and writes with strict kind, unit, tracking, quantity, lifecycle, category-relation, and custom-ID validation. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Assignments:** tenant-scoped typed source/target links with entity existence checks, creator attribution, timing validation, explicit lifecycle rules, active-duplicate protection, and real-data entity options. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Reports:** tenant-scoped legacy and structured job-report creation/listing, worker assignment access checks, linked attachment summaries, and explicit OWNER/OFFICE review decisions.
- **Job costs:** tenant-scoped job cost-line reads/writes, optional company-item validation, strict amount/currency/tax input rules, actor attribution, and backend-derived category/grand summaries. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Customer reports:** OWNER/OFFICE-only source reads and customer-report list/detail/create/update/status routes. Creation copies a job and its directory context plus explicitly selected approved job reports, attachment metadata references, selected cost lines, and an optional full backend-derived job-cost summary into versioned JSON snapshot data. Draft text and metadata remain editable only in `DRAFT`; source selection and copied context do not refresh after creation.
- **Workday sheets:** company-scoped list/detail/options/today/create/update/row/status routes. The list supports exact date, status, team, and worker filters and returns row/completion counts. The today route applies the same role-aware visibility and returns full visible rows. OWNER/OFFICE create and plan drafts, send them to a team and/or worker, review submissions, and archive reviewed sheets. Assigned WORKER users can read sent-or-later sheets, change only row `actualText` while `SENT`, and submit when every row has actual text. Free-text rows may optionally link to tenant-validated customer, address, object, object area, and Job records.
- **Attachments:** list/upload job attachments, metadata/file download, and company photo feed.
- **Prisma, health, foundation, and root metadata.**

Role rules currently allow `OWNER` and `OFFICE` to write jobs, teams, job costs, customer reports, and worksheet planning. All three roles can read general company artifacts and job cost lines and upload attachments, but customer-report source data and customer-report list/detail/write/status actions are restricted to `OWNER` and `OFFICE`. For workday sheets, OWNER/OFFICE can read all company sheets; WORKER can read only non-draft sheets assigned directly or through current team membership. Workers cannot plan, create, send, review, or archive sheets. OWNER/OFFICE can create job execution reports for any company job and review them. WORKER can create job execution reports only when the worker belongs to the job's direct team, has an active user-to-job assignment, or belongs to a team with an active team-to-job assignment. Job status transitions are `PLANNED -> IN_PROGRESS|CANCELED`, `IN_PROGRESS -> DONE|CANCELED`, and authorized reopening from `DONE -> PLANNED`; `CANCELED` is terminal.

Implemented customer-report endpoints are `GET /api/jobs/:jobId/customer-report-source-data`, `GET /api/customer-reports` with optional `jobId` and `status` filters, `POST /api/customer-reports`, `GET /api/customer-reports/:reportId`, `PATCH /api/customer-reports/:reportId`, and `PATCH /api/customer-reports/:reportId/status`. Company context comes from the authenticated membership; cross-company jobs, source IDs, and report IDs are rejected with tenant-safe not-found behavior.

Implemented worksheet endpoints are `GET /api/workday-sheets` with optional exact `date`, `status`, `teamId`, and `workerUserId` filters; `GET /api/workday-sheets/today`; `GET /api/workday-sheets/options`; `POST /api/workday-sheets`; `GET /api/workday-sheets/:sheetId`; `PATCH /api/workday-sheets/:sheetId`; `POST /api/workday-sheets/:sheetId/rows`; `PATCH /api/workday-sheets/:sheetId/rows/:rowId`; `DELETE /api/workday-sheets/:sheetId/rows/:rowId`; and `PATCH /api/workday-sheets/:sheetId/status`.

Implemented operational queries are company-scoped. The smoke script checks that a different tenant receives `404` for a job read. This is useful proof, but there is no automated unit/integration suite.

## Prisma models

The schema contains `Company`, `User`, `Membership`, `Team`, `TeamMember`, `Job`, `JobActivity`, `JobReport`, `JobAttachment`, `JobCostLine`, `CustomerReportSnapshot`, `WorkdaySheet`, `WorkdaySheetRow`, `Customer`, `Address`, `Object`, `ObjectArea`, `ItemCategory`, `Item`, and `Assignment`.

Customers have a typed category and active state. Addresses optionally belong to customers and may be reused by objects. Objects optionally reference a customer and address and contain one-level object areas. All four models carry `companyId`; API relation lookups validate the active tenant. No delete endpoints or hierarchical object areas exist.

Jobs still store required `customerName` and `location` strings and optionally reference one team. They may now also reference one customer, address, object, and object area. All relation lookups are scoped to the active company; an object area requires and must belong to the selected object. Relation changes create readable `JobActivity` notes. There is no automatic inference, backfill, snapshotting, or generic assignment relation.

Job reports now support `GENERAL`, `WORKER_FINDING`, `WORK_COMPLETION`, `INCIDENT_REPORT`, and `FOLLOW_UP_REQUEST` types; findings, performed and outstanding work; follow-up flags/notes; reviewer attribution; review notes; and explicit `SUBMITTED`, `PENDING_REVIEW`, `APPROVED`, `NEEDS_REVISION`, and `REJECTED` states. Existing simple payloads remain `GENERAL`/`SUBMITTED`; structured reports start `PENDING_REVIEW`. OWNER/OFFICE can make one terminal approve/revision/reject decision, which creates `JobActivity`. Attachments still use local filesystem storage and may link to a report.

Item categories are company-owned and have company-unique names, a kind, an active flag, and optional description. Items are company-owned, may link to one category from the same company, and have a company-unique custom ID. Missing custom IDs are generated in a safe `ITEM-...` form. Items explicitly store kind, unit, `QUANTITY` or `SERIALIZED` tracking mode, decimal quantity, lifecycle status, and optional description/notes. Serialized items must have quantity `1`; quantity items must be nonnegative. No delete, movement, custody, location, bundle, or QR behavior exists.

Assignments are company-owned typed links from one existing company entity to another. Closed entity types cover users, teams, jobs, customers, addresses, objects, object areas, and items. The API tenant-validates both endpoints, and USER endpoints require an active company membership. Assignment identity and kind are immutable; status, optional timing, and notes are editable. Status transitions are `PLANNED -> ACTIVE|CANCELED` and `ACTIVE -> ENDED|CANCELED`; ended/canceled assignments are terminal. Exact duplicate `ACTIVE` source/target/kind links are blocked in service and by a partial database unique index. `Job.teamId` remains independent and unchanged.

Job cost lines belong to one company and job and may optionally reference an item from the same company. Closed kinds cover material purchase/use, labor, travel, external service, fee, and other costs; closed units cover piece, time, distance, common material measures, flat rate, and other. Quantity is positive. Unit and total costs are nonnegative. Material, labor, and travel totals are always derived from quantity times unit cost; external, fee, and other lines may use a validated manual total. All lines on one job use one currency, defaulting to EUR. The model stores cost date, optional tax rate/vendor/receipt reference/notes, and creating/updating users. It does not issue invoices or move item quantity.

Customer report snapshots are company-owned and created from exactly one tenant-validated job, although the nullable database relation uses `onDelete: SetNull` so the copied record can remain readable if deletion is added later. Types are `JOB_COMPLETION`, `INCIDENT`, `DAMAGE_REPORT`, `MAINTENANCE`, `OBJECT_STATUS`, `COST_OVERVIEW`, and `OTHER`. Statuses are `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, and `ARCHIVED`; transitions are `DRAFT -> READY_FOR_REVIEW|ARCHIVED`, `READY_FOR_REVIEW -> DRAFT|APPROVED`, and `APPROVED -> ARCHIVED`, with `ARCHIVED` terminal. Only drafts allow authored-field edits. Approval records the actor and timestamp. Creation and every status transition append readable job activity while the job link exists.

Workday sheets are dated, company-owned execution papers with optional title, team, direct worker, internal office notes, review notes, lifecycle actors/timestamps, and ordered rows. Rows always contain nonblank `plannedText`, may contain `actualText`, notes, optional `HH:mm` times, and optional customer/address/object/object-area/Job links. All optional relations are service-validated against the active company; an object area requires and must match the selected object. The forward-only lifecycle is `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED`. Planning fields and rows are mutable only in `DRAFT`; assigned WORKER users may update only `actualText` in `SENT`; submission requires every row to have actual text; reviewed and archived content is locked. Actor/timestamp pairs and status/audit consistency are also protected by database constraints.

Creation runs in a repeatable-read transaction and stores schema-versioned source data with capture time, job/directory values, requested source IDs, and ordered copies of the selected source records. Only `APPROVED` job execution reports are eligible. Any job attachment may be explicitly selected; the snapshot copies its ID, optional report ID, type, filename, MIME type, size, caption, order, and upload/update timestamps, but it does not embed or duplicate the file binary. Job and structured directory values are copied with legacy `Job.customerName` and `Job.location` fallbacks. Source selection and copied context cannot be changed or refreshed after creation; a different selection requires a new unlinked customer report.

Selected cost lines are copied with their detailed monetary, item, vendor, receipt-reference, tax-metadata, and source-update fields plus a backend-derived selected-line summary. An independent `includeFullCostSummary` choice can also copy the full job's backend-derived grouped totals without copying every unselected line. The top-level snapshot total uses the full summary when included, otherwise the selected-line summary when lines were selected. This is reproducible report data, not tax calculation, invoice issuance, payment, accounting, or item movement.

Twelve migrations now cover identity, operations, the `SCHEDULED` to `PLANNED` rename, reports/files, the directory foundation, optional Job directory relations, the item/category foundation, generic assignments, structured execution reports/review, the job cost ledger, customer report snapshots, and the workday-sheet foundation. All twelve are applied to the local PostgreSQL database used for verification.

## Shared types and schemas

Shared types cover auth/session/company context; memberships; teams and members; jobs, optional directory relations, relation lookup options, activity, lifecycle and dashboard; structured reports and review; job cost lines and summaries; customer-report inputs, source options, list/detail responses, schema-versioned source/cost snapshots, and actor summaries; workday-sheet status, rows, inputs, list/detail/today responses, list filters, actors, relation options, and status actions; attachments; customers; addresses; objects; object areas; item categories; items; assignment inputs/responses; and assignment entity options. Shared enum lists/parsers include the worksheet lifecycle. Types do not exist for worksheet conversion actions, service agreements, movements, bundles, specialized assets, vehicles, billing, payments, PDF exports, delivery, or automation.

## Web state

The Next.js app has `/login`, `/dashboard`, `/jobs`, `/jobs/[jobId]`, `/teams`, `/reports`, `/customer-reports`, `/customer-reports/new`, `/customer-reports/[reportId]`, `/workday-sheets`, `/workday-sheets/today`, `/workday-sheets/[sheetId]`, `/customers`, `/objects`, `/objects/[objectId]`, `/items`, and `/assignments`. It stores the development token in an HTTP-only cookie and uses the real API for implemented flows. Job detail supports legacy/general and structured report submission, displays findings/work/follow-up/review data, keeps report-linked evidence visible, and shows review controls only to OWNER/OFFICE. It also displays backend-derived cost summaries and cost lines to all company roles, with minimal create/edit forms only for OWNER/OFFICE and optional item choices from the real API. Job create/edit forms expose optional live directory selectors while retaining required free-text customer and location fields.

The workday-sheet list is role-aware and supports date/status filters for every role plus team/worker filters for office users. It shows clearer German status badges, direct and team assignment, row completion counts/progress, filtered empty states, and direct open actions. Office users see all company sheets and a real create form; workers see only API-authorized assignments. Office creation supports a date, optional title, team/direct-worker assignment, internal notes, one initial planned row, and optional directory/Job relation selectors. Draft detail supports sheet editing and row add/edit/delete before send. The `/workday-sheets/today` view gives workers the current assigned rows, inline actual-text entry, guarded submission, and a short upcoming-sent list; office sees the company's current-day sheets. Detail displays time ranges and linked context, makes review actors/times/notes and locked states explicit, and provides an A4-oriented browser print view that hides controls and internal notes. This is browser print, not PDF export.

The customer-report web surface is visible only to OWNER/OFFICE in navigation and job detail. The list exposes report number/title/type, status, recipient/customer, object/address, Job reference, creation time, approval time, and a direct action. Creation makes the selected Job and copied context explicit, explains status-specific report eligibility, distinguishes attachment metadata references from file bytes, separates selected cost details from the optional full grouped Job summary, and provides a live selection-count summary before creation. The backend remains authoritative for every submitted source ID.

Detail now has a reusable customer-document boundary built only from stored `CustomerReportSnapshot` scalar/source/cost data. It presents recipient, customer, object/address/Job context, authored issue/findings/work/follow-up text, approved copied reports, evidence metadata references, cost detail/group summaries, report status, and stored approval time in a white A4-oriented layout. Browser print hides navigation, actions, forms, lifecycle controls, live actor projections, original-file controls, source diagnostics, and internal notes. Internal notes are structurally excluded from the presentation prop and displayed in a separate, clearly marked office-only panel. Original evidence links remain available only in office context and still depend on the locally stored attachment file.

The customer page supports customer/address listing, creation, and update. Object pages support listing, creation, detail/update, and object-area creation/update. The item page supports category and item listing, creation, and basic inline update. The assignment page uses grouped real-API entity options to create links and update status, notes, and timing.

Some copy in `admin-mvp.ts` is stale and describes already-connected areas as future work; verify pages and API calls rather than trusting that helper copy.

There is no generated PDF/export artifact, customer delivery/email, invoice/payment, command board, drag-and-drop, movement, custody, bundle, QR, recurrence, mobile workflow, AI screen, or template/version model. Browser print is a presentation feature, not PDF export.

## Mobile readiness

`apps/mobile` has package metadata, TypeScript config, a README, and one inert source marker that keeps the reserved package typecheckable. It has no screens, navigation, API integration, or declared Expo/React Native dependencies. Treat it as a reserved scaffold, not a working app. Offline behavior, upload resilience, device authentication, worker workflows, and mobile-specific API needs are unimplemented.

## Verification and known gaps

- PostgreSQL 16 is managed through the Podman helper in the verified local setup. The expanded smoke script covers directory CRUD, legacy and linked Job creation, Job relation updates/options/activity, item-category and item behavior, assignment create/list/detail/update/options, supported assignment shapes, duplicate/time validation, unchanged `Job.teamId`, legacy and structured reports, linked evidence, follow-up, office review, job-cost create/list/update/summary behavior, and the Phase 7 customer-report source, snapshot, lifecycle, permission, and tenant-isolation paths.
- Build/typecheck scripts exist. Lint/test scripts are placeholders and run no real checks.
- On 2026-10-02, all twelve migrations remained applied/current on PostgreSQL 16; Prisma validation/generation, root typecheck, root production build, the full `pnpm smoke:api` flow, and `git diff --check` passed. The smoke flow passes 200 checks, preserving Phase 1–8 behavior and additionally covering combined worksheet list filters, invalid filter rejection, today-assignment visibility, completion counts, internal-note hiding, and unrelated-worker exclusion.
- Production auth, token revocation/refresh, hardened cookie configuration, production object storage, structured logging, and formal API docs are missing.
- Movement, custody, bundle, specialized asset/vehicle, billing, notification, automation, and enterprise domains are missing.
- Assignment source/target IDs are typed polymorphic references and therefore do not have direct database foreign keys. The service validates them on create/update; future delete/archive policies must preserve assignment readability.
- Assignment updates overwrite current status/timing/notes and have no separate assignment event history yet. Only creator and record timestamps are retained.
- Job-report editing/resubmission after `NEEDS_REVISION`, nonterminal job-report review correction, and production attachment storage/retention are not implemented.
- Cost lines have no delete/correction event history or approval lifecycle. Tax rate is stored as cost metadata but is not used to calculate tax-inclusive/exclusive totals. Each job currently uses one currency, and receipt files are not linked directly to cost lines.
- Customer-report snapshots have no explicit revision, supersession, correction linkage, deletion, source reselection, or snapshot-refresh operation. A new selection produces a separate report without a version-family relation. Draft authored-field edits do not create their own audit events.
- Attachment metadata is copied, but file bytes remain in local attachment storage and are opened through the original attachment ID. A later storage/retention design must preserve those references.
- There is no customer-facing PDF/export artifact, server-side generator, template/version model, customer portal, download history, or email delivery. The browser-print layout exists, but browser pagination can vary and requires normal print-preview review for especially long reports. Internal notes are deliberately office-only and excluded from the customer document and print CSS.
- Customer-report tax values are copied metadata only; no net/gross/tax calculation exists. The optional full cost snapshot contains grouped backend totals, not detailed copies of every unselected cost line.
- Customer reports are job-grounded; there is no multi-job object-history aggregation or object-only generation.
- Workday-sheet rows cannot yet be reordered, copied, templated, bulk-created, or converted into downstream records. There is no calendar board, generated worksheet PDF/export, worksheet revision/correction lifecycle, per-row execution actor/time, offline/mobile flow, or worksheet activity-event table. Today uses the API server's local calendar date because company timezone semantics are not modeled. Team-based read access follows current team membership rather than a frozen recipient snapshot.
- Local boot is not yet documented as confusion-free in the foundation checklist.

Do not convert roadmap intentions into “existing features” when updating this document.
