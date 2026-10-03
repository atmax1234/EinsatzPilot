# Next Steps

## End-of-session checkpoint

Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports is implemented. Phase 9B completed the controlled cost/report slice without creating a parallel downstream system.

### Implemented Phase 9 behavior

- `WorksheetReviewAction` is the one company-owned, append-only provenance aggregate for explicit reviewed-row decisions.
- Implemented types are `CREATE_FOLLOW_UP_JOB`, `CREATE_JOB_COST_LINE`, and `CREATE_JOB_REPORT`; status is `COMPLETED`.
- OWNER/OFFICE can invoke each type at most once per row and only while its worksheet is `REVIEWED`. WORKER cannot invoke, retry, cancel, or alter actions.
- Follow-up creation produces a normal `PLANNED` Job. Cost/report actions require a deliberately selected tenant-owned normal Job, including a row-linked Job or the Phase 9 follow-up Job.
- Cost creation uses the existing `JobCostLine` model, optional Item context, amount/currency rules, and actor attribution. It does not change Item quantity.
- Report creation accepts structured report types only and creates a normal `JobReport` in `PENDING_REVIEW`, preserving the existing office review lifecycle.
- Every action stores source sheet/row identity, a schema-versioned immutable source snapshot, creating actor, completion time, action type/status, deterministic idempotency identity, request fingerprint, required destination Job identity, and the typed cost/report destination where applicable.
- The downstream record, readable Job activity, and review action commit in one transaction. Failure persists none of them.
- Identical retries return the existing action/downstream record with `replayed: true`; a changed retry for the same row/type returns `409`.
- Source, target Job, optional Item/Team, and all other relations are tenant-validated with safe not-found behavior.
- Assigned workers can read action results through their authorized worksheet detail, but office controls are not exposed to them.
- The reviewed-row UI previews source data, requires explicit destination fields, shows each completed action independently, and links to the normal destination Job.
- `ARCHIVED` remains terminal for new actions. No action is automatic.

## API and persistence boundary

The Phase 9B migrations extend `WorksheetReviewActionType` and add restrictive typed destination links to `JobCostLine` and `JobReport`, copied destination description/summary fields, indexes, foreign keys, and a hardened type-specific destination-shape check.

Added endpoints:

- `POST /api/workday-sheets/:sheetId/rows/:rowId/review-actions/job-cost-line`
- `POST /api/workday-sheets/:sheetId/rows/:rowId/review-actions/job-report`

The existing follow-up endpoint remains unchanged. Worksheet options now include tenant-owned Item summaries for the optional cost context. Shared contracts cover both nested action payloads, structured-report type restriction, responses, and typed action destinations.

## Checkpoint validation

On 2026-10-03, all fifteen migrations were applied/current on PostgreSQL 16. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The smoke result contains 233 passing checks. Existing Phase 1–9 behavior remains green; the Phase 9B checks prove reviewed-only eligibility, worker denial, required target Job, structured-report restriction, cross-tenant source/target Job/Item/Team denial, normal Job cost/report creation, immutable provenance, assigned-worker result reads, independent one-action-per-type behavior, same-input replay, changed-input conflict, readable Job activity, and archived lockout.

## Known current limitations

- Each row can create at most one action of each implemented type. There are no bulk or multi-row commands.
- Actions cannot be canceled, undone, corrected, or superseded. The normal destination Job, cost line, or report continues through its own existing domain rules while immutable provenance remains.
- There is no billable-item action, customer-message action, invoice/offer/payment behavior, or automatic downstream record creation.
- Cost lines still have no delete/correction event history or approval lifecycle. Reports still have no edit/resubmission path after `NEEDS_REVISION`.
- Rows cannot be reordered, copied, bulk imported, templated, or split after creation. Position remains stable insertion order.
- Exact worksheet filters have no ranges, free-text search, pagination, saved views, or calendar board.
- The today endpoint uses the API server's local calendar date; company timezone semantics are not modeled.
- Worksheet browser print exists, but no generated PDF/export artifact exists.
- Team authorization follows current team membership rather than a frozen recipient snapshot.
- There is no worksheet recall/rejection/correction/resubmission branch or per-edit execution event history.
- Authentication is development-only, attachments use local storage, lint/test scripts are placeholders, and mobile is a scaffold.
- The long-term Communication Hub, Document Studio, and AI-operated workflows are vision only. No mailbox, email sending, document editor, or AI action exists.

## Correct roadmap order

1. `Phase 10 — Service Agreements / Recurring Object Duties Foundation`
2. `Phase 11 — Command Center Dashboard`
3. `Phase 12 — Smart Planning / AI / Automation`

Service agreements should define reusable customer/object responsibilities and supply flexible worksheet planning close to execution time. They must not bulk-generate rigid future Jobs, silently create worksheets, or become a second Job system. Communication Hub, Document Studio, invoice/payment, generated PDF, and AI capabilities require separate later phases after stable manual workflows, permissions, audit, and confirmation rules exist.

## Exact recommended prompt

```text
Read `/docs` first, including `einsatzpilot_project_brain.md` and `EINSATZPILOT_LONG_TERM_PRODUCT_VISION.md`.

Use long-session. This is an IMPLEMENTATION session.

Implement:

`Phase 10 — Service Agreements / Recurring Object Duties Foundation`

Preserve the verified Phase 1–9B behavior, especially tenant isolation, role enforcement, worksheet assignment and locking, explicit review actions and idempotency, existing Job/report/cost lifecycles, immutable customer-report snapshots, and the distinction between worksheets, Jobs, and recurring responsibility definitions.

Build the smallest durable company-owned foundation for reusable customer/object service agreements and their recurring duties. Model explicit ownership, lifecycle, effective dates, cadence/timezone semantics, reusable planning text, optional customer/address/object/object-area context, and stable ordered duty rows. Use existing directory records and company context; do not create duplicate customer/object concepts. Decide and document how inactive/archived definitions remain readable.

OWNER/OFFICE may create, edit, activate/deactivate, and read company agreements/duties. WORKER access must be deliberately specified and backend-enforced; do not expose commercial/internal agreement fields merely for convenience. Every linked relation must be tenant-validated with safe not-found behavior, and object-area/object compatibility must remain strict.

Provide tenant-safe API contracts, strict runtime validation, real web administration, representative smoke coverage, and accurate docs/checklist updates. If a small manual planning handoff is included, it may only preview or explicitly copy selected due duty text into an editable DRAFT worksheet near execution time. Do not silently create worksheets or Jobs, do not schedule browser-only background work, and do not generate rigid future Jobs.

Do not add automatic recurrence execution, bulk future Job generation, invoices/offers/payments, customer messages, Communication Hub/email, Document Studio, AI, command board, drag-and-drop, QR, mobile, actual PDF generation/export, logistics/warehouse behavior, or item movement.

Before changing behavior, run the full pre-flight gate. Add only the additive schema changes actually required, then run Prisma validate/generate and migration status, root `pnpm typecheck`, root `pnpm build`, full `pnpm smoke:api`, and `git diff --check`. Stop if the baseline is broken.
```
