# Next Steps

## End-of-session checkpoint

Phase 9 is now in progress. The first controlled slice, worksheet review to a normal follow-up Job, is implemented on the Phase 8/8B worksheet foundation.

### Implemented Phase 9 behavior

- `WorksheetReviewAction` is a company-owned audit record with action type `CREATE_FOLLOW_UP_JOB` and status `COMPLETED`.
- OWNER/OFFICE can deliberately create a follow-up Job from one row only while its worksheet is `REVIEWED`. WORKER cannot invoke the action.
- The destination is an ordinary existing `Job` in `PLANNED`, not a worksheet-specific subtype or second lifecycle.
- The action stores source sheet/row identity, a schema-versioned immutable snapshot of the reviewed worksheet/row content and linked context, creating actor, completion time, deterministic idempotency identity, request fingerprint, and destination Job identity/reference/title.
- Source row relations and sheet team are copied by default. The office may deliberately select or clear destination relations; every supplied source/destination ID is validated inside the active tenant and object-area/object compatibility is preserved.
- Job, readable Job activity, and review action are created in one transaction. Failure persists none of them.
- An identical retry returns the existing action and Job with `replayed: true`. A changed retry for the same row/action type returns `409` and cannot duplicate the Job.
- Reviewed worksheet planning/execution remains locked. `ARCHIVED` is terminal and cannot receive a new action.
- Worksheet detail provides a real German office form per eligible reviewed row and shows the resulting linked Job afterward.
- No cost, report, billable item, customer message, recurring Job, PDF, invoice, email, or AI result is created by this slice.

## API and persistence boundary

The additive Phase 9 migration introduces:

- `WorksheetReviewActionType`
- `WorksheetReviewActionStatus`
- `WorksheetReviewAction`
- unique company/source-row/action-type and company/idempotency-key constraints
- restrictive source sheet/row, destination Job, and actor relations
- checks for nonblank idempotency/destination snapshot fields and a SHA-256 request fingerprint

The added endpoint is:

- `POST /api/workday-sheets/:sheetId/rows/:rowId/review-actions/follow-up-job`

Worksheet detail rows now include their review-action summaries. Shared contracts cover the action/source snapshot, follow-up Job input, and action/Job/replay response.

## Checkpoint validation

On 2026-10-03, all thirteen migrations were applied/current on PostgreSQL 16. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The smoke result contains 212 passing checks. Existing Phase 1–8B behavior remains green; the new checks prove reviewed-only eligibility, worker denial, cross-tenant source/destination denial, normal Job creation and copied relations, immutable provenance, same-input replay, changed-input conflict, one-action detail projection, Job activity, and archived lockout.

## Known current limitations

- The only implemented worksheet review action is one follow-up Job per row. There are no cost-line, report/finding, billable-work, or customer-communication actions yet.
- Actions cannot be canceled, undone, corrected, or superseded. The destination Job may be managed through its normal lifecycle; the provenance action remains immutable.
- A source row cannot create a second follow-up Job action. Future distinct action types may coexist, but bulk selection and multi-row action commands do not exist.
- Rows cannot be reordered, copied, bulk imported, templated, or split after creation. Position is stable insertion order.
- Exact list filters have no ranges, free-text search, pagination, saved views, or calendar board.
- The today endpoint uses the API server's local calendar date; company timezone semantics are not modeled.
- Worksheet browser print exists, but no generated PDF/export artifact exists.
- Team authorization follows current team membership rather than a frozen recipient snapshot.
- There is no worksheet recall/rejection/correction/resubmission branch or per-edit execution event history.
- Authentication is development-only, attachments use local storage, lint/test scripts are placeholders, and mobile is a scaffold.
- The long-term Communication Hub, Document Studio, and AI-operated workflows are vision only. No mailbox, email sending, document editor, or AI action exists.

## Correct roadmap order

1. `Phase 9B — Worksheet Review Actions: Cost and Report Links`
2. `Phase 10 — Service Agreements / Recurring Object Duties`
3. `Phase 11 — Command Center Dashboard`
4. `Phase 12 — Smart Planning / AI / Automation`

Recurring agreements should later supply flexible worksheet planning inputs. They must not generate rigid Jobs far ahead or become a second Job system. Communication Hub, Document Studio, and AI capabilities require separate later phases after stable manual workflows, permissions, audit, and confirmation rules exist.

## Exact recommended prompt

```text
Read `/docs` first, including `einsatzpilot_project_brain.md` and `EINSATZPILOT_LONG_TERM_PRODUCT_VISION.md`.

Use long-session. This is an IMPLEMENTATION session.

Implement:

`Phase 9B — Worksheet Review Actions: Cost and Report Links`

Preserve the verified Phase 1–9 follow-up-Job behavior, especially tenant isolation, role enforcement, worksheet assignment and locking, immutable customer-report snapshots, existing Job/report/cost lifecycles, and the distinction between a worksheet and a Job.

Extend the existing `WorksheetReviewAction` aggregate; do not create another conversion system and do not rebuild the follow-up Job action. Add only explicit OWNER/OFFICE actions from `REVIEWED` worksheet rows into the existing Job-grounded cost and structured report domains. Require a tenant-owned target Job for every cost/report action: use an existing linked Job or a deliberately selected normal Job, including the Phase 9 follow-up Job where appropriate. Do not create free-floating costs or reports.

For each supported action, preview source and destination data, reuse existing cost/report payload validation and permissions, store a schema-versioned source snapshot plus actor/time/type/status/source/destination identity, and enforce one action per source row/action type with deterministic idempotent replay and changed-request conflict. Create the downstream record and review action atomically. WORKER may read an assigned worksheet result but cannot invoke, retry, cancel, or alter review actions. Cross-tenant source, target Job, item, team, and other relation IDs must return safe not-found behavior.

Keep the UI small and real on reviewed worksheet detail. Show already-created actions and link to the normal destination Job. Do not add automatic conversion, bulk actions, undo/cancel, invoices/offers/payments, customer messages, Communication Hub/email, Document Studio, AI, recurring agreements, generated future Jobs, command board, drag-and-drop, QR, mobile, actual PDF generation/export, logistics/warehouse behavior, or item movement.

Add only the additive schema changes actually required, shared contracts, strict validation, tenant-safe API/service behavior, representative smoke coverage, and accurate docs/checklist updates. Run Prisma validate/generate and migration status if schema changes, root `pnpm typecheck`, root `pnpm build`, full `pnpm smoke:api`, and `git diff --check`. Stop if the pre-flight baseline is broken.
```
