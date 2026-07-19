# Domain Model

## Modeling rules

- Every business aggregate must have an unambiguous `Company` boundary.
- Foreign keys are not permission checks; every referenced record must be tenant-validated.
- Stable identity, lifecycle, and important history belong in explicit models, not labels or arbitrary JSON.
- Planned names and cardinalities below are direction, not a finished schema. Confirm and document them during each phase.

## Current models

- **Company:** tenant root owning memberships, teams, jobs, reports, attachments, directory records, item categories, items, and assignments. Future business entities should also be company-scoped.
- **User / Membership:** a global user account and its company-specific active membership with `OWNER`, `OFFICE`, or `WORKER` role. A user may have multiple company memberships; the current session resolves one.
- **Team / TeamMember:** a company group and its user members. `Team.currentAssignment` is only free text and must not become a second source of truth after structured assignments exist.
- **Job:** a company-owned scheduled unit of work with reference, title, description, required free-text customer/location, schedule, lifecycle, priority, and optional direct team. It may independently link to a customer, address, object, and object area. All linked records must belong to the active company; an object area requires and must belong to the selected object. The free-text fields remain the compatibility and display baseline and are not inferred or backfilled from directory records.
- **JobActivity:** readable, append-oriented job history with status, note, or report kind. It is not yet a generic audit/event model.
- **JobReport:** job- and company-owned summary/details with optional team/author and only `SUBMITTED` review status.
- **JobAttachment:** photo/file metadata attached to a job and optionally a report, team, and uploader. It is evidence, not an inventory item or asset.
- **Customer:** company-owned organization/person record typed as `PRIVATE`, `BUSINESS`, `PROPERTY_MANAGEMENT`, or `OTHER`. Names are deliberately not unique and there is no customer-number scheme yet. `isActive` provides non-destructive deactivation. Customers may own addresses and objects.
- **Address:** company-owned structured address with label, street, postal code, city, country, and notes. It may belong directly to one customer and may be reused by multiple objects. Customer deletion would set the relation null, but no delete API exists. Address history/snapshots are deferred until jobs and billing link to it.
- **Object:** industry-neutral managed site/entity with type and `ACTIVE`/`INACTIVE` status. Customer and address are optional. When both are present, service validation rejects an address owned by a different customer. Names are not unique. Jobs may optionally reference objects.
- **ObjectArea:** one-level, company-owned subdivision that must belong to an object. The API validates both company and parent object. Nested areas and delete endpoints are not implemented.
- **ItemCategory:** company-owned item classification with a company-unique name, optional description, explicit `MATERIAL`, `TOOL`, `ASSET`, `CONSUMABLE`, `PACKAGE`, or `OTHER` kind, and non-destructive active flag. It is optional on items and does not replace item tracking behavior. There are no global categories or delete endpoints.
- **Item:** company-owned tracked identity with a company-unique custom ID, name, optional category, kind, unit, tracking mode, decimal quantity, lifecycle status, description, and notes. A missing custom ID is generated automatically. `QUANTITY` items accept nonnegative values with up to three decimal places; `SERIALIZED` items always have quantity `1`. Category references must belong to the same active company. Status is `ACTIVE`, `INACTIVE`, `DAMAGED`, `LOST`, or `ARCHIVED`. Item state does not yet represent stock movement, custody, assignment, bundle composition, or physical location.
- **Assignment:** company-owned link in which `sourceType/sourceId` is the assigned entity and `targetType/targetId` is its context. Types are closed to `USER`, `TEAM`, `JOB`, `CUSTOMER`, `ADDRESS`, `OBJECT`, `OBJECT_AREA`, and `ITEM`; both endpoints are tenant-validated by the service. USER identity means an active company membership. Assignment kind is `RESPONSIBLE`, `SCHEDULED`, `ALLOCATED`, `RESERVED`, `SUPPORTING`, or `OTHER`. Status has explicit planned/active/terminal transitions. Timing is optional, but an end must follow a start. Exact duplicate active links are prohibited. Source, target, and kind are immutable; status, timing, and notes may change. The creator is retained through a real User relation. `Job.teamId` remains an independent compatibility path and is neither created nor changed by generic assignments.

## Planned models

### ItemMovement

An append-oriented record of quantity, custody, or location change. It belongs to a company and item and records time, quantity/unit where relevant, reason/type, actor, and validated source/destination. It may reference a job, assignment, object/area, team/user, or depot. Corrections should use governed adjustments or counter-events, not silent edits. “Current location” is derived or transactionally maintained state, not a replacement for history.

### Package / Bundle

A reusable company-owned grouping of items, materials, assets, job requirements, or work components. “Bundle” is preferred until naming is finalized because `package` is overloaded in a JavaScript monorepo. A definition describes intended composition; it is not stock, custody, assignment, or movement history.

### Vehicle / Asset (later)

Durable resources with lifecycle needs such as serial/registration data, maintenance, availability, inspections, documents, meters, and custody. Do not create separate silos before common identifiers, categories, and tracking semantics exist.

## Relationship direction

```text
Company
├── Membership ── User ── TeamMember ── Team
├── Customer ── Address
│   └── Object ── ObjectArea
├── Job ── JobActivity
│   ├── JobReport ── JobAttachment
│   └── Assignment ── Team / User / Item
├── ItemCategory ── Item
│                  ├── Assignment
│                  └── ItemMovement (later)
└── Bundle / Asset / Vehicle (later)
```

- A job may reference customer, execution address, object, and object area.
- Reports/attachments remain job-grounded initially; wider ownership needs an explicit design, not casually added nullable links.
- Assignments say who or what is allocated. Movements say what physically or custodially changed. They are not interchangeable.
- Teams group users, but history must retain individual actors where reports, movements, or auditing require them.
- Company is the security boundary across every relationship.
- Item category, item identity, and generic assignments are implemented; future movements must preserve their company boundaries and current tracking invariants.
- Assignment entity types are database enums rather than arbitrary strings, but source/target IDs are polymorphic and have no direct database foreign keys. Service validation is therefore mandatory on every write.
- Assignment currently records current state and creator attribution, not append-only assignment change history or scheduling-conflict decisions.
