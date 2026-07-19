# EinsatzPilot

EinsatzPilot is a modular company operations command center for managing customers, objects, jobs, teams, reports, costs, responsibilities, and customer-facing proof.

It is designed for service companies coordinating recurring work, one-time jobs, incidents, teams, worker findings, customer proof, and commercial preparation. It is not an inventory, logistics, delivery, or warehouse app. Items and materials support job documentation and costs rather than defining the product.

## Current status

The repository currently provides a narrower working foundation:

- pnpm TypeScript monorepo with NestJS API, Prisma/PostgreSQL, and Next.js web app.
- Company, user, membership, role, team, job, activity, report, attachment, job-cost, customer, address, object, object-area, item-category, item, and generic assignment models.
- Tenant-scoped operational reads/writes and role checks for implemented flows.
- Optional, tenant-validated job links to customers, addresses, objects, and object areas while preserving legacy customer/location text.
- Explicit job lifecycle transitions.
- Admin web routes for development login, dashboard, jobs, teams, reports, attachments, customers/addresses, objects, and object areas using real API data.
- Tenant-safe item/category APIs and a minimal `/items` administration page with generated company-unique custom IDs and strict quantity/serialized rules.
- Tenant-safe generic assignment APIs and a minimal `/assignments` page using grouped real-data entity options while preserving `Job.teamId`.
- Backwards-compatible structured execution reports with worker findings, performed/outstanding work, follow-up data, linked evidence, assignment-aware WORKER submission, and explicit OWNER/OFFICE review.
- Tenant-safe job cost APIs and job-detail UI for material, labor, travel, external, fee, and custom cost lines with optional item references and backend-derived summaries.
- PostgreSQL container helpers and an API smoke flow.

This is not yet the full command center. Customer report generation, recurring service contracts, command-center metrics, invoice/offer preparation, and commercial document workflows remain planned. Authentication is development-only, file storage is local, report revision/resubmission and cost correction history are not implemented, automated tests/linting are not configured, and mobile is only a scaffold.

## Product direction

- Jobs are the star.
- Objects are the memory.
- Reports are the proof.
- Costs are the money layer.
- Assignments are the control layer.
- Items and materials are supporting context, not the main product.

A representative workflow starts with recurring services at a managed object, continues through an incident job, team assignment, worker findings and photos, office review, material/labor/travel costs, and ends in customer-facing proof with an invoice-ready summary.

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

Directory Gate 1, backwards-compatible Job relation Phase 2, the supporting `ItemCategory`/`Item` Phase 3 foundation, generic Assignment Phase 4, Job Execution Reports / Worker Findings Phase 5, and Job Cost Ledger Phase 6 are implemented, migrated, and covered by the live smoke flow. The next recommended session is `Phase 7 Planning — Customer/Object Report Generator`; implementation should follow only after snapshot, lifecycle, source-selection, and review behavior are deliberately designed. Item movement remains optional later infrastructure. See [Recommended next steps](./docs/07_NEXT_STEPS.md).

## License

This repository is licensed under the Functional Source License 1.1 (FSL-1.1). The public repository contains the core platform; premium modules and commercial extensions may be maintained separately. See [LICENSE.md](./LICENSE.md).
