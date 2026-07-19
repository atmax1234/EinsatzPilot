# Current Repository State

## Snapshot

This reflects the repository inspected on 2026-07-19. Checked-in code is the source of truth if it later differs.

EinsatzPilot is a pnpm TypeScript monorepo:

- `apps/api`: NestJS API with Prisma and PostgreSQL.
- `apps/web`: Next.js office/admin application.
- `apps/mobile`: reserved Expo package, currently only a scaffold.
- `packages/types`: shared API and domain-facing TypeScript contracts.
- `packages/schemas`: enum lists and parsing helpers, not comprehensive runtime validation.
- `packages/config` and `packages/utils`: minimal placeholders.

## Backend modules

- **Auth:** development login, signed stateless token, session/logout responses, company-context lookup, and temporary development-header fallback. This is not production authentication.
- **Common context:** authentication and active-company guards and current user/company decorators.
- **Operations:** dashboard and company-member reads; team create/update/list and member add/remove; job create/update/list/detail, company-scoped relation options, and controlled status transitions.
- **Directory:** tenant-scoped customer, address, object, and object-area reads and writes. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Items:** tenant-scoped item-category and item reads and writes with strict kind, unit, tracking, quantity, lifecycle, category-relation, and custom-ID validation. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Reports:** list and create job reports.
- **Attachments:** list/upload job attachments, metadata/file download, and company photo feed.
- **Prisma, health, foundation, and root metadata.**

Role rules currently allow `OWNER` and `OFFICE` to write jobs and teams. All three roles can create reports and attachments and read company artifacts. Status transitions are `PLANNED -> IN_PROGRESS|CANCELED`, `IN_PROGRESS -> DONE|CANCELED`, and authorized reopening from `DONE -> PLANNED`; `CANCELED` is terminal.

Implemented operational queries are company-scoped. The smoke script checks that a different tenant receives `404` for a job read. This is useful proof, but there is no automated unit/integration suite.

## Prisma models

The schema contains `Company`, `User`, `Membership`, `Team`, `TeamMember`, `Job`, `JobActivity`, `JobReport`, `JobAttachment`, `Customer`, `Address`, `Object`, `ObjectArea`, `ItemCategory`, and `Item`.

Customers have a typed category and active state. Addresses optionally belong to customers and may be reused by objects. Objects optionally reference a customer and address and contain one-level object areas. All four models carry `companyId`; API relation lookups validate the active tenant. No delete endpoints or hierarchical object areas exist.

Jobs still store required `customerName` and `location` strings and optionally reference one team. They may now also reference one customer, address, object, and object area. All relation lookups are scoped to the active company; an object area requires and must belong to the selected object. Relation changes create readable `JobActivity` notes. There is no automatic inference, backfill, snapshotting, or generic assignment relation. Reports only have `SUBMITTED` status. Attachments use local filesystem storage.

Item categories are company-owned and have company-unique names, a kind, an active flag, and optional description. Items are company-owned, may link to one category from the same company, and have a company-unique custom ID. Missing custom IDs are generated in a safe `ITEM-...` form. Items explicitly store kind, unit, `QUANTITY` or `SERIALIZED` tracking mode, decimal quantity, lifecycle status, and optional description/notes. Serialized items must have quantity `1`; quantity items must be nonnegative. No delete, movement, assignment, custody, location, bundle, or QR behavior exists.

Seven migrations now cover identity, operations, the `SCHEDULED` to `PLANNED` rename, reports/files, the directory foundation, optional Job directory relations, and the item/category foundation. All seven are applied to the live local PostgreSQL database used by the expanded smoke flow.

## Shared types and schemas

Shared types cover auth/session/company context; memberships; teams and members; jobs, optional directory relations, relation lookup options, activity, lifecycle and dashboard; reports; attachments; customers; addresses; objects; object areas; item categories; and items. Shared enum lists/parsers cover directory and item/category enums. Types do not exist for movements, generic assignments, bundles, specialized assets, vehicles, billing, or automation.

## Web state

The Next.js app has `/login`, `/dashboard`, `/jobs`, `/jobs/[jobId]`, `/teams`, `/reports`, `/customers`, `/objects`, `/objects/[objectId]`, and `/items`. It stores the development token in an HTTP-only cookie and uses the real API for implemented flows. Job create/edit forms expose optional live directory selectors while retaining required free-text customer and location fields. The customer page supports customer/address listing, creation, and update. Object pages support listing, creation, detail/update, and object-area creation/update. The item page supports category and item listing, creation, and basic inline update; it exposes read-only data to `WORKER` and write forms to `OWNER`/`OFFICE`.

Some copy in `admin-mvp.ts` is stale and describes already-connected areas as future work; verify pages and API calls rather than trusting that helper copy.

There are no inventory dashboard, movement, assignment, custody, bundle, QR, billing, workflow, or AI screens, and no drag-and-drop board.

## Mobile readiness

`apps/mobile` has package metadata, TypeScript config, a README, and one inert source marker that keeps the reserved package typecheckable. It has no screens, navigation, API integration, or declared Expo/React Native dependencies. Treat it as a reserved scaffold, not a working app. Offline behavior, upload resilience, device authentication, worker workflows, and mobile-specific API needs are unimplemented.

## Verification and known gaps

- PostgreSQL 16 is managed through the Podman helper in the verified local setup. The expanded smoke script passes directory CRUD, legacy and linked Job creation, Job relation updates/options/activity, item-category and item create/read/update, generated and duplicate custom-ID behavior, quantity/serialized invariants, worker read/write roles, and cross-tenant reads/relation injection.
- Build/typecheck scripts exist. Lint/test scripts are placeholders and run no real checks.
- On 2026-07-19, Prisma validation/generation, migrate deploy/dev, root and focused typechecks, root and focused builds, the expanded smoke flow, and `git diff --check` passed. The reserved mobile scaffold includes only an inert source marker so the root typecheck remains usable without adding mobile behavior.
- Production auth, token revocation/refresh, hardened cookie configuration, production object storage, structured logging, and formal API docs are missing.
- Movement, assignment, custody, bundle, specialized asset/vehicle, billing, notification, automation, and enterprise domains are missing.
- Report approval lifecycle, generated documents, storage/retention policy, and future-proof ownership are incomplete.
- Local boot is not yet documented as confusion-free in the foundation checklist.

Do not convert roadmap intentions into “existing features” when updating this document.
