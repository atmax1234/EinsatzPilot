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
| Worker findings | Existing JobReport/Attachment compatibility, explicit fields, actor, tenant rules, review lifecycle | Free-form UI that loses existing reports or evidence |
| Job cost ledger | Jobs, cost kinds, units, currency/tax decisions, actor/review rules | Frontend-only totals or treating item quantity as job cost |
| Customer report generator | Reviewed findings, durable photo/file references, work-performed and cost summaries | Generating official documents from unreviewed mutable state |
| Recurring service contracts | Stable customers/objects/jobs, schedule/timezone rules, templates, generation idempotency | Repeating browser reminders without durable definitions |
| Command-center dashboard | Trusted jobs, assignments, findings, costs, object issues, server-backed metrics | Decorative cards, fake counts, or premature drag-and-drop |
| Offer/invoice preparation | Reviewed job costs, customer/object context, immutable line snapshots, numbering/tax rules | Mutable issued documents or unsupported totals |
| Smart planning/automation/AI | Trusted workflows, permissions, auditability, human review, measurable tasks | Autonomous consequential changes or AI replacing absent logic |
| Optional movement history | Demonstrated traceability need, item identity, explicit event/correction semantics | Building warehouse workflows as the default product direction |

## Backend-complete gate

A model or route alone is not a completed dependency. Before dependent UI begins, require reviewed ownership and lifecycle, shared contracts, runtime validation, tenant-safe references, service-level roles, useful errors, representative denial/cross-tenant verification, and updated documentation.

The directory, Job relations, item/category identity, and generic Assignment foundation meet this gate. The next default slice is richer job execution reports and worker findings. Item movement is not a prerequisite for the corrected roadmap and should remain optional until a concrete traceability workflow justifies it.
