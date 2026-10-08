# Domain Model

## Modeling rules

- Every business aggregate must have an unambiguous `Company` boundary.
- Foreign keys are not permission checks; every referenced record must be tenant-validated.
- Stable identity, lifecycle, and important history belong in explicit models, not labels or arbitrary JSON.
- Planned names and cardinalities below are direction, not a finished schema. Confirm and document them during each phase.

## Domain center

- Everyday operational work is the product center.
- Daily worksheets/team protocols are the implemented bridge from object responsibility, existing Jobs, routine duties, and ad hoc instructions to actual worker execution and office review.
- Jobs remain the current governed unit for scheduled work, incidents, repairs, inspections, and follow-up work; worksheets must complement rather than duplicate that lifecycle.
- Objects are the memory that connects customers, addresses, responsibilities, daily work, incidents, reports, and history.
- Reports are the proof created by workers, reviewed by the office, and shared with customers.
- Costs are the money layer attached to governed work.
- Assignments are the control layer connecting responsibility and supporting resources.
- Items/materials are supporting context for work and cost, not the organizing center of the platform.

## Current models

- **Company:** tenant root owning memberships, teams, jobs, reports, attachments, job costs, customer-report snapshots, workday sheets, service agreements, recurring duties, directory records, item categories, items, and assignments. Future business entities should also be company-scoped.
- **User / Membership:** a global user account and its company-specific active membership with `OWNER`, `OFFICE`, or `WORKER` role. A user may have multiple company memberships; the current session resolves one.
- **Team / TeamMember:** a company group and its user members. `Team.currentAssignment` is only free text and must not become a second source of truth after structured assignments exist.
- **WorkdaySheet:** company-owned dated execution paper with optional title, team assignment, direct WORKER assignment, office-only internal notes, office review notes, and actor/timestamp relations for creation, send, submission, review, and archival. It is deliberately distinct from a `Job`: a sheet organizes one workday, while Jobs remain governed operational records. Status is forward-only `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED`. OWNER/OFFICE can plan drafts, send, review, and archive. Assigned workers can read sent-or-later sheets and submit sent sheets. Planning is locked after send; reviewed and archived sheets are locked.
- **WorkdaySheetRow:** ordered, company-owned child of one sheet. Every row has nonblank `plannedText` and may hold `actualText`, office-planned notes, optional start/end `HH:mm`, and optional customer, address, object, object-area, or Job links. A row may be pure free text. All links must be tenant-owned, and an object-area link requires and must match its object. Only office users edit planned fields while the sheet is `DRAFT`; assigned workers edit only `actualText` while it is `SENT`. Submission requires actual text on every row. The stable row identity anchors the implemented explicit worksheet review actions.
- **ServiceAgreement:** company-owned reusable responsibility definition with title/description, `DRAFT`, `ACTIVE`, `INACTIVE`, or terminal `ARCHIVED` status, inclusive effective dates, one IANA timezone, optional customer/address/object/object-area context, office-only internal notes, and creation/activation/deactivation/archival actor/timestamp audit. OWNER/OFFICE alone can read or administer agreements. Definition edits are allowed only in `DRAFT` or `INACTIVE`; activation requires at least one active duty. Allowed transitions are `DRAFT -> ACTIVE|ARCHIVED`, `ACTIVE -> INACTIVE`, and `INACTIVE -> ACTIVE|ARCHIVED`.
- **RecurringObjectDuty:** stable, ordered, company-owned child of one service agreement. It stores nonblank reusable `plannedText`, optional notes and local `HH:mm` time range, `isActive`, a first-due local calendar date, and every-N cadence expressed as `cadenceInterval` plus `DAY`, `WEEK`, `MONTH`, or `YEAR`. Duty edits/additions are allowed only while the parent is `DRAFT` or `INACTIVE`; deactivation preserves identity/history rather than deleting the row. The first-due date must lie inside the agreement's effective range.
- **Job:** a company-owned scheduled unit of work with reference, title, description, required free-text customer/location, schedule, lifecycle, priority, and optional direct team. It may independently link to a customer, address, object, and object area. All linked records must belong to the active company; an object area requires and must belong to the selected object. The free-text fields remain the compatibility and display baseline and are not inferred or backfilled from directory records.
- **JobActivity:** readable, append-oriented job history with status, note, or report kind. It is not yet a generic audit/event model.
- **JobReport:** job- and company-owned execution proof with a closed type, legacy summary/details, structured findings/work/follow-up fields, optional team/author, explicit review lifecycle, reviewer attribution, review notes, timestamps, and linked attachments. Legacy simple reports remain `GENERAL`/`SUBMITTED`; structured reports start `PENDING_REVIEW`. OWNER/OFFICE may transition pending reports once to `APPROVED`, `NEEDS_REVISION`, or `REJECTED`. WORKER creation requires direct-team membership, an active user/team assignment to the Job, or an assigned `SENT` worksheet row linked to the Job. Worker reads also allow a linked assigned sheet in any sent-or-later state.
- **JobAttachment:** photo/file metadata attached to a Job and optionally a report, team, and uploader. It is evidence, not an inventory item, asset, or worksheet-row attachment. WORKER read and upload permissions use the same Job access model as reports; worksheet-only upload is permitted only while the linked assigned sheet is `SENT`.
- **Customer:** company-owned organization/person record typed as `PRIVATE`, `BUSINESS`, `PROPERTY_MANAGEMENT`, or `OTHER`. Names are deliberately not unique and there is no customer-number scheme yet. `isActive` provides non-destructive deactivation. Customers may own addresses and objects.
- **Address:** company-owned structured address with label, street, postal code, city, country, and notes. It may belong directly to one customer and may be reused by multiple objects. Customer deletion would set the relation null, but no delete API exists. General address version history is absent; customer reports copy their selected address context at creation.
- **Object:** industry-neutral managed site/entity with type and `ACTIVE`/`INACTIVE` status. Customer and address are optional. When both are present, service validation rejects an address owned by a different customer. Names are not unique. Jobs may optionally reference objects.
- **ObjectArea:** one-level, company-owned subdivision that must belong to an object. The API validates both company and parent object. Nested areas and delete endpoints are not implemented.
- **ItemCategory:** company-owned classification for materials, tools, assets, consumables, packages, or other things referenced by operational work. It has a company-unique name, optional description, kind, and non-destructive active flag. Categories support job documentation and cost context; they are not warehouse taxonomy.
- **Item:** company-owned supporting identity with a company-unique custom ID, name, optional category, kind, unit, tracking mode, decimal quantity, lifecycle status, description, and notes. A missing custom ID is generated automatically. `QUANTITY` items accept nonnegative values with up to three decimal places; `SERIALIZED` items always have quantity `1`. Category references must belong to the same active company. Items can later support material purchases/use, tool references, job proof, and cost lines. The current model is not a stock ledger, warehouse balance, delivery workflow, or logistics system.
- **Assignment:** company-owned link in which `sourceType/sourceId` is the assigned entity and `targetType/targetId` is its context. Types are closed to `USER`, `TEAM`, `JOB`, `CUSTOMER`, `ADDRESS`, `OBJECT`, `OBJECT_AREA`, and `ITEM`; both endpoints are tenant-validated by the service. USER identity means an active company membership. Assignment kind is `RESPONSIBLE`, `SCHEDULED`, `ALLOCATED`, `RESERVED`, `SUPPORTING`, or `OTHER`. Status has explicit planned/active/terminal transitions. Timing is optional, but an end must follow a start. Exact duplicate active links are prohibited. Source, target, and kind are immutable; status, timing, and notes may change. The creator is retained through a real User relation. `Job.teamId` remains an independent compatibility path and is neither created nor changed by generic assignments.
- **JobCostLine:** company- and job-owned money-layer record for material purchase/use, labor, travel, external service, fee, or other cost. It stores a positive quantity, closed unit, optional unit cost, backend-governed total, one job currency, optional tax metadata, cost date, vendor/receipt context, notes, and creator/updater attribution. Material/labor/travel totals are derived from quantity times unit cost. External/fee/other lines may instead use a manual nonnegative total. An optional Item relation is supporting context and must remain in the same company. Cost lines do not change item quantity and are not invoices, payments, or accounting entries.
- **CustomerReportSnapshot:** company-owned, job-grounded customer-facing report data created only by `OWNER` or `OFFICE`. Creation requires a same-company Job and copies a stable schema-versioned (`schemaVersion: 1`) source set in a repeatable-read transaction. The record retains optional live identity links to the job's customer, address, object, and object area with `onDelete: SetNull`, while copied job/directory labels and structured JSON remain readable independently of later source edits. Legacy `Job.customerName` and `Job.location` supply customer/address fallback values when structured links are absent. Report numbers use a company-unique `CR-YYYYMMDD-...` form.

  Customer-report types are `JOB_COMPLETION`, `INCIDENT`, `DAMAGE_REPORT`, `MAINTENANCE`, `OBJECT_STATUS`, `COST_OVERVIEW`, and `OTHER`. Status is `DRAFT`, `READY_FOR_REVIEW`, `APPROVED`, or `ARCHIVED`. Allowed transitions are `DRAFT -> READY_FOR_REVIEW|ARCHIVED`, `READY_FOR_REVIEW -> DRAFT|APPROVED`, and `APPROVED -> ARCHIVED`; `ARCHIVED` is terminal. Authored title, recipient, period, type, summaries, cost note, and internal notes are editable only in `DRAFT`. Approval records actor and time. Moving to review requires authored content or at least one selected report/evidence/cost source. Creation and status transitions create readable `JobActivity` entries while the Job relation exists.

  Source inclusion is explicit and fixed at creation. Only `APPROVED` JobReports may be selected; their findings, performed/outstanding work, follow-up fields, author/reviewer/team context, review state, order, and timestamps are copied. Selected attachments copy metadata/reference data—ID, optional report ID, kind, filename, MIME type, size, caption, order, and timestamps—but not file bytes. Any attachment on the same company Job is currently eligible. Selected cost lines copy ordered line details, optional Item/vendor/receipt/tax metadata, and their source update time, with a backend-derived selected-line summary. `includeFullCostSummary` optionally copies the entire Job's grouped summary in addition to selected lines; it does not copy every unselected line. The top-level total prefers that full summary, otherwise the selected-line summary when present. Source selection and snapshot context cannot be edited or refreshed; a different selection creates a separate unlinked snapshot.

