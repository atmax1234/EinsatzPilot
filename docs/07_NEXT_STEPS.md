# Next Steps

## End-of-session checkpoint

Phase 5 — Job Execution Reports / Worker Findings and Phase 6 — Job Cost Ledger are complete in the verified local setup.

### Phase 5 proven behavior

- Existing simple reports remain compatible as `GENERAL`/`SUBMITTED`.
- Structured findings capture work performed, work still needed, follow-up state/notes, actor, team context, and linked evidence.
- WORKER creation requires direct-team membership or an active user/team assignment to the job.
- OWNER/OFFICE can create reports for company jobs and make explicit terminal review decisions.
- Review writes create readable `JobActivity`; worker review and cross-tenant report access are blocked.
- Job detail and the Reports page use real API data.

### Phase 6 proven behavior

- All ten migrations are applied to PostgreSQL.
- Job cost lines cover material purchase/use, labor, travel, external service, fees, and other costs.
- Cost lines are company/job scoped; optional Item references are tenant-validated.
- Material, labor, and travel totals derive in the backend from quantity times unit cost. External, fee, and other lines may use validated manual totals.
- One currency is enforced per job, defaulting to EUR; OWNER/OFFICE can write and WORKER can read.
- Job detail uses real API data for cost creation, editing, line review, and category/grand summaries.
- The expanded smoke flow preserves Phase 1-5 assertions and proves Phase 6 calculations, updates, summaries, item validation, roles, wrong-job access, and tenant isolation.

## Checkpoint validation

On 2026-07-19, Prisma reported all ten migrations applied and current. `pnpm typecheck`, `pnpm build`, the full `pnpm smoke:api` Phase 1-6 flow, and `git diff --check` passed for this handoff. The smoke command creates additional development records in the local database by design.

## Next session: planning first

The next recommended session is:

`Phase 7 Planning — Customer/Object Report Generator`

Do not start implementation merely because Phase 5 and Phase 6 prerequisites are complete. Phase 7 is a serious customer-facing product surface. The first session should inspect the current job, directory, report/review, attachment, activity, and cost implementations and produce a coherent snapshot/data design before any Prisma model, migration, API, or UI code is added.

The eventual goal is clean customer/object-facing report data that can later support PDFs, client reports, invoice preparation, and object history. Those later outputs must consume a stable governed report foundation; they must not define it backwards from a visual template.

## Planning questions that must be resolved

- What is the aggregate called, and does one job have one report snapshot, multiple revisions, or multiple report purposes?
- Which company, job, customer, address, object, and object-area identities own or contextualize it?
- Which `JobReport` types and review states are eligible, and is every inclusion explicit?
- Which customer/object/job values are copied into the snapshot versus resolved live?
- How are findings, work performed, outstanding work, follow-up notes, and office review represented?
- How are evidence IDs, captions, ordering, and later file-storage changes preserved reproducibly?
- Are individual cost lines, grouped summaries, tax metadata, and currency copied or referenced?
- What are the draft, review, finalized, superseded, and correction/version rules?
- Which actions may OWNER, OFFICE, and WORKER perform?
- What is the minimum clean reviewable UI before PDF/export presentation work?
- What activity/audit entries and smoke assertions prove the lifecycle and tenant boundaries?
- How will legacy `Job.customerName` and `Job.location` remain compatible?

## Known current limitations

- There is no customer/object report snapshot model, API, or UI.
- Report review decisions are terminal; worker editing/resubmission and review correction are absent.
- Attachments use local filesystem storage without production retention or object storage.
- Cost lines are editable current state and have no delete/correction history or approval workflow.
- Tax rate is metadata only; net/gross tax calculations are absent.
- Cost summaries support one currency per job; currency conversion is absent.
- Receipt references are text and cost lines do not directly own receipt attachments.
- Authentication is development-only, and lint/test scripts remain placeholders.

## Explicitly deferred

Do not jump directly into fancy PDFs, invoice or offer issuance, payment handling, customer email sending, AI summaries, recurring contracts, item movement, warehouse/logistics behavior, command board, drag-and-drop, QR/barcodes, or mobile features.

## Exact recommended prompt

```text
Read `/docs` first.

`Phase 7 Planning — Customer/Object Report Generator`

This is a planning and domain-design session only. Do not implement Prisma models, migrations, API endpoints, or web product behavior yet.

First verify the Phase 1-6 baseline remains clean: all migrations applied, `pnpm typecheck`, `pnpm build`, `pnpm smoke:api`, and `git diff --check` pass. Stop if existing coverage breaks.

Inspect the current Job, Customer, Address, Object, ObjectArea, JobReport/review, JobAttachment, JobActivity, and JobCostLine implementations. Design a tenant-safe, job-grounded customer/object report snapshot foundation that can assemble explicitly selected reviewed findings, work performed, outstanding/follow-up notes, evidence references, directory/job context, and governed job cost summaries into clean reproducible customer-facing report data.

Produce concrete decisions for aggregate ownership and cardinality, source eligibility and explicit inclusion, copied snapshots versus live references, evidence and cost boundaries, lifecycle/review/version/correction behavior, role permissions, activity/audit behavior, minimum reviewable UI, compatibility, migration strategy, and future smoke coverage. Record unresolved tradeoffs rather than hiding them.

Update the relevant planning docs with the agreed design and provide a separate exact implementation prompt for approval. Do not start implementation unless explicitly requested in a later session.

Do not add PDF styling/generation, invoice or offer issuance, payments, email sending, AI summaries, recurring contracts, item movement, warehouse/logistics behavior, command-board drag-and-drop, QR/barcodes, or mobile features.
```
