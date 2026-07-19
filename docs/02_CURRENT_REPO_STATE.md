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
- **Assignments:** tenant-scoped typed source/target links with entity existence checks, creator attribution, timing validation, explicit lifecycle rules, active-duplicate protection, and real-data entity options. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Reports:** tenant-scoped legacy and structured job-report creation/listing, worker assignment access checks, linked attachment summaries, and explicit OWNER/OFFICE review decisions.
- **Job costs:** tenant-scoped job cost-line reads/writes, optional company-item validation, strict amount/currency/tax input rules, actor attribution, and backend-derived category/grand summaries. `OWNER` and `OFFICE` can create/update; `WORKER` can read.
- **Attachments:** list/upload job attachments, metadata/file download, and company photo feed.
- **Prisma, health, foundation, and root metadata.**

Role rules currently allow `OWNER` and `OFFICE` to write jobs, teams, and job costs. All three roles can read company artifacts and job cost lines and upload attachments. OWNER/OFFICE can create reports for any company job and review reports. WORKER can create reports only when the worker belongs to the job's direct team, has an active user-to-job assignment, or belongs to a team with an active team-to-job assignment. Status transitions are `PLANNED -> IN_PROGRESS|CANCELED`, `IN_PROGRESS -> DONE|CANCELED`, and authorized reopening from `DONE -> PLANNED`; `CANCELED` is terminal.

Implemented operational queries are company-scoped. The smoke script checks that a different tenant receives `404` for a job read. This is useful proof, but there is no automated unit/integration suite.

## Prisma models

The schema contains `Company`, `User`, `Membership`, `Team`, `TeamMember`, `Job`, `JobActivity`, `JobReport`, `JobAttachment`, `JobCostLine`, `Customer`, `Address`, `Object`, `ObjectArea`, `ItemCategory`, `Item`, and `Assignment`.

Customers have a typed category and active state. Addresses optionally belong to customers and may be reused by objects. Objects optionally reference a customer and address and contain one-level object areas. All four models carry `companyId`; API relation lookups validate the active tenant. No delete endpoints or hierarchical object areas exist.

Jobs still store required `customerName` and `location` strings and optionally reference one team. They may now also reference one customer, address, object, and object area. All relation lookups are scoped to the active company; an object area requires and must belong to the selected object. Relation changes create readable `JobActivity` notes. There is no automatic inference, backfill, snapshotting, or generic assignment relation.

Job reports now support `GENERAL`, `WORKER_FINDING`, `WORK_COMPLETION`, `INCIDENT_REPORT`, and `FOLLOW_UP_REQUEST` types; findings, performed and outstanding work; follow-up flags/notes; reviewer attribution; review notes; and explicit `SUBMITTED`, `PENDING_REVIEW`, `APPROVED`, `NEEDS_REVISION`, and `REJECTED` states. Existing simple payloads remain `GENERAL`/`SUBMITTED`; structured reports start `PENDING_REVIEW`. OWNER/OFFICE can make one terminal approve/revision/reject decision, which creates `JobActivity`. Attachments still use local filesystem storage and may link to a report.

Item categories are company-owned and have company-unique names, a kind, an active flag, and optional description. Items are company-owned, may link to one category from the same company, and have a company-unique custom ID. Missing custom IDs are generated in a safe `ITEM-...` form. Items explicitly store kind, unit, `QUANTITY` or `SERIALIZED` tracking mode, decimal quantity, lifecycle status, and optional description/notes. Serialized items must have quantity `1`; quantity items must be nonnegative. No delete, movement, custody, location, bundle, or QR behavior exists.

Assignments are company-owned typed links from one existing company entity to another. Closed entity types cover users, teams, jobs, customers, addresses, objects, object areas, and items. The API tenant-validates both endpoints, and USER endpoints require an active company membership. Assignment identity and kind are immutable; status, optional timing, and notes are editable. Status transitions are `PLANNED -> ACTIVE|CANCELED` and `ACTIVE -> ENDED|CANCELED`; ended/canceled assignments are terminal. Exact duplicate `ACTIVE` source/target/kind links are blocked in service and by a partial database unique index. `Job.teamId` remains independent and unchanged.

Job cost lines belong to one company and job and may optionally reference an item from the same company. Closed kinds cover material purchase/use, labor, travel, external service, fee, and other costs; closed units cover piece, time, distance, common material measures, flat rate, and other. Quantity is positive. Unit and total costs are nonnegative. Material, labor, and travel totals are always derived from quantity times unit cost; external, fee, and other lines may use a validated manual total. All lines on one job use one currency, defaulting to EUR. The model stores cost date, optional tax rate/vendor/receipt reference/notes, and creating/updating users. It does not issue invoices or move item quantity.

