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

- **Company:** tenant root owning memberships, teams, jobs, reports, attachments, job costs, customer-report snapshots, workday sheets, directory records, item categories, items, and assignments. Future business entities should also be company-scoped.
- **User / Membership:** a global user account and its company-specific active membership with `OWNER`, `OFFICE`, or `WORKER` role. A user may have multiple company memberships; the current session resolves one.
- **Team / TeamMember:** a company group and its user members. `Team.currentAssignment` is only free text and must not become a second source of truth after structured assignments exist.
- **WorkdaySheet:** company-owned dated execution paper with optional title, team assignment, direct WORKER assignment, office-only internal notes, office review notes, and actor/timestamp relations for creation, send, submission, review, and archival. It is deliberately distinct from a `Job`: a sheet organizes one workday, while Jobs remain governed operational records. Status is forward-only `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED`. OWNER/OFFICE can plan drafts, send, review, and archive. Assigned workers can read sent-or-later sheets and submit sent sheets. Planning is locked after send; reviewed and archived sheets are locked.
- **WorkdaySheetRow:** ordered, company-owned child of one sheet. Every row has nonblank `plannedText` and may hold `actualText`, office-planned notes, optional start/end `HH:mm`, and optional customer, address, object, object-area, or Job links. A row may be pure free text. All links must be tenant-owned, and an object-area link requires and must match its object. Only office users edit planned fields while the sheet is `DRAFT`; assigned workers edit only `actualText` while it is `SENT`. Submission requires actual text on every row. The row retains stable source identity for a later explicit follow-up conversion workflow.
- **Job:** a company-owned scheduled unit of work with reference, title, description, required free-text customer/location, schedule, lifecycle, priority, and optional direct team. It may independently link to a customer, address, object, and object area. All linked records must belong to the active company; an object area requires and must belong to the selected object. The free-text fields remain the compatibility and display baseline and are not inferred or backfilled from directory records.
- **JobActivity:** readable, append-oriented job history with status, note, or report kind. It is not yet a generic audit/event model.
- **JobReport:** job- and company-owned execution proof with a closed type, legacy summary/details, structured findings/work/follow-up fields, optional team/author, explicit review lifecycle, reviewer attribution, review notes, timestamps, and linked attachments. Legacy simple reports remain `GENERAL`/`SUBMITTED`; structured reports start `PENDING_REVIEW`. OWNER/OFFICE may transition pending reports once to `APPROVED`, `NEEDS_REVISION`, or `REJECTED`. WORKER creation requires direct-team membership or an active user/team assignment to the job.
- **JobAttachment:** photo/file metadata attached to a job and optionally a report, team, and uploader. It is evidence, not an inventory item or asset.
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

## Planned models

### WorksheetReviewAction (Phase 9 direction)

An explicit, auditable, and idempotent office decision that turns a reviewed worksheet result into a follow-up Job, cost, report, billable-work candidate, or customer-communication input. Phase 8 must retain enough source identity for this later flow but must not silently create these downstream records.

### ServiceAgreement / RecurringObjectDuty (Phase 10 direction)

Object- and customer-grounded definitions for expected recurring cleaning, window, caretaking, garden, winter-service, inspection, maintenance, or other duties. Agreements may carry cadence, applicability, exceptions, and reusable content, but should feed flexible worksheet planning. They must not generate rigid Jobs far in advance or become a parallel Job system.

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
│   └── Object ── ObjectArea ── ServiceAgreement / RecurringObjectDuty (Phase 10 planned)
├── WorkdaySheet / TeamProtocol (Phase 8 implemented)
│   ├── assigned Team / User
│   └── WorkdaySheetRow ── Customer / Address / Object / ObjectArea / Job reference (optional)
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
- Later service agreements supply worksheet planning inputs; they do not require bulk generation of rigid future Jobs.
- Reports/attachments are job-grounded reviewed execution proof and preserve legacy simple reports.
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
