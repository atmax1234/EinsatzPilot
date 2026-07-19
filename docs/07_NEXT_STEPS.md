# Next Steps

## Completed gate

Domain Foundation Phase 4 is complete in the verified local setup.

- All eight migrations are applied to PostgreSQL.
- Assignment source/target types are closed enums and both endpoint IDs are tenant-validated.
- Users, teams, jobs, customers, addresses, objects, object areas, and items are available as real-data assignment options.
- OWNER/OFFICE can create/update; WORKER can read.
- Optional timing requires the end to follow the start.
- Exact duplicate active source/target/kind links are rejected in service and database rules.
- Planned and active assignments use explicit terminal lifecycle transitions.
- `Job.teamId` remains working and is not mutated or synchronized by generic assignments.
- `/assignments` provides minimal real-API creation, listing, and basic update behavior.
- The expanded smoke flow preserves Phase 1/2/3 checks and covers Phase 4 happy paths, validation, roles, and cross-tenant protection.

## Recommended next implementation slice

Begin `Domain Foundation Phase 5 — Item Movement History` only after the Phase 4 migration, root typecheck, API/web builds, expanded smoke flow, and diff checks are clean.

The purpose of Phase 5 is append-oriented item quantity/location/custody history with explicit actor, reason, time, and validated context. It must not silently replace item state or assignment meaning, and it must define transactional balance/current-state behavior before exposing movement writes.

## Required scope

- Decide movement kinds, quantity/unit semantics, source/destination representation, correction policy, and current-state derivation.
- Add an additive Prisma migration and shared contracts.
- Implement strict runtime validation, tenant-safe item/context lookups, service-level roles, and transactional writes.
- Preserve existing item quantity/tracking and generic assignment behavior intentionally.
- Add minimal real-API visibility only after movement invariants are working.
- Expand PostgreSQL smoke coverage without weakening Phase 1/2/3/4 assertions.
- Update current-state, domain, dependency, roadmap, next-step, and checklist docs.

## Still out of scope

- Command board or drag-and-drop.
- Custody-transfer UI or QR-first workflows.
- Bundles or package composition.
- Billing, offers, invoices, AI, automation, or mobile features.

## Known Assignment limitations

- Source/target IDs are typed polymorphic references without direct database foreign keys; service validation is mandatory.
- Entity-type pair semantics are not restricted beyond closed types, existence, tenancy, and distinct endpoints.
- Duplicate prevention covers exact active identity, not overlapping planned time ranges or wider resource conflicts.
- Assignment changes have no append-only event log; only creator and record timestamps are retained.
- Generic team-to-job assignments do not synchronize with or replace `Job.teamId`.
- There are no delete endpoints, filters, pagination, command board, drag-and-drop, or scheduling engine.

## Exact recommended prompt

```text
Implement `Domain Foundation Phase 5 — Item Movement History`.

First verify that all Phase 4 migrations are applied and that root typecheck, API/web builds, the expanded smoke flow, and git diff checks are clean. Stop if existing Phase 1/2/3/4 smoke coverage breaks.

Add an append-oriented, tenant-safe ItemMovement foundation with an additive Prisma migration, shared contracts, strict quantity/unit and time validation, service-level role checks, company-scoped item and context lookups, explicit actor/reason/source/destination semantics, transactional balance or current-state rules, minimal real-API visibility, expanded smoke coverage, and documentation updates.

Preserve current Item tracking rules, generic Assignment behavior, Job.teamId, Job lifecycle, reports, attachments, tenant isolation, and role checks. Do not add command board, drag-and-drop, QR/barcodes, bundles, billing, AI, automation, or mobile features.
```
