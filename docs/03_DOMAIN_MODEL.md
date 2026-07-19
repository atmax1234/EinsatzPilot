# Domain Model

## Modeling rules

- Every business aggregate must have an unambiguous `Company` boundary.
- Foreign keys are not permission checks; every referenced record must be tenant-validated.
- Stable identity, lifecycle, and important history belong in explicit models, not labels or arbitrary JSON.
- Planned names and cardinalities below are direction, not a finished schema. Confirm and document them during each phase.

## Domain center

- Jobs are the star and the primary unit of planning, execution, review, and commercial preparation.
- Objects are the memory that connects customers, addresses, recurring work, incidents, reports, and history.
- Reports are the proof created by workers, reviewed by the office, and shared with customers.
- Costs are the money layer attached to governed work.
- Assignments are the control layer connecting responsibility and supporting resources.
- Items/materials are supporting context for work and cost, not an inventory-led product domain.

## Current models

- **Company:** tenant root owning memberships, teams, jobs, reports, attachments, job costs, directory records, item categories, items, and assignments. Future business entities should also be company-scoped.
- **User / Membership:** a global user account and its company-specific active membership with `OWNER`, `OFFICE`, or `WORKER` role. A user may have multiple company memberships; the current session resolves one.
- **Team / TeamMember:** a company group and its user members. `Team.currentAssignment` is only free text and must not become a second source of truth after structured assignments exist.
- **Job:** a company-owned scheduled unit of work with reference, title, description, required free-text customer/location, schedule, lifecycle, priority, and optional direct team. It may independently link to a customer, address, object, and object area. All linked records must belong to the active company; an object area requires and must belong to the selected object. The free-text fields remain the compatibility and display baseline and are not inferred or backfilled from directory records.
- **JobActivity:** readable, append-oriented job history with status, note, or report kind. It is not yet a generic audit/event model.
- **JobReport:** job- and company-owned execution proof with a closed type, legacy summary/details, structured findings/work/follow-up fields, optional team/author, explicit review lifecycle, reviewer attribution, review notes, timestamps, and linked attachments. Legacy simple reports remain `GENERAL`/`SUBMITTED`; structured reports start `PENDING_REVIEW`. OWNER/OFFICE may transition pending reports once to `APPROVED`, `NEEDS_REVISION`, or `REJECTED`. WORKER creation requires direct-team membership or an active user/team assignment to the job.
- **JobAttachment:** photo/file metadata attached to a job and optionally a report, team, and uploader. It is evidence, not an inventory item or asset.
- **Customer:** company-owned organization/person record typed as `PRIVATE`, `BUSINESS`, `PROPERTY_MANAGEMENT`, or `OTHER`. Names are deliberately not unique and there is no customer-number scheme yet. `isActive` provides non-destructive deactivation. Customers may own addresses and objects.
- **Address:** company-owned structured address with label, street, postal code, city, country, and notes. It may belong directly to one customer and may be reused by multiple objects. Customer deletion would set the relation null, but no delete API exists. Address history/snapshots are deferred until jobs and billing link to it.
- **Object:** industry-neutral managed site/entity with type and `ACTIVE`/`INACTIVE` status. Customer and address are optional. When both are present, service validation rejects an address owned by a different customer. Names are not unique. Jobs may optionally reference objects.
- **ObjectArea:** one-level, company-owned subdivision that must belong to an object. The API validates both company and parent object. Nested areas and delete endpoints are not implemented.
- **ItemCategory:** company-owned classification for materials, tools, assets, consumables, packages, or other things referenced by operational work. It has a company-unique name, optional description, kind, and non-destructive active flag. Categories support job documentation and cost context; they are not warehouse taxonomy.
- **Item:** company-owned supporting identity with a company-unique custom ID, name, optional category, kind, unit, tracking mode, decimal quantity, lifecycle status, description, and notes. A missing custom ID is generated automatically. `QUANTITY` items accept nonnegative values with up to three decimal places; `SERIALIZED` items always have quantity `1`. Category references must belong to the same active company. Items can later support material purchases/use, tool references, job proof, and cost lines. The current model is not a stock ledger, warehouse balance, delivery workflow, or logistics system.
- **Assignment:** company-owned link in which `sourceType/sourceId` is the assigned entity and `targetType/targetId` is its context. Types are closed to `USER`, `TEAM`, `JOB`, `CUSTOMER`, `ADDRESS`, `OBJECT`, `OBJECT_AREA`, and `ITEM`; both endpoints are tenant-validated by the service. USER identity means an active company membership. Assignment kind is `RESPONSIBLE`, `SCHEDULED`, `ALLOCATED`, `RESERVED`, `SUPPORTING`, or `OTHER`. Status has explicit planned/active/terminal transitions. Timing is optional, but an end must follow a start. Exact duplicate active links are prohibited. Source, target, and kind are immutable; status, timing, and notes may change. The creator is retained through a real User relation. `Job.teamId` remains an independent compatibility path and is neither created nor changed by generic assignments.
- **JobCostLine:** company- and job-owned money-layer record for material purchase/use, labor, travel, external service, fee, or other cost. It stores a positive quantity, closed unit, optional unit cost, backend-governed total, one job currency, optional tax metadata, cost date, vendor/receipt context, notes, and creator/updater attribution. Material/labor/travel totals are derived from quantity times unit cost. External/fee/other lines may instead use a manual nonnegative total. An optional Item relation is supporting context and must remain in the same company. Cost lines do not change item quantity and are not invoices, payments, or accounting entries.

