# EinsatzPilot

EinsatzPilot is a modular all-in-one operations platform for planning, assigning, documenting, reviewing, proving, and improving everyday work across business types and industries.

Hausmeister, cleaning, gardening, and facility-service workflows are its first concrete proof and product workbench, not its final boundary. The same modular architecture is intended to adapt to small businesses, service companies, shop owners, trades, technicians, office teams, logistics teams, corporate operational teams, and other everyday-work industries. The current implementation is not a dedicated inventory, warehouse, route-planning, or delivery system; items and materials support work documentation and costs rather than defining the product.

## Current status

The repository currently provides a narrower working foundation:

- pnpm TypeScript monorepo with NestJS API, Prisma/PostgreSQL, and Next.js web app.
- Company, user, membership, role, team, job, activity, report, attachment, job-cost, customer-report snapshot, customer, address, object, object-area, item-category, item, and generic assignment models.
- Tenant-scoped operational reads/writes and role checks for implemented flows.
- Optional, tenant-validated job links to customers, addresses, objects, and object areas while preserving legacy customer/location text.
- Explicit job lifecycle transitions.
- Admin web routes for development login, dashboard, jobs, teams, reports, attachments, customers/addresses, objects, and object areas using real API data.
- Tenant-safe item/category APIs and a minimal `/items` administration page with generated company-unique custom IDs and strict quantity/serialized rules.
- Tenant-safe generic assignment APIs and a minimal `/assignments` page using grouped real-data entity options while preserving `Job.teamId`.
- Backwards-compatible structured execution reports with worker findings, performed/outstanding work, follow-up data, linked evidence, assignment-aware WORKER submission, and explicit OWNER/OFFICE review.
- Tenant-safe job cost APIs and job-detail UI for material, labor, travel, external, fee, and custom cost lines with optional item references and backend-derived summaries.
- OWNER/OFFICE-only customer-report APIs and real web flows for job-grounded stable snapshots, explicit selection of approved execution reports and attachment metadata references, selected cost-line breakdowns, optional full backend-derived cost summaries, draft editing, review, approval, and archival.
- Polished customer-report list/creation/detail presentation with status-specific source eligibility, explicit cost-scope explanations, separate office-only internal notes, and a clean A4-oriented browser-print view rendered only from stored snapshot data.
- Company-owned daily worksheets with ordered free-text planning rows, optional customer/address/object/object-area/Job context, direct worker and/or team assignment, a `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED` lifecycle, actor/timestamp attribution, strict tenant-safe permissions, exact office filters, a worker-focused today flow, completion/context/review polish, and A4-oriented browser print.
- PostgreSQL container helpers and an API smoke flow.

This is not yet the full operations platform. Customer-report data generation, customer-facing layout polish, browser-print readiness, and the hardened daily worksheet/team protocol flow are implemented. Deliberate worksheet-review conversion into follow-up Jobs/costs/reports, recurring service agreements, command-center metrics, automation, template/version models, customer delivery, invoice/offer preparation, and commercial document workflows remain planned. Browser print is not a generated PDF/export artifact. Authentication is development-only, file storage is local, report evidence references can outlive their original attachment files, customer-report revision/supersession and source refresh are absent, job-report revision/resubmission and cost correction history are not implemented, automated tests/linting are not configured, and mobile is only a scaffold.

## Product direction

- Everyday operational work is the product center.
- Jobs are governed work records in the current foundation.
- Daily worksheets/team protocols bridge object responsibility and actual worker execution.
- Objects are the memory.
- Reports are the proof.
- Costs are the money layer.
- Assignments are the control layer.
- Items and materials are supporting context, not the main product.

The implemented worksheet workflow starts when the office prepares a dated draft for a team or worker, combining optional directory/Job context with ad hoc instructions such as key handovers or meeting a tradesperson. The office can filter the worksheet overview by date, status, team, and worker. Sending locks planning and exposes the sheet only to its assigned worker or current team members. Workers use a focused today view to record actual text for each row and submit it; the office sees completion, review attribution, notes, locked states, and a browser-printable protocol. A later phase will let the office deliberately turn reviewed entries into governed follow-up Jobs, costs, reports, or customer-communication inputs. Recurring agreements will later feed this flexible daily planning instead of generating a rigid second Job system far ahead.

## Documentation

Agents and contributors must start with [Agent Start Here](./docs/00_AGENT_START_HERE.md).

- [Product vision](./docs/01_PRODUCT_VISION.md)
- [Current repository state](./docs/02_CURRENT_REPO_STATE.md)
- [Domain model](./docs/03_DOMAIN_MODEL.md)
- [Feature dependencies](./docs/04_FEATURE_DEPENDENCIES.md)
- [Roadmap](./docs/05_ROADMAP.md)
- [Agent build rules](./docs/06_AGENT_BUILD_RULES.md)
- [Recommended next steps](./docs/07_NEXT_STEPS.md)
- [Foundation checklist](./FOUNDATION_CHECKLIST.md)

These docs distinguish implementation from plans. Update them after every meaningful model, API, permission, workflow, or setup change.

## Repository layout

```text
apps/
  api/       NestJS API, Prisma schema, and migrations
  web/       Next.js office/admin application
  mobile/    Reserved Expo mobile scaffold
packages/
  config/    Shared configuration placeholder
  schemas/   Shared enum values and parsing helpers
  types/     Shared API/domain TypeScript contracts
  utils/     Shared utility placeholder
docs/        Product, architecture, dependencies, roadmap, and agent guidance
scripts/     Local PostgreSQL and API smoke helpers
```

## Prerequisites

- Node.js
- pnpm 10.x
- PostgreSQL, or Podman for the included database helper
- `curl` and `jq` for the smoke script

## Local setup

```bash
pnpm install
pnpm db:up
```

Create `apps/api/.env` using the connection string printed by `pnpm db:up`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/einsatzpilot"
PORT=3001
JWT_SECRET="replace-this-development-secret"
```

Generate Prisma and apply checked-in migrations:

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

Run API and web in separate terminals:

```bash
pnpm dev:api
pnpm dev:web
```

The API defaults to `http://localhost:3001/api`; Next.js normally serves web on `http://localhost:3000`.

## Verification

With PostgreSQL and the API running:

```bash
pnpm smoke:api
pnpm typecheck
pnpm build
```

The smoke flow creates development data. Package `lint` and `test` scripts currently only print placeholder messages; do not treat them as quality checks.

## Development direction

Directory Gate 1, backwards-compatible Job relation Phase 2, the supporting `ItemCategory`/`Item` Phase 3 foundation, generic Assignment Phase 4, Job Execution Reports / Worker Findings Phase 5, Job Cost Ledger Phase 6, Customer/Object Report Generator Foundation Phase 7, Customer Report Polish/PDF Readiness Phase 7B, Daily Worksheets / Team Protocols Foundation Phase 8, and Daily Worksheets Usability and Hardening Phase 8B are implemented. Browser print exists; actual PDF generation/export does not. The next recommended phase is exactly `Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports`. Recurring service agreements are Phase 10, the command center is Phase 11, and smart planning/AI/automation is Phase 12. Invoice issuance, payments, customer email sending, item movement, drag-and-drop, QR, and mobile remain deferred. Invoice, email, or PDF-export behavior requires later explicit approval. See [Recommended next steps](./docs/07_NEXT_STEPS.md).

## License

This repository is licensed under the Functional Source License 1.1 (FSL-1.1). The public repository contains the core platform; premium modules and commercial extensions may be maintained separately. See [LICENSE.md](./LICENSE.md).
