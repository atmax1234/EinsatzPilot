# Feature Dependencies

## Ordering rule

Domain truth comes before interaction polish. The dependency center is everyday operational work: flexible worksheet planning/execution plus governed Jobs, evidence, review, and costs—not inventory mechanics or one service vertical.

## Strategic map

```text
Tenant-safe identity and roles
└── Customer / Verwaltung + Address + Object + ObjectArea
    └── Job links and compatibility migration
        ├── Job lifecycle + JobActivity
        ├── Assignment control layer
        ├── Worker findings + photos + work performed
        │   └── Office review + follow-up
        └── Job cost ledger
            ├── Labor / travel / external / custom costs
            ├── Material purchase/use (Item reference optional)
            └── Invoice-ready summary

Customer/object context + teams/workers + existing Jobs
└── Daily worksheets / team protocols (Phase 8 implemented)
    └── Worksheet usability / hardening (Phase 8B implemented)
        ├── Filtered office overview + completion clarity
        ├── Assigned-worker today flow + actual work + submit
        ├── Review/lock clarity + browser print
        └── Office review
        └── Explicit reviewed-row conversion actions (Phase 9 implemented)
            ├── Follow-up Jobs (implemented)
            ├── Job-grounded costs / structured reports (Phase 9B implemented)
            └── Billable/customer-communication inputs (preparation only)

Reviewed job execution + object memory + job costs
└── Customer/Object report snapshot foundation (implemented)
    └── Customer report polish and browser-print readiness (implemented; PDF not implemented)

Worksheet planning + customer/object responsibility + schedule/timezone rules
└── Service agreements / recurring object duties (Phase 10)
    └── Feed flexible worksheet planning; do not bulk-generate rigid future Jobs

Trusted worksheets + Jobs + assignments + reports + costs
└── Company command-center dashboard (Phase 11)
    └── Smart planning / automation / AI assistance (Phase 12)

ItemCategory + Item
├── Supporting material/tool/asset context for jobs, costs, and proof
└── Optional later ItemMovement only when traceability is demonstrably required
```

## Required gates

| Capability | Must exist first | Forbidden shortcut |
| --- | --- | --- |
| Customer/object UI | **Implemented foundation:** tenant-owned models, migration, contracts, validation, API, permissions | Static cards or job strings presented as records |
| Structured job links | **Implemented foundation:** customer/address/object API, tenant checks, area/object invariant, legacy compatibility | Removing `customerName`/`location` without migration/history decisions |
| Assignment administration | **Implemented foundation:** typed links, lifecycle, tenant checks, role rules | Browser-only assignment state |
| Worker findings | **Implemented foundation:** compatible report types/fields, actor, worker job access, tenant rules, linked evidence, explicit office review | Free-form UI that loses existing reports or evidence |
| Job cost ledger | **Implemented foundation:** tenant-owned cost lines, strict kinds/units/amounts, optional item validation, actor attribution, backend summaries | Frontend-only totals or treating item quantity as job cost |
| Customer report generator | **Implemented foundation:** job-grounded stable source snapshots, approved-report eligibility, explicit attachment/cost selection, lifecycle, tenant rules, shared contracts, API, real UI, and smoke coverage | Resolving mutable sources live or presenting a styled view as an issued/exported document |
| Customer report polish / PDF readiness | **Implemented:** stored-snapshot presentation boundary, explicit customer/internal separation, source-scope UX, A4 browser print, honest attachment limitation | Claiming PDF export exists because browser print renders, or coupling invoice/email behavior into presentation work |
| Daily worksheets / team protocols | **Implemented foundation:** company ownership, ordered free-text rows, optional tenant-safe relations, direct/team assignment, role-specific locking, explicit lifecycle, actors/timestamps, shared contracts, API, real UI, and smoke coverage | Renaming worksheets as Jobs, client-only assignment, or exposing draft/internal data to workers |
| Worksheet usability / hardening | **Implemented:** role-safe exact filters, server-backed today query, derived completion counts, worker execution flow, context/review/lock presentation, browser print, and status-scoped transactional row writes | Client-only filtering, bypassing assignment visibility, treating print as PDF export, or adding downstream conversions during polish |
| Worksheet review-to-follow-up Job | **Implemented first slice:** reviewed source only, explicit action record, immutable source snapshot, actor/time/status, atomic normal-Job creation, tenant-safe relations, idempotent replay, duplicate protection, office-only control | Silently creating records during review or duplicating a second Job system |
| Worksheet review-to-cost/report | **Implemented:** reviewed source only, explicit selected tenant-owned target Job, normal cost/report records, immutable provenance, typed destinations, atomic creation, and reuse of existing cost/report validation, permissions, amounts, and lifecycle | Creating free-floating costs/reports or bypassing existing Job domains |
| Service agreements / recurring object duties | Stable worksheet planning, customers/objects, schedule/timezone rules, templates, and exception semantics | Bulk-generating rigid Jobs far ahead or implementing browser-only reminders |
| Command-center dashboard | Trusted worksheets, jobs, assignments, findings, costs, object issues, and server-backed metrics | Decorative cards, fake counts, or premature drag-and-drop |
| Offer/invoice preparation | Reviewed job costs, customer/object context, immutable line snapshots, numbering/tax rules | Mutable issued documents or unsupported totals |
| Smart planning/automation/AI | Trusted workflows, permissions, auditability, human review, measurable tasks | Autonomous consequential changes or AI replacing absent logic |
| Optional movement history | Demonstrated traceability need, item identity, explicit event/correction semantics | Building warehouse workflows as the default product direction |

