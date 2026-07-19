# Roadmap

Phases are dependency order, not calendar promises. EinsatzPilot is job-centered service-operations software, not an inventory, logistics, delivery, or warehouse application.

## Phase 0 — Protect and verify existing foundation

**Status:** Implemented baseline and continuously reverified.

**Goals:** Protect tenant isolation, roles, teams, jobs, lifecycle, activity, reports, attachments, migrations, builds, and smoke coverage.

## Phase 1 — Customers, addresses, objects

**Status:** Implemented and verified in schema, migration, shared contracts, API, simple web administration, and the expanded PostgreSQL smoke flow.

**Purpose:** Establish customer/Verwaltung and object memory for operational work.

## Phase 2 — Link jobs to customers/objects/addresses

**Status:** Implemented and verified while preserving required `customerName` and `location` compatibility fields.

**Purpose:** Ground recurring, one-time, incident, and follow-up jobs in real customer and object context.

## Phase 3 — Items/materials/assets supporting foundation

**Status:** Implemented and verified.

**Purpose:** Provide stable optional identities for materials, tools, consumables, and assets referenced by jobs, costs, purchases, or proof. This is supporting context, not an inventory-product pivot.

## Phase 4 — Generic assignments

**Status:** Implemented and verified while keeping `Job.teamId` working and independent.

**Purpose:** Provide the control layer for responsibility and supporting-resource allocation without building a command board yet.

## Phase 5 — Job Execution Reports / Worker Findings

**Status:** Next recommended implementation phase after the Phase 4 migration, typecheck, builds, smoke flow, and diff checks are clean.

**Goals:** Evolve current reports and attachments additively to capture findings, issue condition, work performed, work still needed, follow-up required, photos/evidence, worker attribution, submission, and office review. Preserve existing report and attachment behavior.

**Product outcome:** A worker visit produces structured, reviewable operational proof that can drive follow-up work, costs, and customer communication.

**Must not build yet:** Cost accounting, PDF generation, recurring job generation, command-board drag-and-drop, or AI-generated official records.

## Phase 6 — Job Cost Ledger

**Goals:** Record job-grounded material purchases/use, labor time, travel costs, external/subcontractor costs, and custom cost lines. Define units, amounts, currency/tax boundaries, actor/review behavior, corrections, and invoice-ready summaries.

**Dependencies:** Stable jobs and reviewed execution findings. Item references are optional supporting context, not mandatory inventory transactions.

**Must not build yet:** Full accounting, stock control, payment processing, or mutable issued invoices.

## Phase 7 — Customer/Object Report Generator

**Goals:** Generate customer-facing damage, maintenance, service, proof-of-work, and object-history reports from reviewed findings, photos, work performed, costs, and follow-up notes. Make output reproducible and suitable for PDF/export.

**Dependencies:** Reviewed execution findings, durable attachments, object/customer context, and governed cost summaries where included.

**Must not build yet:** Unreviewed automatic sending, invoice issuance, or mutable official records.

## Phase 8 — Recurring Service Contracts

**Goals:** Model object-based recurring cleaning, caretaking, window, garden, winter-service, inspection, and maintenance definitions; add service templates, schedules, idempotent job generation, exceptions, and lifecycle.

**Dependencies:** Stable customer/object relations, jobs, and explicit timezone/scheduling rules.

**Must not build yet:** Browser-only recurrence, hidden scheduling assumptions, or automatic commercial commitments.

## Phase 9 — Command Center Dashboard

**Goals:** Provide a company-wide operational overview of jobs, teams, assignments, reports awaiting review, costs, objects, incidents, follow-up work, and recurring services using trusted server-backed metrics.

**Dependencies:** Stable upstream workflows and defined meanings for every count and status.

**Must not build yet:** Drag-and-drop unless assignment commands, conflicts, permissions, and atomic updates are mature; no fake dashboard data.

## Phase 10 — Smart Planning / AI / Automation

**Goals:** Assist with German customer replies, report summaries, job creation from messages, follow-up suggestions, and offer/invoice drafting. Add event-driven automation only with idempotency, permissions, auditability, and human review.

**Dependencies:** Trusted jobs, findings, reports, costs, customer context, and stable operational workflows.

**Must not build yet:** Autonomous high-impact actions, opaque cross-tenant data use, or AI as a substitute for missing business rules.

## Optional later infrastructure — Item Movement History

Item movement may be implemented later for a demonstrated need such as tool custody, asset traceability, regulated material history, or installation/removal evidence. It is not the next default phase, is not required for job costs or customer reports, and must not turn EinsatzPilot into a warehouse or logistics product.