Ten migrations now cover identity, operations, the `SCHEDULED` to `PLANNED` rename, reports/files, the directory foundation, optional Job directory relations, the item/category foundation, generic assignments, structured execution reports/review, and the job cost ledger. All ten are applied to the live local PostgreSQL database used by the expanded smoke flow.

## Shared types and schemas

Shared types cover auth/session/company context; memberships; teams and members; jobs, optional directory relations, relation lookup options, activity, lifecycle and dashboard; structured reports and review; job cost lines and summaries; attachments; customers; addresses; objects; object areas; item categories; items; assignment inputs/responses; and assignment entity options. Shared enum lists/parsers cover report, directory, item/category, cost, and assignment enums. Types do not exist for movements, bundles, specialized assets, vehicles, billing, payments, generated customer documents, or automation.

## Web state

The Next.js app has `/login`, `/dashboard`, `/jobs`, `/jobs/[jobId]`, `/teams`, `/reports`, `/customers`, `/objects`, `/objects/[objectId]`, `/items`, and `/assignments`. It stores the development token in an HTTP-only cookie and uses the real API for implemented flows. Job detail supports legacy/general and structured report submission, displays findings/work/follow-up/review data, keeps report-linked evidence visible, and shows review controls only to OWNER/OFFICE. It also displays backend-derived cost summaries and cost lines to all company roles, with minimal create/edit forms only for OWNER/OFFICE and optional item choices from the real API. Job create/edit forms expose optional live directory selectors while retaining required free-text customer and location fields. The customer page supports customer/address listing, creation, and update. Object pages support listing, creation, detail/update, and object-area creation/update. The item page supports category and item listing, creation, and basic inline update. The assignment page uses grouped real-API entity options to create links and update status, notes, and timing.

Some copy in `admin-mvp.ts` is stale and describes already-connected areas as future work; verify pages and API calls rather than trusting that helper copy.

There are no command board, drag-and-drop, movement, custody, bundle, QR, billing, workflow, or AI screens.

## Mobile readiness

`apps/mobile` has package metadata, TypeScript config, a README, and one inert source marker that keeps the reserved package typecheckable. It has no screens, navigation, API integration, or declared Expo/React Native dependencies. Treat it as a reserved scaffold, not a working app. Offline behavior, upload resilience, device authentication, worker workflows, and mobile-specific API needs are unimplemented.

## Verification and known gaps

- PostgreSQL 16 is managed through the Podman helper in the verified local setup. The expanded smoke script passes directory CRUD, legacy and linked Job creation, Job relation updates/options/activity, item-category and item behavior, assignment create/list/detail/update/options, supported assignment shapes, duplicate/time validation, unchanged `Job.teamId`, legacy and structured reports, linked evidence, follow-up, office review, job-cost create/list/update/summary behavior, worker access/denial, and cross-tenant reads/relation injection.
- Build/typecheck scripts exist. Lint/test scripts are placeholders and run no real checks.
- On 2026-07-19, Prisma validation/generation, migrate deploy/status, focused and root typechecks, API/web production builds, the expanded Phase 1-6 smoke flow, and `git diff --check` passed. The reserved mobile scaffold includes only an inert source marker so the root typecheck remains usable without adding mobile behavior.
- Production auth, token revocation/refresh, hardened cookie configuration, production object storage, structured logging, and formal API docs are missing.
- Movement, custody, bundle, specialized asset/vehicle, billing, notification, automation, and enterprise domains are missing.
- Assignment source/target IDs are typed polymorphic references and therefore do not have direct database foreign keys. The service validates them on create/update; future delete/archive policies must preserve assignment readability.
- Assignment updates overwrite current status/timing/notes and have no separate assignment event history yet. Only creator and record timestamps are retained.
- Report editing/resubmission after `NEEDS_REVISION`, nonterminal review correction, production storage/retention, and generated customer documents are not implemented.
- Cost lines have no delete/correction event history or approval lifecycle. Tax rate is stored as cost metadata but is not used to calculate tax-inclusive/exclusive totals. Each job currently uses one currency, and receipt files are not linked directly to cost lines.
- Local boot is not yet documented as confusion-free in the foundation checklist.

Do not convert roadmap intentions into “existing features” when updating this document.
