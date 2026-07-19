# Roadmap

Phases are dependency order, not calendar promises. Advance when goals and safety checks are implemented, verified, and documented.

## Phase 0 — Protect and verify existing foundation

**Goals:** Reverify auth context, tenant isolation, roles, teams, jobs, lifecycle, activity, reports, and attachments; reconcile stale guidance; add real tests/linting and useful logs; make local boot repeatable; define migration compatibility standards.

**Dependencies:** Existing repository.

**Must not build yet:** Command board, inventory UI, billing, QR, AI, or enterprise workflows.

## Phase 1 — Customers, addresses, objects

**Status:** Implemented and verified in schema, migration, shared contracts, API, simple web administration, and the expanded live PostgreSQL smoke flow.

**Goals:** Add tenant-owned `Customer`, `Address`, `Object`, and `ObjectArea`; decide identifiers, archive behavior, address reuse, ownership, deletion, indexes, and uniqueness; add shared contracts, validation, permissions, API, and verification. Add only minimal admin UI after backend behavior is stable if included in scope.

**Dependencies:** Phase 0 safety baseline.

**Must not build yet:** Items, generic assignments, drag-and-drop, billing, automation, or broad UI redesign.

## Phase 2 — Link jobs to customers/objects/addresses

**Status:** Implemented and verified. Jobs retain required `customerName`/`location` fields and may optionally link to tenant-owned customers, addresses, objects, and object areas. Object-area parent validation, relation activity, real-data selectors, migration, focused builds/typechecks, and smoke coverage are in place.

**Goals:** Add structured job relations; validate allowed combinations and tenant ownership; preserve/migrate `customerName` and `location` intentionally; update contracts, writes, reads, activity, forms, and verification.

**Dependencies:** Phase 1 models and API.

**Must not build yet:** Billing, generalized scheduling, assignment board, inventory/movements, or custom workflows.

## Phase 3 — Items/materials/assets foundation

**Goals:** Add `ItemCategory` and `Item` with explicit consumable/durable, quantity/serialized, unit, custom-ID, lifecycle, lookup, and tenant rules; define location/custody and bundle/asset specialization boundaries.

**Dependencies:** Phase 0 and Phase 1 locations where placement requires them.

**Must not build yet:** Movement UI, QR scanning, stock dashboards, predictive replenishment, or full vehicle maintenance.

## Phase 4 — Generic assignments

**Goals:** Model time-aware allocation for jobs, teams, users, and approved resources; define status, conflicts, replacement/unassignment, history, and compatibility with `Job.teamId`; expose atomic tenant-safe operations.

**Dependencies:** Stable Phase 2 jobs and Phase 3 resource identities where included.

**Must not build yet:** Drag-and-drop dispatch, auto-scheduling, or client-only assignment state.

## Phase 5 — Movement history

**Goals:** Implement append-oriented movements with source, destination, quantity/unit, actor, reason, time, and work context; define transactional balance/current-location, correction, and concurrency behavior; verify audit and isolation.

**Dependencies:** Phase 3 items and Phase 4 assignments where allocation context is needed.

**Must not build yet:** Polished inventory control room, QR-first flows, silent history edits, or balance-based automation.

## Phase 6 — Command board UI

**Goals:** Build a board over real jobs, assignments, teams, resources, and lifecycle; add server-backed filters, permissions, conflicts, and atomic interactions. Drag-and-drop is allowed only when gestures map to validated commands.

**Dependencies:** Phases 2 and 4, plus any Phase 5 state displayed.

**Must not build yet:** Optimistic-only interactions, hidden scheduling rules, billing, or ungoverned AI scheduling.

## Phase 7 — Reports/documents

**Goals:** Evolve current reports/attachments with review states, templates, approvals, ownership, production storage, retention, and generation; safely connect evidence to stable jobs, objects, assignments, people, and resources; preserve existing flows.

**Dependencies:** Stable context relations and explicit document ownership.

**Must not build yet:** Invoice generation disguised as reporting, uncontrolled sharing, or unreviewed AI official records.

## Phase 8 — Billing/offers/invoices

**Goals:** Model offers, invoice identity, immutable party/address and line-item snapshots, taxes, currency, prices, totals, status, and numbering; derive inputs from governed work while retaining approval; add exports only after correctness.

**Dependencies:** Customers/addresses, linked jobs, relevant service/item concepts, and reliable performed-work records.

**Must not build yet:** Frontend-only totals, mutable issued invoices, unsupported payment claims, or AI-controlled invoicing.

## Phase 9 — AI/automation

**Goals:** Add event-driven rules, idempotent work, notifications, integration audit, and human approval boundaries; use AI only for defined measurable tasks; enforce data boundaries and traceability.

**Dependencies:** Trusted data, stable workflows, permissions, audit events, and monitoring.

**Must not build yet:** Autonomous high-impact actions, opaque cross-tenant data use, or AI replacing absent logic.

## Phase 10 — Enterprise/custom workflow layer

**Goals:** Add configurable fields/forms/states, approval chains, policies, integrations, organizational structures, and audit/export; keep configuration versioned, validated, isolated, and compatible with core invariants.

**Dependencies:** Stable modules, event model, permissions, reporting, relevant billing, and production maturity.

**Must not build yet:** Unrestricted tenant scripts, permission bypasses, or one-off forks that fragment the core.
