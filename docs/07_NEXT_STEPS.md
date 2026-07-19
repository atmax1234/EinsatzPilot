# Next Steps

## Completed gate

Domain Foundation Phase 3 is complete in the verified local setup.

- All seven migrations are applied to PostgreSQL.
- `ItemCategory` and `Item` are tenant-owned and exposed through company-scoped APIs.
- `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- Category names and item custom IDs are unique per company.
- Missing item custom IDs are generated automatically.
- Category references are optional and tenant-validated.
- Quantity items accept nonnegative decimal quantities; serialized items require quantity `1`.
- The `/items` page uses real API data for minimal category/item administration.
- The expanded smoke flow preserves Phase 1/2 checks and covers Phase 3 happy paths, validation, roles, and cross-tenant protection.

## Recommended next implementation slice

Begin `Domain Foundation Phase 4 — Generic Assignment foundation` only after the Phase 3 migration, focused and root typechecks, API/web builds, and expanded smoke flow are clean.

The purpose of Phase 4 is a tenant-safe, time-aware allocation model. It must preserve existing `Job.teamId` behavior while defining explicit assignment subjects, assignees, lifecycle, replacement/unassignment, conflicts, history, and role rules. It is not a command-board or drag-and-drop phase.

## Required scope

- Review and document assignment cardinality, time semantics, lifecycle, compatibility, and history rules.
- Add an additive Prisma migration and shared contracts.
- Implement runtime validation, company-scoped relation lookups, and service-level role permissions.
- Preserve existing Job team assignment and JobActivity behavior.
- Add only minimal real-API administration needed to verify the domain behavior.
- Expand PostgreSQL smoke coverage without weakening Phase 1/2/3 assertions.
- Update current-state, domain, dependency, roadmap, next-step, and checklist docs.

## Still out of scope

- Movement or stock history.
- Custody transfers or current-location calculations.
- Command board, drag-and-drop, or auto-scheduling.
- QR/barcode generation or scanning.
- Bundles or package composition.
- Billing, offers, invoices, AI, automation, or mobile features.

## Known Item limitations

- Items are identities and current basic attributes, not an inventory ledger.
- Quantity is stored directly; there is no movement history, reservation, balance reconciliation, or concurrency workflow.
- Serialized tracking enforces quantity `1` but has no serial-number child records yet.
- Categories and items have no delete endpoints.
- Categories do not constrain an item's independently selected kind.
- There is no location, depot, custody, assignment, bundle, QR, lot, or maintenance model.

## Exact recommended prompt

```text
Implement `Domain Foundation Phase 4 — Generic Assignment foundation`.

First verify that all Phase 3 migrations are applied and that focused/root typechecks, API/web builds, the expanded smoke flow, and git diff checks are clean. Stop if existing Phase 1/2/3 smoke coverage breaks.

Add a tenant-safe, time-aware assignment foundation with additive Prisma migration, shared contracts, strict runtime validation, service-level role checks, company-scoped relation lookups, compatibility with existing Job.teamId behavior, explicit assignment lifecycle and history, minimal real-API administration, expanded smoke coverage, and documentation updates.

Do not add movement history, custody transfers, command board, drag-and-drop, auto-scheduling, QR/barcodes, bundles, billing, AI, automation, or mobile features.
```