## Implemented presentation boundary

### Customer Report Presentation / PDF Readiness (Phase 7B)

Phase 7B adds no database model and does not change the `CustomerReportSnapshot` contract. A reusable web presentation component accepts a snapshot detail with internal notes and live creator/approver projections removed from its input. It renders only stored report scalars plus the versioned copied source/cost payload: recipient and context, customer-authored issue/findings/work/follow-up text, approved copied execution reports, evidence metadata references, selected cost details, optional full grouped costs, status, and stored approval time.

The office wrapper owns draft editing, lifecycle actions, current actor attribution, original attachment-file links, source diagnostics, and internal notes. Internal notes are structurally absent from the customer component and hidden again by print CSS. The A4-oriented browser-print mode hides the admin shell and office wrapper. Attachment bytes are neither copied nor fetched for the customer document; only the office-only original-file action uses the existing attachment route and local storage.

No PDF artifact, PDF generator/export endpoint, template/version model, customer portal, or delivery record exists. Browser print is readiness, not export.

### Worksheet Usability and API Hardening (Phase 8B)

Phase 8B adds no database model or migration and does not change the `WorkdaySheet` / `WorkdaySheetRow` aggregate or lifecycle. Shared contracts now describe exact list filters and the role-aware today response. The list API accepts `date`, `status`, `teamId`, and `workerUserId`; the service always combines those filters with the caller's tenant and worker-assignment visibility rather than allowing a query to replace the authorization predicate. The today query returns full visible rows for the API server's local calendar date and uses the same visibility and internal-note redaction rules as detail reads.