## Planned models

### Customer/Object Report Output

Planned tenant-owned, job-grounded report snapshots that assemble customer/address/object/object-area context, reviewed findings, work performed, outstanding work and follow-up notes, photo/file evidence references, and governed job cost summaries into reviewable customer-facing data.

Phase 7 must begin with domain planning, not rendering. Before implementation, decide and document:

- whether source values are copied into a stable snapshot or resolved live;
- which report states and report types may be included, and how explicit selection works;
- how attachment identities, captions, ordering, and later storage changes remain reproducible;
- whether cost lines, grouped totals, tax metadata, and currency are copied or referenced;
- draft, review, finalized, superseded, and correction/version semantics;
- who may generate, review, finalize, read, or revise a report snapshot;
- how legacy `Job.customerName` and `Job.location` coexist with structured directory context;
- what belongs to report data versus later PDF templates, email delivery, invoice support, or object-history projections.

The first implementation should create a strong snapshot/data foundation and a clean reviewable UI. It must not begin with PDF layout, invoice issuance, or automatic delivery.

### Recurring Service Contract

Object- and customer-grounded definitions for recurring cleaning, window, caretaking, garden, winter-service, inspection, or maintenance work. A contract/template describes expected service and schedule; generated jobs remain the operational execution records.

### Optional ItemMovement

Item movement may later provide append-oriented quantity, custody, or location traceability for specific tools, assets, or regulated materials. It is optional supporting infrastructure and should only be built for a demonstrated workflow. It must not turn EinsatzPilot into a warehouse or logistics application and is not a prerequisite for worker findings, job costs, customer reports, or recurring services.

### Package / Bundle

A reusable company-owned grouping of items, materials, assets, job requirements, or work components. “Bundle” is preferred until naming is finalized because `package` is overloaded in a JavaScript monorepo. A definition describes intended composition; it is not stock, custody, assignment, or movement history.

### Vehicle / Asset (later)

Durable resources with lifecycle needs such as serial/registration data, maintenance, availability, inspections, documents, meters, and custody. Do not create separate silos before common identifiers, categories, and tracking semantics exist.

## Relationship direction

```text
Company
├── Membership ── User ── TeamMember ── Team
├── Customer / Verwaltung ── Address
│   └── Object ── ObjectArea ── Recurring Service Contract (planned)
├── Job ── JobActivity
│   ├── JobReport / Finding ── JobAttachment
│   ├── JobCostLine ── Item reference (optional)
│   └── Assignment ── Team / User / Item
├── Customer/Object Report Output (planned)
└── ItemCategory ── Item ── ItemMovement (optional later)
```

- A job may reference customer, execution address, object, and object area.
- Reports/attachments are job-grounded reviewed execution proof and preserve legacy simple reports.
- Costs belong to jobs first and may reference items/materials where useful without requiring catalog identity for every expense.
- Assignments say who or what is responsible or allocated. They are the control layer, not a visual board by themselves.
- Teams group users, but history must retain individual actors where reports, costs, or auditing require them.
- Company is the security boundary across every relationship.
- Item category, item identity, and generic assignments are implemented foundations that support the job-centered product.
- Optional future movements must preserve company boundaries and item invariants, but movement is not the default next dependency.
- Assignment entity types are database enums rather than arbitrary strings, but source/target IDs are polymorphic and have no direct database foreign keys. Service validation is therefore mandatory on every write.
- Assignment currently records current state and creator attribution, not append-only assignment change history or scheduling-conflict decisions.
- Report review decisions are terminal in Phase 5; report editing, worker resubmission, and review correction require a later explicit lifecycle extension.
- Job cost summaries group persisted cost lines into material, labor, travel, external-service, other, and grand totals. They are backend-derived preparatory data, not immutable issued-document snapshots.
