# Recommended Next Steps

## Current checkpoint

Phase 12 — Worker Daily Experience is implemented as a responsive web workflow. It uses the existing worksheet, Job, report, and attachment domains and required no Prisma schema change or migration. Native mobile remains deferred.

### Implemented Phase 12 behavior

- WORKER navigation is reduced to `Mein Arbeitstag`, `Meine Aufträge`, `Meine Tageszettel`, and `Übersicht`.
- `/workday-sheets/today` keeps planned rows, linked context, actual-work entry, guarded submission, upcoming sent sheets, and open assigned Jobs in one touch-friendly flow.
- `/jobs` and `/jobs/[jobId]` render a worker-specific assigned-Job list/detail instead of office administration controls.
- WORKER Job list/detail scope includes direct Job team membership, active user/team-to-Job assignment, and Jobs linked from an assigned sent-or-later worksheet.
- Actual work remains `WorkdaySheetRow.actualText`. A finding is saved as a normal structured `JobReport`; its optional photo/video/file is saved as a normal report-linked `JobAttachment`.
- A sent worksheet's linked Job grants report/attachment contribution while the sheet is `SENT`. After submission, worksheet-only contribution is locked while read access remains.
- Job cost reads, report lists, attachment lists, metadata/file reads, and the photo feed apply the same assignment-aware worker read scope. Unrelated worker reads return safe not-found responses.
- A row without a linked Job gets an honest UI explanation and no evidence action. Phase 12 does not create worksheet-row attachments or a second finding system.

### Schema and contract checkpoint

Phase 12 adds no model or migration. `JobReportListResponse.createdReport` is an optional response field so the worker form can attach an uploaded file to the exact report just created without a fragile client-side search. A shared API-side `JobAccessService` centralizes worker Job read/contribution predicates.

### Verification checkpoint

On 2026-10-04, all sixteen migrations were current on local PostgreSQL 18. Prisma validate/generate, root `pnpm typecheck`, root `pnpm build`, the full `pnpm smoke:api` flow, and `git diff --check` passed. The repeat-safe smoke flow contains 278 passing checks: all 272 Phase 1–11 checks plus six Phase 12 checks for assigned Job scope, worksheet-linked Job reads, existing report/attachment reuse, unrelated-worker artifact isolation, and the post-submit contribution lock.

## Honest remaining limitations

- Phase 12 is responsive web only. There is no native app, offline support, background sync, upload retry/resume, push notification, or device authentication.
- A worksheet row without a linked/assigned Job cannot create an object/address-only finding or upload evidence. That requires a deliberate later domain decision; evidence was not attached directly to worksheet rows.
- The combined finding/evidence action creates the report first and then uploads the file. If storage upload fails, the report remains saved and the UI reports the partial outcome. There is no distributed transaction across database and filesystem storage.
- The worker view does not add Job status mutation, cost editing, office review, customer reports, or automatic follow-up creation.
- Today still uses the API server's local date because company timezone is not modeled.
- Office worksheet review still needs clearer handled/unhandled decision state and history presentation; that is Phase 13.
- Authentication is development-only, attachment storage is local, and production deployment/backups/observability remain Phase 15 work.
- No generated PDF/export, invoice/payment, Communication Hub/email, Document Studio, AI/automation, agreement occurrence engine, generated work, drag-and-drop, QR, or logistics/item movement exists.

## Roadmap order

1. `Phase 13 — Office Review Completion`: polish worksheet review, follow-up decisions, review history, and handled/unhandled clarity.
2. `Phase 14 — End-to-End MVP Proof`: demonstrate a realistic seeded office planning → worker execution → review → follow-up flow.
3. `Phase 15 — Production Hardening`: production authentication, storage, backups, deployment, permission audit, error handling/observability, and consistent German UI.

Native mobile and new feature families such as Communication Hub, Document Studio, invoices/payments, generated PDF, or AI/automation remain deferred beyond this sequence. Service agreements still do not calculate occurrences or generate worksheets/Jobs.

## Exact next recommended prompt

```text
Read /docs first.

This is an IMPLEMENTATION session.

Implement:

Phase 13 — Office Review Completion

Preserve the verified Phase 1–12 behavior, especially tenant isolation, role enforcement, worker Job/worksheet visibility, worksheet locking, the distinction between actual work and Job-grounded findings/evidence, explicit WorksheetReviewAction idempotency, normal Job/report/cost lifecycles, immutable customer-report snapshots, office-only service agreements, and the read-only command-center metric meanings.

Build the smallest durable office review completion slice. Improve the submitted/reviewed worksheet experience so OWNER/OFFICE can immediately understand what was planned, what was performed, which linked findings/evidence need attention, and which rows have or have not received an explicit follow-up decision. Reuse existing WorksheetReviewAction, JobReport, JobAttachment, JobCostLine, and Job records. Prefer a clear row-level handled/unhandled projection and readable review/action history derived on the server from existing trusted records.

Define “handled” precisely before coding. Do not treat worksheet review alone as proof that every row was handled, and do not automatically create downstream records. Preserve one explicit idempotent action per existing action type and the current source snapshots/destination links. Add only the minimum shared contracts/API response fields or read endpoint needed for authoritative review state; avoid a schema change unless a real invariant cannot be represented from current data.

Add a simple German office UI with clear pending/handled states, finding/evidence context, action outcomes, locked-state messaging, useful empty/error states, and direct links to existing Jobs/reports/costs. Do not expose internal notes to workers or loosen any worker permission.

Do not implement automatic conversion, billable/customer-message actions, invoices/offers/payments, customer email, Communication Hub, Document Studio, agreement occurrence calculation, generated worksheets/Jobs, schedulers, notifications, AI/automation, generated PDF export, drag-and-drop, QR/barcodes, logistics/item movement, native mobile, or offline behavior.

Expand smoke coverage only for new review-state semantics, tenant isolation, office-only behavior, and correct preservation of existing idempotency/locking. Update affected docs and the checklist. Run migration status, Prisma validate/generate if schema is touched, root pnpm typecheck, root pnpm build, full pnpm smoke:api, and git diff --check. Stop if the baseline is broken.
```