Draft planning writes and assigned-worker actual-text writes now lock the parent sheet through a status-scoped update inside the same transaction as the row mutation. This prevents a concurrent send or submit transition from accepting a row write after the relevant editable state has ended. It is lifecycle hardening, not a new state or audit aggregate.

Completion counts remain derived from nonempty row `actualText`; they are convenience response data rather than persisted workflow state. Browser-print styling is a web presentation of the same stored sheet and rows. It creates no PDF artifact, export record, downstream Job, cost, report, or customer message.

## Review actions and later models

### WorksheetReviewAction (Phase 9 and 9B implemented)

`WorksheetReviewAction` is a company-owned, append-only record of an explicit office decision on one reviewed worksheet row. Implemented types are `CREATE_FOLLOW_UP_JOB`, `CREATE_JOB_COST_LINE`, and `CREATE_JOB_REPORT`; the implemented status is `COMPLETED`. One company/source-row/action-type tuple is unique. Every action stores its source sheet and row, a schema-versioned immutable JSON snapshot of worksheet date/title/assignment plus row planned/actual text, times, notes, and linked context, creating actor, completion time, deterministic idempotency key, request fingerprint, and required destination Job plus copied Job reference/title. Cost/report types additionally store a restrictive typed link to the created `JobCostLine` or `JobReport` and a copied description/summary. A database check keeps the type-specific destination fields coherent.

