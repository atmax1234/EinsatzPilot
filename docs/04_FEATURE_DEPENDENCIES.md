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
└── Customer/Object report generator
    └── Proof of work, damage, maintenance, and history output

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
| Customer report generator | **Planning gate next:** reviewed findings, durable evidence references, work/follow-up data, governed costs, explicit snapshot/lifecycle/version rules | Starting with PDF styling or generating official documents from unreviewed mutable state |
| Recurring service contracts | Stable customers/objects/jobs, schedule/timezone rules, templates, generation idempotency | Repeating browser reminders without durable definitions |
| Command-center dashboard | Trusted jobs, assignments, findings, costs, object issues, server-backed metrics | Decorative cards, fake counts, or premature drag-and-drop |
| Offer/invoice preparation | Reviewed job costs, customer/object context, immutable line snapshots, numbering/tax rules | Mutable issued documents or unsupported totals |
| Smart planning/automation/AI | Trusted workflows, permissions, auditability, human review, measurable tasks | Autonomous consequential changes or AI replacing absent logic |
| Optional movement history | Demonstrated traceability need, item identity, explicit event/correction semantics | Building warehouse workflows as the default product direction |

## Backend-complete gate

A model or route alone is not a completed dependency. Before dependent UI begins, require reviewed ownership and lifecycle, shared contracts, runtime validation, tenant-safe references, service-level roles, useful errors, representative denial/cross-tenant verification, and updated documentation.

The directory, Job relations, item/category identity, generic Assignment, Job Execution Reports / Worker Findings, and Job Cost Ledger foundations meet this gate. The next default slice is the Customer/Object Report Generator, using reviewed execution evidence and governed cost summaries to assemble reproducible customer-facing report data. Item movement is not a prerequisite and should remain optional until a concrete traceability workflow justifies it.

## Phase 7 planning gate

Do not open a Phase 7 implementation slice until planning defines the report aggregate, tenant/job ownership, eligible source states, explicit inclusion behavior, snapshot versus live-reference boundaries, lifecycle and permissions, revision/supersession rules, and the minimum reviewable UI. PDF rendering, email delivery, invoices, and AI summaries depend on this foundation and are not substitutes for it.
