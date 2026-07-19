# Feature Dependencies

## Ordering rule

Domain truth comes before interaction polish. Build invariants, persistence, permissions, validation, API contracts, and verified behavior before sophisticated UI. UI must not invent business state, duplicate rules, or bypass tenant and role checks.

## Strict map

```text
Tenant-safe identity and roles
└── Customer + Address + Object + ObjectArea
    └── Job links and compatibility migration
        ├── Richer reports/documents
        ├── Billing line-item foundation
        └── Stable job lifecycle
            └── Generic Assignment
                ├── Command board UI
                └── Advanced deadlines/scheduling

Tenant-safe identity and roles
└── ItemCategory + Item + custom IDs + lookup
    ├── Package/Bundle composition
    ├── QR/barcode resolution
    └── Assignment
        └── ItemMovement ledger
            └── Movement/stock/custody UI

Trusted events + stable workflows + permissions
└── Notifications and automation
    └── AI assistance
```

## Required gates

| Capability | Must exist first | Forbidden shortcut |
| --- | --- | --- |
| Customer/object UI | **Implemented foundation:** tenant-owned models, migration, contracts, validation, API, permissions | Static cards or job strings presented as records |
| Structured job links | **Implemented foundation:** customer/address/object API, tenant checks, area/object invariant, and legacy compatibility | Removing `customerName`/`location` without migration/history decisions |
| Drag-and-drop board | Assignment, conflict, lifecycle, and atomic API rules | Browser-only card movement |
| Item/inventory UI | Item/category model, units/tracking semantics, tenant-safe API | Mock counts or arbitrary JSON lists |
| Movement UI | Append-only backend, validated endpoints, transactional state rules | Editing location without movement history |
| QR codes | Stable custom IDs, uniqueness, lookup API, permissions, collision behavior | Encoding database IDs and calling scanning complete |
| Bundles | Resource identity and composition semantics | Treating a label as stock or assignment history |
| Billing | Customers, jobs, commercial identity, tax/price rules, immutable line snapshots, numbering | Frontend-only invoice totals |
| Advanced deadlines | Stable job lifecycle, assignments, timezone/conflict/escalation rules | Decorative countdowns |
| Report expansion | Stable owner/context relations, review lifecycle, storage/retention decisions | Many ambiguous nullable foreign keys |
| Automation | Trusted events, idempotency, recipients, delivery/audit state | Side effects triggered by page rendering |
| AI | Reliable data, permissions, auditability, human controls, measurable task | Unreviewed consequential changes |

## Backend-complete gate

A Prisma model or route alone is not a completed dependency. Before dependent UI begins, require:

- Reviewed ownership, nullability, uniqueness, deletion, migration, and indexes.
- Shared contracts and runtime validation.
- Tenant-safe reference lookup and role permissions.
- Service-level invariants and useful errors.
- Representative happy-path, invalid, unauthorized, and cross-tenant verification.
- Updated documentation.

Simple administrative UI may follow in the same vertical slice after these behaviors are real.

The directory foundation and backwards-compatible structured Job links meet this gate and have live migration/smoke proof. The next domain slice must preserve these tenant and compatibility rules rather than bypass them with client-only state.
