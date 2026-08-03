# Feature Dependencies

## Ordering rule

Domain truth comes before interaction polish. The dependency center is the job lifecycle and the evidence and costs produced by real work, not inventory mechanics.

## Strategic map

```text
Tenant-safe identity and roles
└── Customer / Verwaltung + Address + Object + ObjectArea
    ├── Recurring service definitions (planned)
    └── Job links and compatibility migration
        ├── Job lifecycle + JobActivity
        ├── Assignment control layer
        ├── Worker findings + photos + work performed
        │   └── Office review + follow-up
        └── Job cost ledger
            ├── Labor / travel / external / custom costs
            ├── Material purchase/use (Item reference optional)
            └── Invoice-ready summary

Reviewed job execution + object memory + job costs
└── Customer/Object report snapshot foundation (implemented)
    └── Customer report polish and PDF readiness (next; PDF not implemented)

Recurring services + jobs + assignments + reports + costs
└── Company command-center dashboard
    └── Smart planning / automation / AI assistance

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
| Customer report polish / PDF readiness | Existing persisted snapshot data and approval lifecycle, customer-visible/internal field boundary, reproducible attachment access, print/export contract, template decisions | Claiming PDF export exists because the review UI renders, or coupling invoice/email behavior into presentation work |
| Recurring service contracts | Stable customers/objects/jobs, schedule/timezone rules, templates, generation idempotency | Repeating browser reminders without durable definitions |
| Command-center dashboard | Trusted jobs, assignments, findings, costs, object issues, server-backed metrics | Decorative cards, fake counts, or premature drag-and-drop |
| Offer/invoice preparation | Reviewed job costs, customer/object context, immutable line snapshots, numbering/tax rules | Mutable issued documents or unsupported totals |
| Smart planning/automation/AI | Trusted workflows, permissions, auditability, human review, measurable tasks | Autonomous consequential changes or AI replacing absent logic |
| Optional movement history | Demonstrated traceability need, item identity, explicit event/correction semantics | Building warehouse workflows as the default product direction |

## Backend-complete gate

A model or route alone is not a completed dependency. Before dependent UI begins, require reviewed ownership and lifecycle, shared contracts, runtime validation, tenant-safe references, service-level roles, useful errors, representative denial/cross-tenant verification, and updated documentation.

The directory, Job relations, item/category identity, generic Assignment, Job Execution Reports / Worker Findings, Job Cost Ledger, and Phase 7 Customer/Object Report Generator foundations meet this gate. The next default slice is exactly `Phase 7B — Customer Report Polish and PDF Readiness`, using the existing immutable source snapshot rather than rereading mutable operational data. Item movement is not a prerequisite and should remain optional until a concrete traceability workflow justifies it.

## Phase 7 snapshot gate

Phase 7 now supplies a company-owned, job-grounded aggregate; explicit selected source IDs; copied job/directory, approved-report, attachment-metadata, and cost data; fixed source ordering; OWNER/OFFICE-only access; a draft/review/approve/archive lifecycle; job activity; and a minimum real-API review UI. Source selection is immutable after creation and there is no linked revision/supersession model yet.

Phase 7B may improve layout, print behavior, PDF-export preparation, templates, and source-selection UX. A real export must later define artifact generation, reproducible file access, internal-field exclusion, template/version identity, authorization, and failure/audit behavior. Invoice issuance, payments, email delivery, AI, recurrence, movement/logistics, command board, drag-and-drop, QR, and mobile remain outside this dependency slice.