## Backend-complete gate

A model or route alone is not a completed dependency. Before dependent UI begins, require reviewed ownership and lifecycle, shared contracts, runtime validation, tenant-safe references, service-level roles, useful errors, representative denial/cross-tenant verification, and updated documentation.

The directory, Job relations, item/category identity, generic Assignment, Job Execution Reports / Worker Findings, Job Cost Ledger, Phase 7 Customer/Object Report Generator, Phase 7B presentation/print, Phase 8 daily worksheet/team protocol foundation, Phase 8B worksheet usability/hardening, and all three Phase 9 review actions meet this gate. The next default phase is exactly `Phase 10 — Service Agreements / Recurring Object Duties Foundation`. Recurring agreements must feed worksheet planning instead of bulk-generating rigid future Jobs. Item movement is not a prerequisite and should remain optional until a concrete traceability workflow justifies it.

## Phase 8 worksheet gate

Phase 8 supplies company-owned dated sheets and ordered rows, optional tenant-validated customer/address/object/object-area/Job links, free text, direct WORKER and/or team assignment, actor/timestamp audit fields, a forward-only `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED` lifecycle, role-specific field locking, real office/worker UI, and representative happy-path, denial, invalid-transition, and cross-tenant smoke proof. It deliberately supplies no conversion action, recurring agreement, generated Job, command board, PDF artifact, invoice, email, AI, or mobile workflow.

## Phase 8B worksheet usability gate

Phase 8B adds exact list filtering, a role-aware today query and worker execution page, clearer completion/assignment/context/review/lock presentation, A4-oriented browser print, and status-scoped transactional protection around row writes. It adds no schema or lifecycle state and does not loosen the Phase 8 tenant, assignment, field, or internal-note boundaries. Phase 8B itself added no downstream action; the later Phase 9 follow-up action below remains explicit rather than automatic. No PDF artifact/export, recurring service agreement, or generated-future-Job system exists.

## Phase 9 follow-up Job gate

The first Phase 9 slice adds `WorksheetReviewAction` and one explicit `CREATE_FOLLOW_UP_JOB` action per reviewed row. It records immutable schema-versioned source context, actor/time/status, a deterministic idempotency identity, request fingerprint, and destination Job identity. The normal `Job` and its activity are created in the same transaction as the action. Same-input replay returns the original action/Job; changed replay conflicts. OWNER/OFFICE alone may invoke it, every source/destination relation is tenant-scoped, and reviewed/archived worksheet content remains locked. Costs, reports, billable items, customer messages, recurrence, PDF artifacts, and automation are not created by this slice.

## Phase 9B cost/report action gate

Phase 9B extends the same aggregate with one `CREATE_JOB_COST_LINE` and one `CREATE_JOB_REPORT` action per reviewed row. Both require a deliberately selected tenant-owned target Job and keep restrictive typed links to the normal downstream record. Cost creation reuses existing Item, currency, amount, and actor rules. Report creation accepts structured types only and starts in the existing `PENDING_REVIEW` lifecycle. Source/target Job/Item/Team checks are tenant-safe; the downstream record, readable Job activity, and action commit atomically. Same-input retries return the existing record, while changed retries conflict. No free-floating records, bulk action, automatic conversion, billable/customer message, undo/cancel, or correction/supersession path exists.

## Phase 7 snapshot gate

Phase 7 now supplies a company-owned, job-grounded aggregate; explicit selected source IDs; copied job/directory, approved-report, attachment-metadata, and cost data; fixed source ordering; OWNER/OFFICE-only access; a draft/review/approve/archive lifecycle; job activity; and a minimum real-API review UI. Source selection is immutable after creation and there is no linked revision/supersession model yet.

Phase 7B now supplies clearer source eligibility/cost-scope UX, a snapshot-only customer presentation, structural internal-note exclusion, office-only original-file diagnostics, and browser-print styling. A real export must later define artifact generation, reproducible file access, template/version identity, authorization, and failure/audit behavior; browser print alone does not satisfy that gate. Invoice issuance, payments, email delivery, AI, movement/logistics, command board, drag-and-drop, QR, and mobile remain outside this dependency slice.
