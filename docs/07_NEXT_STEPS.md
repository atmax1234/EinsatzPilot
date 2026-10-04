# Recommended Next Steps

## Current checkpoint

Phase 11 — Command Center Dashboard is implemented. It adds a tenant-safe, server-backed operational read model and a real role-aware web command center without adding persistence, scheduling, or write commands.

### Implemented Phase 11 behavior

- `GET /api/dashboard` derives metrics inside the API from the active company context; the browser does not authoritatively reconstruct company totals.
- OWNER/OFFICE receive company-wide today worksheet counts/completion, Job counts by stored status, actionable planned/in-progress Jobs, reports awaiting office review, submitted worksheets awaiting review, active teams/assignments, active service-agreement definitions, current UTC-month cost totals separated by currency, and the six newest completed worksheet review actions.
- WORKER receives only today's sent-or-later worksheets assigned directly or through current team membership and Jobs reached through direct Job team membership or active user/team-to-Job assignment. The complete office aggregate is omitted.
- `/dashboard` presents the result with German business wording, real empty/error states, direct links into worksheets, Jobs, reports, teams, assignments, agreements, and follow-up destinations, plus visible metric definitions.
- No dashboard action mutates operational data.

### Exact metric meanings

- **Today:** API server local calendar date, matching the existing worksheet-today behavior.
- **Completed worksheet row:** row has stored nonempty `actualText`.
- **Open Job:** stored status is `PLANNED` or `IN_PROGRESS`; all four Job statuses remain separately counted.
- **Report awaiting review:** `JobReport.reviewStatus` is `SUBMITTED` or `PENDING_REVIEW`.
- **Worksheet awaiting review:** `WorkdaySheet.status` is `SUBMITTED`.
- **Active team/assignment/agreement:** stored status is active; timing windows and recurring occurrences are not inferred.
- **Current-month costs:** stored `JobCostLine.totalCost` with `costDate` in the current UTC calendar month, grouped and returned separately by currency.
- **Recent follow-up activity:** six newest completed explicit `WorksheetReviewAction` records. It is not an alert or notification system.
- **Active agreements:** definition count only. No due occurrence has been calculated.

### Schema and API checkpoint

Phase 11 required no Prisma schema change or migration. Shared TypeScript contracts now cover dashboard audience/scope, Job and worksheet status totals, row completion, office review/workforce/agreement metrics, currency-separated cost totals, and recent follow-up items.

Implemented endpoint:

- `GET /api/dashboard`

### Verification checkpoint

On 2026-10-04, all sixteen migrations were applied/current on local PostgreSQL 18. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The smoke flow contains 272 passing checks: all 263 Phase 1–10 checks remain green, plus nine command-center checks for the response contract, Job and today metrics, office metrics, cost period/currency semantics, recent follow-ups, worker scope, unrelated-worker isolation, and cross-tenant isolation.

## Honest remaining limitations

- The command center is a request-time snapshot. It has no historical trends, cache, background refresh, saved layouts, alerts, notifications, or write commands.
- “Today” uses the API server's local calendar date because company timezone is not modeled.
- Dashboard cost totals are operational sums, not billing, accounting, tax, profitability, invoice, or payment data.
- Service agreements still do not evaluate/materialize due occurrences, model holiday/blackout/skip/one-off exceptions, or hand duties into an editable DRAFT worksheet.
- There is no scheduler, automatic worksheet creation, or generated future Job behavior.
- Worksheet review has no billable/customer-message action, bulk action, undo/cancel, or correction/supersession flow.
- Browser print exists, but generated PDF/export, customer delivery, Communication Hub/email, Document Studio, invoices/payments, AI, drag-and-drop, QR, and mobile workflows do not.
- Authentication remains development-only; storage is local; lint/test scripts remain placeholders beyond the live smoke flow.

## Roadmap order

1. `Phase 12 — Smart Planning / AI / Automation`, delivered in bounded slices.
2. Start Phase 12 with deterministic, read-only planning insights and explicit human decision boundaries.
3. Add any external/generative AI only in a later Phase 12 slice after permissions, provenance, privacy, evaluation, cost, and failure behavior are specified and proven.

Agreement occurrence evaluation, exceptions, and worksheet handoff remain separately scoped work and must not be smuggled into planning insights. Communication Hub and Document Studio remain long-term product direction, not implicitly authorized Phase 12 scope.

## Exact next recommended prompt

```text
Read /docs first.

This is an IMPLEMENTATION session.

Implement the first bounded slice of:

Phase 12 — Smart Planning / Automation Foundation

Preserve the verified Phase 1–11 behavior, especially tenant isolation, role enforcement, worker assignment visibility, worksheet and Job lifecycles, explicit review-action idempotency, immutable customer-report snapshots, office-only service agreements, and the read-only metric semantics of the command center.

Build a deterministic, explainable, read-only planning-insights foundation for OWNER/OFFICE. Before coding, define the exact operational questions and severity/meaning of every insight. Use only trusted existing server data. A useful minimum is: planned/in-progress Jobs without a direct team or active user/team assignment; overlapping scheduled Jobs for the same directly assigned team; planned/in-progress Jobs whose scheduled end/start is already in the past; and sent worksheets for a past date that have not been submitted. Return stable source IDs and reasons so every insight links to the existing Job or worksheet workflow.

Use a tenant-safe API/service query and shared contracts. Do not compute authoritative insights only in the browser. Keep WORKER access denied for the first slice unless a separately justified worker-safe contract is designed. Add a small German office UI, preferably linked from the command center, with useful empty/error states and no fake data. Insights are advisory only: do not add accept/apply buttons or mutate records.

Do not add an AI provider, prompts, embeddings, autonomous actions, automatic Job/worksheet creation, agreement occurrence calculation, exception calendars, background schedulers, notifications, drag-and-drop, Communication Hub/email, Document Studio, invoices/payments, generated PDF export, QR/barcodes, logistics/item movement, or mobile features.

Expand smoke coverage only for the new insight definitions, tenant isolation, office-only access, and deterministic correctness. Update affected docs and the checklist. Run migration status, Prisma validate/generate only if schema is touched, root pnpm typecheck, root pnpm build, full pnpm smoke:api, and git diff --check. Stop if the baseline is broken.
```