OWNER/OFFICE alone can invoke an action, and only while the sheet is `REVIEWED`. Follow-up creation produces a normal `PLANNED` Job. Cost/report actions require an existing tenant-owned target Job—whether already linked, deliberately selected, or created by the follow-up action—and create normal `JobCostLine` / structured `JobReport` records using their existing validation, permissions, amount rules, and `PENDING_REVIEW` report lifecycle. The downstream record, readable Job activity, and action are one database transaction, so a failure persists none of them. Same-input replay resolves to the stored result; a changed replay conflicts. `ARCHIVED` remains terminal for new actions. No free-floating cost/report, customer-communication action, automatic conversion, undo/cancel, or correction/supersession action exists.

### ServiceAgreement / RecurringObjectDuty (Phase 10 implemented)

Object- and customer-grounded definitions for expected recurring cleaning, window, caretaking, garden, winter-service, inspection, maintenance, or other duties are now implemented as the models described above. The agreement timezone gives each duty's date and optional times a local-calendar interpretation; effective bounds are inclusive.

The stored cadence contract is anchored to `firstDueDate`: `DAY` and `WEEK` advance by the configured number of local calendar days or weeks; `MONTH` and `YEAR` preserve the original anchor's local day/month rather than chaining from a previously clamped occurrence. When a future monthly or yearly target period lacks that calendar day, the intended occurrence is the final valid local day in that target month. Phase 10 does not implement an occurrence evaluator, holiday/blackout/skip/one-off exceptions, completion history, or daylight-saving execution scheduler, so these rules currently describe future evaluation of the persisted definition rather than materialized work.

Agreements should later feed an explicit, editable DRAFT worksheet planning handoff close to execution. They do not silently create worksheets, generate Jobs, run background schedules, or form a parallel Job system.

### Command-center read model (Phase 11 implemented)

The command center adds no persisted model or migration. `GET /api/dashboard` is a request-time, tenant-scoped projection over existing company records and performs no writes.

- OWNER/OFFICE scope is the active company. WORKER worksheet scope is the same assigned, sent-or-later visibility as the worksheet service. WORKER Job scope is direct Job team membership plus active user-to-Job or team-to-Job assignments. Office-only aggregates are omitted from worker responses.
- Today's worksheet date is the API server's local calendar date. Completion means stored nonempty `actualText`; it is not inferred from Job state.
- Job status counts use stored `PLANNED`, `IN_PROGRESS`, `DONE`, and `CANCELED` values. “Open” in the UI means `PLANNED + IN_PROGRESS`.
- Office review demand counts Job reports in `SUBMITTED` or `PENDING_REVIEW` and worksheets in `SUBMITTED`.
- Active teams, assignments, and agreement definitions use only their stored active status. Timing windows and recurring-duty occurrences are not inferred.
- Cost totals sum stored `JobCostLine.totalCost` where `costDate` falls within the current UTC calendar month. Totals remain separate by currency.
- Recent follow-up activity is the six newest completed explicit `WorksheetReviewAction` records with source sheet/row and destination Job identity. It is not a notification stream or activity-history replacement.

### Worker daily access model (Phase 12 implemented)

Phase 12 adds no persisted model or migration. It composes existing worksheets, Jobs, reports, and attachments through one shared server-side worker Job predicate.

- OWNER/OFFICE Job list/detail and Job artifact access remain company-wide under their existing permissions.
- A WORKER may read a Job when the user belongs to `Job.teamId`, has an active direct user-to-Job assignment, belongs to a team with an active team-to-Job assignment, or is directly/team assigned to a worksheet in `SENT`, `SUBMITTED`, `REVIEWED`, or `ARCHIVED` that has a row linked to the Job.
- A WORKER may create a structured Job report or Job attachment through direct Job team/assignment access, or through a linked assigned worksheet only while that sheet is `SENT`. Submitting the sheet removes worksheet-only contribution rights but preserves read access for later review/history.
- The worker Job list/detail, cost reads, report lists, attachment lists, attachment metadata/file routes, and photo library apply this read predicate. Same-company but unauthorized reads return safe not-found responses. Unauthorized creation remains forbidden.
- Actual work and findings remain separate: `WorkdaySheetRow.actualText` records what was performed at the planned station; a problem/finding is a normal `JobReport`, and its photo/video/file is a normal report-linked `JobAttachment`.
- A worksheet row with no linked Job can still record actual work, but cannot receive evidence or create a free-floating finding. The UI states this limitation and directs the worker to a suitable assigned Job or the office. This preserves one report/attachment system and avoids inventing an object-only finding aggregate inside Phase 12.
- The responsive worker web shell is a presentation layer over these rules. It is not a native app, offline queue, new lifecycle, or mobile-specific backend.

