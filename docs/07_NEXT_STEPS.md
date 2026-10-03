# Recommended Next Steps

## Current checkpoint

Phase 10 — Service Agreements / Recurring Object Duties Foundation is implemented. It adds reusable office-managed responsibility definitions without turning recurrence into generated work.

### Implemented Phase 10 behavior

- `ServiceAgreement` is company-owned and records title/description, inclusive effective dates, validated IANA timezone, optional customer/address/object/object-area context, internal notes, and lifecycle audit.
- Lifecycle is `DRAFT -> ACTIVE -> INACTIVE -> ACTIVE`; `DRAFT` or `INACTIVE` may be archived, and `ARCHIVED` is terminal.
- `RecurringObjectDuty` retains a stable ID and position, reusable planned text, optional notes/local time range, active state, first-due local date, and every-N `DAY`, `WEEK`, `MONTH`, or `YEAR` cadence.
- OWNER/OFFICE alone can list, read, create, edit, activate/deactivate/archive, and maintain duties. WORKER receives no service-agreement API or navigation access.
- Definition and duty writes are allowed only in `DRAFT` or `INACTIVE`; activation requires at least one active duty.
- Customer/address/object/object-area links are tenant-scoped. Object areas require and must match the selected object, and linked directory context must remain compatible.
- The list supports exact status, customer, and object filters. The real web UI provides creation, filters, detail editing, lifecycle controls, duty maintenance, and clear locked/audit state.
- No agreement operation creates a Job or worksheet.

### Schema and API checkpoint

The additive migration `20261003190000_service_agreements_foundation` creates the agreement and duty tables, lifecycle/cadence enums, indexes, foreign keys, and database checks for date ranges, relation shape, audit consistency, positions, text, cadence intervals, and local time ranges.

Implemented endpoints:

- `GET /api/service-agreements`
- `GET /api/service-agreements/options`
- `POST /api/service-agreements`
- `GET /api/service-agreements/:agreementId`
- `PATCH /api/service-agreements/:agreementId`
- `PATCH /api/service-agreements/:agreementId/status`
- `POST /api/service-agreements/:agreementId/duties`
- `PATCH /api/service-agreements/:agreementId/duties/:dutyId`

### Verification checkpoint

On 2026-10-03, all sixteen migrations were applied/current on PostgreSQL 16. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The smoke flow contains 263 passing checks and preserves Phase 1–9B while proving Phase 10 validation, relation compatibility, filters, role denial, cross-tenant safety, duty order/cadence/time/effective-range rules, lifecycle/locking, active-duty activation eligibility, archival, and absence of Job/worksheet generation.

## Honest remaining limitations

- Service agreements store recurrence definitions but do not evaluate or materialize due occurrences.
- Holiday, blackout, skip, replacement, and one-off exception semantics are not modeled.
- There is no completion history or worker-facing agreement view.
- There is no manual agreement-to-DRAFT-worksheet copy/handoff yet.
- There is no scheduler, notification, automatic worksheet creation, or generated future Job behavior.
- Monthly/yearly rollover semantics are documented for a later evaluator but are not executed in Phase 10.
- Worksheet review still has no billable/customer-message action, bulk action, undo/cancel, or correction/supersession flow.
- Browser print exists, but generated PDF/export, customer delivery, Communication Hub/email, Document Studio, invoices/payments, AI, drag-and-drop, QR, and mobile workflows do not.
- Authentication remains development-only; storage is local; lint/test scripts remain placeholders beyond the live smoke flow.

## Roadmap order

1. `Phase 11 — Command Center Dashboard`
2. `Phase 12 — Smart Planning / AI / Automation`

Agreement due evaluation, exception rules, and deliberate worksheet handoff require a separately scoped later phase. Do not smuggle them into the dashboard. Communication Hub and Document Studio remain long-term product direction, not the current implementation target.

## Exact next recommended prompt

```text
Read /docs first.

This is an IMPLEMENTATION session.

Implement:

Phase 11 — Command Center Dashboard

Preserve the verified Phase 1–10 behavior, especially tenant isolation, role enforcement, worksheet assignment and locking, explicit review-action idempotency, existing Job/report/cost lifecycles, immutable customer-report snapshots, office-only service-agreement access, and the distinction between agreements, worksheets, and Jobs.

Build the smallest durable server-backed company command center. First define the exact operational questions and meaning of every metric. Prefer a compact overview of actionable state already supported by trusted data: today's worksheets and completion, Jobs by operational status, reports awaiting office review, submitted worksheets awaiting review, active teams/assignments where meaningful, recent follow-up activity, cost totals only where their period/currency meaning is explicit, and active agreement definitions without pretending that due occurrences have been calculated.

Use tenant-safe API/service queries and shared contracts. Apply role-aware visibility and never derive authoritative company metrics only in the browser. Add a simple real web dashboard with German business wording, useful empty/error states, direct links to existing workflows, and no fake/demo values.

Do not add drag-and-drop, scheduling commands, agreement occurrence calculation, exception calendars, worksheet or Job generation, background schedulers, notifications, Phase 12 AI/automation, Communication Hub/email, Document Studio, invoices/payments, generated PDF export, QR/barcodes, logistics/item movement, or mobile features.

Expand smoke coverage only for new dashboard contracts, tenant isolation, role visibility, and metric correctness. Update the affected docs and checklist. Run the full pre-flight and final validation gates: migration status, Prisma validate/generate if schema is touched, root pnpm typecheck, root pnpm build, full pnpm smoke:api, and git diff --check. Stop if the baseline is broken.
```
