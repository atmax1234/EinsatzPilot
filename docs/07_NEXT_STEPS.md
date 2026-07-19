# Next Steps

## Completed gate

Directory Gate 1 and Domain Foundation Phase 2 are complete in the verified local setup.

- All six migrations are applied to PostgreSQL.
- Existing jobs still work with required `customerName` and `location` text only.
- Jobs may optionally link to a customer, address, object, and object area.
- Company ownership and object-area parent rules are enforced in backend services.
- Relation changes are recorded in `JobActivity`.
- Web selectors use company-scoped API data.
- The expanded smoke flow covers happy paths, worker permissions, invalid combinations, and cross-tenant injection.

## Recommended next implementation slice

Begin Domain Foundation Phase 3 with tenant-owned `ItemCategory` and `Item` records only.

The purpose of this slice is stable resource identity and classification. It is not an inventory workflow. Decide and document category ownership, item custom IDs, lifecycle, units, consumable/durable behavior, quantity-versus-serialized tracking, uniqueness, deletion/deactivation, and tenant-safe lookup before adding UI beyond simple administration.

## Required scope

- Prisma models and a reviewed additive migration.
- Shared contracts and runtime payload validation.
- Company-scoped read/write services and clear role rules.
- Safe custom-ID uniqueness and lookup behavior.
- Minimal web administration backed by real API data.
- Focused typechecks/builds and expanded PostgreSQL smoke coverage.
- Current-state, domain, dependency, roadmap, next-step, and checklist updates.

## Still out of scope

- Item movement or stock history.
- Generic assignments or custody workflows.
- Command board or drag-and-drop.
- QR/barcode generation or scanning.
- Bundles, vehicles, maintenance, or advanced assets.
- Billing, offers, invoices, AI, automation, or mobile features.

## Known Job relation limitations

- Directory links are optional and are not inferred from one another.
- `customerName` and `location` remain required independent text; no snapshot or synchronization rule exists yet.
- Existing free-text jobs are not automatically matched or backfilled.
- Inactive directory records remain available in the current relation-options response.
- Foreign keys use `SET NULL`; no directory delete endpoints currently expose that behavior.

## Exact recommended prompt

```text
Implement `Domain Foundation Phase 3 — Tenant-safe ItemCategory and Item foundation`.

Add additive Prisma models/migration, shared types and schema helpers, strict runtime validation, company-scoped lookup/write services, explicit OWNER/OFFICE write and WORKER read rules, safe company-unique custom item IDs, minimal real-API web administration, focused typechecks/builds, expanded PostgreSQL smoke coverage, and documentation updates.

Define item lifecycle, category ownership, units, consumable-versus-durable behavior, and quantity-versus-serialized tracking explicitly. Preserve all current Job, directory, role, tenant, status, report, and attachment behavior.

Do not add movement history, assignments, custody, inventory dashboards, command board, drag-and-drop, QR/barcodes, bundles, billing, AI, automation, or mobile features.
```
