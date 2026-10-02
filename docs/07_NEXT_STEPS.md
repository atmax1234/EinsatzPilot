# Next Steps

## End-of-session checkpoint

Phase 8B — Daily Worksheets Usability and Hardening is implemented on the Phase 8 worksheet foundation without a schema migration or lifecycle change.

### Phase 8 / 8B implemented behavior

- `WorkdaySheet` is a company-owned dated execution paper with an optional title, team and/or direct WORKER assignment, office-only internal notes, review notes, and actor/timestamp attribution for creation, send, submission, review, and archival.
- `WorkdaySheetRow` is an ordered planned/actual pair. `plannedText` is required; `actualText`, notes, `HH:mm` times, and links to a customer, address, object, object area, or existing Job are optional. Rows may remain pure free text.
- All optional links are validated against the active company. An object-area link requires and must match the selected object. Cross-tenant IDs receive safe not-found behavior.
- The forward-only lifecycle is `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED`. Sending requires an assignment and at least one planned row. Submission requires actual text on every row.
- OWNER/OFFICE can list/read all company sheets, create and plan drafts, send, review submitted sheets, and archive reviewed sheets. Planned fields/rows cannot change after send.
- WORKER can list/read only non-draft sheets assigned directly or through current team membership. In `SENT`, a worker can update only row `actualText` and submit. Workers cannot see `internalNotes` and cannot create, plan, send, review, or archive.
- `/workday-sheets` provides a real role-aware web workflow. Office users can create and edit drafts with live tenant-owned relation options, send sheets, review submissions, and archive. Exact date/status/team/worker filters, clearer status and assignment presentation, row/completion progress, direct actions, and useful empty states make the list operationally scannable.
- `/workday-sheets/today` gives WORKER users their current authorized sheets, planned rows and linked context, inline actual-text entry, guarded submission, and a small upcoming-sent preview. OWNER/OFFICE sees the company's sheets for the current server-local calendar date.
- Worksheet detail shows time ranges, relation context, completion, review actors/times/notes, and explicit editable/locked states. Its A4-oriented browser-print mode hides navigation, controls, forms, and internal office notes. It is not PDF generation/export.
- Draft planned-row writes and assigned-worker actual-row writes are protected by status-scoped parent updates in the same transaction, preventing writes from racing past send or submit.
- A worksheet remains distinct from a Job. No Job, cost, report, billable item, or customer communication is created automatically.

## API and persistence boundary

The Phase 8 additive migration introduced the `WorkdaySheetStatus` enum plus `WorkdaySheet` and `WorkdaySheetRow`, including indexes, relation foreign keys, nonblank/time/order checks, and lifecycle actor/timestamp consistency checks. Phase 8B adds no migration or model.

The API surface is:

- `GET /api/workday-sheets` with optional exact `date`, `status`, `teamId`, and `workerUserId` filters
- `GET /api/workday-sheets/today`
- `GET /api/workday-sheets/options`
- `POST /api/workday-sheets`
- `GET /api/workday-sheets/:sheetId`
- `PATCH /api/workday-sheets/:sheetId`
- `POST /api/workday-sheets/:sheetId/rows`
- `PATCH /api/workday-sheets/:sheetId/rows/:rowId`
- `DELETE /api/workday-sheets/:sheetId/rows/:rowId`
- `PATCH /api/workday-sheets/:sheetId/status`

## Checkpoint validation

On 2026-10-02, all twelve migrations were applied/current on PostgreSQL 16. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full API smoke flow, and `git diff --check` passed. The smoke result contains 200 passing checks: existing Phase 1–8 coverage remains green, while Phase 8B additionally proves combined list filters and derived counts, invalid-filter rejection, assigned-worker today access with internal-note redaction and completed-row counts, and unrelated-worker exclusion.

## Known current limitations

- There is no worksheet conversion/action aggregate yet. Reviewed rows do not create follow-up Jobs, costs, reports, billable-work candidates, or customer messages.
- Rows cannot be reordered, copied, bulk imported, templated, or split after creation. Position is stable insertion order.
- Exact list filters have no ranges, free-text search, pagination, or saved views. There is no calendar board.
- The today endpoint uses the API server's local calendar date; company timezone semantics are not yet modeled.
- Worksheet browser print exists, but no generated PDF/export artifact exists and browser pagination still depends on the user's print engine.
- Team-based authorization follows current `TeamMember` state; assignment recipients are not frozen as a historical member snapshot.
- Row actual work has no separate per-edit actor/timestamp event history; the sheet retains submission actor/time and normal row update timestamps.
- The lifecycle has no recall, rejection, correction, or resubmission branch. Reviewed and archived sheets are locked.
- Worksheet dates are stored as date-only values and row times as local `HH:mm` strings. Company timezone semantics are not yet modeled because Phase 8 performs no recurrence or automatic scheduling.
- Authentication remains development-only, attachments use local storage, automated lint/test scripts remain placeholders, and mobile remains a scaffold.

## Correct roadmap order

1. `Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports`
2. `Phase 10 — Service Agreements / Recurring Object Duties`
3. `Phase 11 — Command Center Dashboard`
4. `Phase 12 — Smart Planning / AI / Automation`

Recurring agreements should later supply flexible worksheet planning inputs. They must not generate rigid Jobs far ahead or become a second Job system.

## Exact recommended prompt

```text
Read `/docs` first.

Use long-session. This is an IMPLEMENTATION session.

Implement:

`Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports`

Preserve the verified Phase 1–8B behavior, especially tenant isolation, role enforcement, the existing Job/report/cost lifecycles, worksheet assignment and field-locking rules, list/today visibility, internal-note redaction, immutable customer-report snapshots, and the distinction between a worksheet and a Job.

Build the smallest durable, explicit review-action foundation for reviewed worksheet rows. OWNER/OFFICE should be able to select one or more reviewed rows, choose a supported downstream action, preview the source and destination data, and deliberately create or link a governed follow-up record. Start with follow-up Job creation and add cost/report linkage only where the existing domain rules can be satisfied without inventing a parallel workflow. Preserve the worksheet and row as the source of truth, snapshot the relevant planned/actual text, store actor/time, action type/status, source and destination IDs, and enforce idempotency so retries or repeated clicks cannot create duplicates.

Every source worksheet/row and destination Job/cost/report must belong to the active company. Use safe not-found behavior for cross-tenant IDs. Only reviewed sheets are eligible. WORKER can read their worksheet result but cannot create, retry, cancel, or alter review actions. Downstream Jobs must be normal existing Jobs with the existing lifecycle; do not create a second Job system. Make partial failure and retry behavior explicit and auditable.

Add an additive Prisma migration, shared TypeScript contracts/schema helpers, strict payload validation, tenant-safe NestJS API/service behavior, a simple real office UI on reviewed worksheet detail, and representative smoke coverage for happy path, role denial, invalid status, cross-tenant sources/destinations, idempotent retry, duplicate prevention, and preserved Phase 1–8B behavior. Update all affected docs/checklist.

Do not implement recurring service agreements, generated future Jobs, automatic conversion during review, invoices/offers/payments, customer email sending, AI summaries, command board, drag-and-drop, QR/barcodes, mobile features, actual PDF generation/export, logistics/warehouse behavior, or item movement.

Run Prisma validate/generate and migration status, root `pnpm typecheck`, root `pnpm build`, full `pnpm smoke:api`, and `git diff --check`. Report exact files, models/migrations, endpoints, contracts, UI, permissions/lifecycle/idempotency, smoke results, validation, docs, and known limitations.
```