### Optional ItemMovement

Item movement may later provide append-oriented quantity, custody, or location traceability for specific tools, assets, or regulated materials. It is optional supporting infrastructure and should only be built for a demonstrated workflow. It must not make warehouse mechanics the default architecture and is not a prerequisite for worker findings, Job costs, customer reports, worksheets, or service agreements.

### Package / Bundle

A reusable company-owned grouping of items, materials, assets, job requirements, or work components. “Bundle” is preferred until naming is finalized because `package` is overloaded in a JavaScript monorepo. A definition describes intended composition; it is not stock, custody, assignment, or movement history.

### Vehicle / Asset (later)

Durable resources with lifecycle needs such as serial/registration data, maintenance, availability, inspections, documents, meters, and custody. Do not create separate silos before common identifiers, categories, and tracking semantics exist.

## Relationship direction

```text
Company
├── Membership ── User ── TeamMember ── Team
├── Customer / Verwaltung ── Address
│   └── Object ── ObjectArea
│       └── ServiceAgreement ── RecurringObjectDuty (Phase 10 foundation implemented)
├── WorkdaySheet / TeamProtocol (Phase 8 foundation + Phase 8B usability + Phase 12 worker web flow)
│   ├── assigned Team / User
│   └── WorkdaySheetRow ── Customer / Address / Object / ObjectArea / Job reference (optional)
│       └── WorksheetReviewAction (Phase 9 complete)
│           ├── normal follow-up Job
│           ├── Job-grounded JobCostLine
│           └── Job-grounded structured JobReport
├── Job ── JobActivity
│   ├── JobReport / Finding ── JobAttachment
│   ├── JobCostLine ── Item reference (optional)
│   └── Assignment ── Team / User / Item
├── CustomerReportSnapshot
└── ItemCategory ── Item ── ItemMovement (optional later)
```

- A job may reference customer, execution address, object, and object area.
- A worksheet is a dated execution plan and protocol, not a renamed Job. Its rows may combine object duties, existing Jobs, and ad hoc instructions.
- Worksheet/protocol planning is the operational bridge between object responsibility and actual worker execution.
- Service agreements are reusable responsibility definitions. A later deliberate handoff may copy selected due-duty text into an editable DRAFT worksheet; the current phase does not calculate occurrences or generate worksheets or Jobs.
- Reports/attachments are Job-grounded reviewed execution proof and preserve legacy simple reports. A worksheet row may link to that Job, but never owns the evidence itself.
- Costs belong to jobs first and may reference items/materials where useful without requiring catalog identity for every expense.
- Assignments say who or what is responsible or allocated. They are the control layer, not a visual board by themselves.
- Teams group users, but history must retain individual actors where reports, costs, or auditing require them.
- Company is the security boundary across every relationship.
- Item category, item identity, and generic assignments are implemented foundations that support the broader operations platform.
- Optional future movements must preserve company boundaries and item invariants, but movement is not the default next dependency.
- Assignment entity types are database enums rather than arbitrary strings, but source/target IDs are polymorphic and have no direct database foreign keys. Service validation is therefore mandatory on every write.
- Assignment currently records current state and creator attribution, not append-only assignment change history or scheduling-conflict decisions.
- Report review decisions are terminal in Phase 5; report editing, worker resubmission, and review correction require a later explicit lifecycle extension.
- Job cost summaries group persisted cost lines into material, labor, travel, external-service, other, and grand totals. They are backend-derived preparatory data, not immutable issued-document snapshots.
- CustomerReportSnapshot copies selected approved operational proof, selected attachment metadata references, and selected/full cost data at creation. It is stable customer-report data, not a rendered file, invoice, payment record, email, or object-history projection.
- The customer-report lifecycle has approval and archival but no linked revisions, supersession/correction chain, snapshot refresh, delete behavior, or separate reviewer comment history.
