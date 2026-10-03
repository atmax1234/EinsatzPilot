# EinsatzPilot — Project Brain / Agent Handoff

_Last reconciled with the checked-in repository: 2026-10-03._

This file is a consolidated handoff for coding agents working on **EinsatzPilot**. It describes the product vision, current implemented foundation, architecture direction, roadmap, known constraints, and founder decisions. Treat checked-in repository docs and code as the final source of truth when they differ from this file.

Repository reconciliation: Phase 8B is implemented. Phase 9 is in progress, and its first explicit reviewed-row action now creates one normal follow-up Job with immutable provenance, atomic persistence, strict tenant/role checks, and idempotent replay. Cost/report actions are not implemented. The next recommended slice is Phase 9B, not Communication Hub, Document Studio, AI, recurrence, or generated future Jobs.

---

## 1. Product North Star

**EinsatzPilot is a powerful all-in-one operations platform for everyday work across businesses and industries.**

It is not only a Hausmeister app, not only a facility-service app, not only a reporting tool, not only inventory, and not only field-service software.

Long-term, it should help many everyday-work businesses and teams plan, assign, document, review, prove, and improve work:

- small businesses
- service companies
- shop owners
- plumbers
- electricians
- technicians
- office teams
- field teams
- logistics teams
- corporate operational teams
- facility-service teams
- cleaning teams
- gardening teams
- Hausmeister teams

### Governing principle

> **Specific execution, broad architecture.**

Meaning:

- Build from concrete real-world workflows first.
- The first proof workflow is Hausmeister / cleaning / gardening / facility-service because the founder can test it in real life.
- Do not make the product vague “software for everyone” fluff.
- Do not hard-code the entire product into one niche industry.
- Keep core concepts modular and industry-adaptable.

---

## 2. What EinsatzPilot Actually Is

EinsatzPilot is becoming a **modular everyday-work command center**.

Core concepts:

- companies / tenants
- users / memberships / roles
- teams
- customers / clients / Verwaltungen
- locations / addresses / objects / object areas
- jobs / operational work records
- assignments / responsibility links
- daily worksheets / team protocols
- worker findings / reports
- photos / attachments / proof
- costs / labor / travel / materials / external services
- customer-facing report snapshots
- follow-ups
- later: service agreements, command dashboard, automation, AI, exports, invoices, mobile

The real operational loop:

```text
Customer / Verwaltung / business context
→ Object / address / work location
→ Office plans daily worksheet or job
→ Worker/team executes work
→ Worker records actual work, findings, notes, photos
→ Office reviews
→ Costs / follow-ups / reports / customer proof are created
→ Later: billing, communication, analytics, automation
```

---

## 3. Important Product Correction

Earlier roadmap thinking incorrectly leaned toward:

```text
Recurring service contract → generated jobs far ahead
```

That was corrected.

Real-world work is more fluid. The founder explained that in actual Hausmeister/facility workflows:

- the office plans daily/next-day worksheets,
- workers visit addresses and report what happened,
- issues arise through workers or emails,
- the office updates the next worksheet,
- tasks like “meet Tischler at 11:00 and hand over keys” may be added shortly before execution,
- rigid future-generated jobs would be too inflexible.

Correct model:

```text
Service responsibility / object context
→ daily worksheet/team protocol planning
→ actual worker execution
→ office review
→ follow-up jobs/costs/reports later
```

A worksheet is **not** the same as a Job.

Jobs remain structured operational work records. Worksheets are daily/team execution papers that may contain free text and optional links to jobs, objects, customers, etc.

---

## 4. Lütjens Protokoll Reference Workflow

The founder previously built a simpler app called **Lütjens Protokoll PWA** for his boss.

That app is the conceptual reference for daily worksheets, but its code should not be copied blindly.

Old workflow:

```text
draft → assigned → submitted
```

Old concepts:

```text
Protokoll
- worker
- date
- status
- slots[]

TimeSlot
- start
- end
- plannedTask
- actualTask
```

Old process:

1. Admin/office creates a daily protocol for a worker and date.
2. Office fills planned rows.
3. Office sends/assigns/locks it.
4. Worker sees the assigned daily protocol.
5. Worker fills actual work performed.
6. Worker submits it.
7. Office receives/reviews it.
8. Admin can export submitted protocol as PDF in the old app.

Typical time grid was 07:00–18:00 in 30-minute slots.

Example actual field content:

```text
Musterstr. 1 — Treppen + H.M.S.
Musterstr. 1 — Treppen + H.M.S. + Sperrmüll entsorgt 1x Sofa
Musterstr. 1 — Türgriff kaputt, Verwaltung informieren
Neue Schloss eingebaut, 2 Männer, 1 Std.
```

EinsatzPilot translation:

```text
Old Protokoll       → WorkdaySheet / DailyWorksheet / TeamProtocol
Old TimeSlot        → WorkdaySheetRow / WorksheetSlot
plannedTask         → plannedText
actualTask          → actualText
worker              → team and/or worker assignment
submitted PDF       → reviewed operational protocol, later print/export
```

What to reuse conceptually:

- daily worksheet idea
- planned vs actual rows
- office sends/locks
- worker submits
- office reviews

What not to copy blindly:

- old auth
- old storage
- old one-company assumptions
- old PDF implementation
- old source code structure
- old credentials/config/data

---

## 5. Current Technical Architecture

EinsatzPilot is a pnpm TypeScript monorepo.

Known structure:

```text
apps/api       NestJS API with Prisma and PostgreSQL
apps/web       Next.js office/admin web app
apps/mobile    reserved Expo scaffold only, not implemented
packages/types shared API/domain TypeScript contracts
packages/schemas enum lists and parsing helpers
packages/config minimal placeholder
packages/utils  minimal placeholder
```

Repository:

```text
GitHub: atmax1234/EinsatzPilot
Default branch: master
Local Windows path used by founder: D:\Projects\EinsatzPilot\EinsatzPilot
```

Development notes:

- Uses Prisma migrations and PostgreSQL.
- Smoke tests are important and must remain green.
- Auth is development-oriented, not production hardened.
- Mobile app is only a scaffold.
- Attachments currently depend on local storage.
- Generated PDF/export does not exist except browser print readiness for customer reports.

---

## 6. Roles and General Permission Philosophy

Roles:

```text
OWNER
OFFICE
WORKER
```

General rule:

- OWNER/OFFICE manage company operations.
- WORKER can read/act only where assigned or permitted.
- Tenant isolation is strict.
- Cross-company IDs should return safe not-found behavior.
- Do not weaken permissions for convenience.

---

## 7. Implemented Foundation by Phase

### Phase 0 — Protect and verify foundation

Status: Implemented baseline and continuously reverified.

Covers:

- tenant isolation
- roles
- teams
- jobs
- lifecycle
- activities
- reports
- attachments
- migrations
- build/typecheck/smoke

---

### Phase 1 — Customers, addresses, objects

Status: Implemented.

Implemented:

- Customer
- Address
- Object
- ObjectArea
- tenant-scoped CRUD/API/web basics
- customers and objects as operational memory

Purpose:

```text
Customer/Verwaltung and object/building memory for operational work.
```

---

### Phase 2 — Link jobs to customers/objects/addresses

Status: Implemented.

Implemented:

- optional Job relations:
  - customerId
  - addressId
  - objectId
  - objectAreaId
- relation options endpoint
- job create/edit selectors in web
- tenant-safe relation validation
- objectArea must belong to selected object
- relation changes create JobActivity
- old `customerName` and `location` strings preserved for compatibility

---

### Phase 3 — Items/materials/assets supporting foundation

Status: Implemented.

Implemented:

- ItemCategory
- Item
- kind/unit/tracking/status enums
- company-unique category names
- generated custom item IDs
- quantity vs serialized validation
- worker read, office/owner write

Important boundary:

```text
Items are supporting context, not an inventory/logistics pivot.
```

Not implemented:

- item movement
- warehouse behavior
- custody
- QR/barcodes
- bundles

---

### Phase 4 — Generic assignments

Status: Implemented.

Implemented:

- generic Assignment model
- typed source/target links between company entities
- assignment kinds/statuses/timing/notes
- entity existence and tenant validation
- duplicate active assignment prevention
- Job.teamId remains independent

Purpose:

```text
Control layer for responsibility and supporting-resource allocation.
```

---

### Phase 5 — Job Execution Reports / Worker Findings

Status: Implemented.

Implemented:

- structured JobReport types:
  - GENERAL
  - WORKER_FINDING
  - WORK_COMPLETION
  - INCIDENT_REPORT
  - FOLLOW_UP_REQUEST
- findings
- work performed
- outstanding work
- follow-up flags/notes
- review status
- reviewer attribution
- linked attachment summaries
- worker assignment access rules
- OWNER/OFFICE review decisions

Purpose:

```text
Worker visit produces structured, reviewable operational proof.
```

Not implemented:

- editing/resubmission after NEEDS_REVISION
- full review correction lifecycle

---

### Phase 6 — Job Cost Ledger

Status: Implemented.

Implemented:

- JobCostLine
- cost kinds:
  - material purchase/use
  - labor
  - travel
  - external service
  - fee
  - other
- units
- optional item reference
- backend-derived summaries
- one currency per job
- actor attribution
- job detail UI cost display/create/edit

Boundary:

```text
Cost lines are operational records, not invoices/payments/accounting.
```

Not implemented:

- invoices
- payments
- accounting export
- cost approval lifecycle
- delete/correction history
- tax calculation
- receipt file relation directly to cost line

---

### Phase 7 — Customer/Object Report Generator

Status: Implemented.

Implemented:

- CustomerReportSnapshot
- job-grounded report snapshots
- OWNER/OFFICE-only APIs
- source data endpoint
- customer report list/detail/create/update/status
- copied job/directory context
- selected approved job reports
- selected attachment metadata
- selected cost lines
- optional full job cost summary
- lifecycle:
  - DRAFT
  - READY_FOR_REVIEW
  - APPROVED
  - ARCHIVED
- approval attribution
- JobActivity entries
- tenant-safe source validation

Critical invariant:

```text
Customer reports render from persisted snapshot data, not live mutable job/customer/object/report/cost data.
```

Not implemented:

- PDF export
- customer portal
- email sending
- invoice/payment
- source reselection/refresh
- revision/supersession chain
- multi-job object-history aggregation

---

### Phase 7B — Customer Report Polish and PDF Readiness

Status: Implemented.

Implemented:

- better report list scanability
- clearer source selection
- selected vs full cost summary distinction
- customer-facing report detail layout
- internal notes separated from customer-visible content
- browser print button and A4 print CSS
- print hides navigation, controls, internal notes, diagnostics, original-file actions
- evidence prints as stored metadata references

Boundary:

```text
Browser print exists. Generated PDF/export does not exist.
```

---

### Phase 8 — Daily Worksheets / Team Protocols Foundation

Status: Implemented according to agent final report.

This was the major roadmap correction away from recurring generated jobs.

Implemented:

- WorkdaySheetStatus:
  - DRAFT
  - SENT
  - SUBMITTED
  - REVIEWED
  - ARCHIVED
- WorkdaySheet
- WorkdaySheetRow
- company ownership / tenant isolation
- date/title/status
- optional team assignment
- optional worker/user assignment
- creator/sender/submitter/reviewer/archiver relations
- row ordering
- planned text
- actual text
- optional row relations:
  - customer
  - address
  - object
  - object area
  - job
- database checks for text/time/order/audit consistency
- API module/service/controller/validation/mapper/status rules
- shared types and schemas
- web UI for list/create/detail
- navigation entry
- draft planning
- planned row add/edit/delete
- send action
- worker actual text forms
- worker submission
- office review notes/action
- reviewed-sheet archival
- smoke tests expanded to 196 checks, with 30 new Phase 8 assertions

Lifecycle:

```text
DRAFT → SENT → SUBMITTED → REVIEWED → ARCHIVED
```

Permissions:

- OWNER/OFFICE can read all company sheets.
- OWNER/OFFICE can manage drafts, send, review, and archive.
- WORKER sees only directly assigned sheets or sheets assigned to a current team.
- Drafts are invisible to workers.
- Workers receive no internalNotes.
- Workers may update only actualText, only while SENT.
- Every row requires actual text before submission.
- Reviewed and archived sheets are locked.
- Cross-tenant sheet and relation IDs return safe not-found responses.

Critical boundary:

```text
Worksheets remain distinct from Jobs.
No downstream records are generated automatically.
No recurring future Jobs are generated.
```

Current worksheet limitations after Phase 8B and the first Phase 9 slice:

- only the explicit reviewed-row follow-up Job action exists; no cost/report/customer-message action exists
- no row reordering, copying, templates, or bulk import
- today and exact filters exist; no calendar board, range/search filter, or saved view exists
- team visibility follows current team membership, not frozen recipient snapshot
- no per-edit execution event history
- no recall/rejection/correction/resubmission lifecycle
- no company timezone model
- dates are date-only and row times are local HH:mm
- browser print exists; generated worksheet PDF/export does not
- no recurring agreements
- no automation/email/invoices/command board/mobile

---

## 8. Phase 8B — Daily Worksheets Usability and Hardening

Status: Implemented and verified without a schema migration.

Safe Phase 8B goal:

```text
Improve daily worksheet usability and hardening without starting Phase 9 conversion actions.
```

Implemented outcomes:

- worksheet list filters by date/status/team/worker
- status badges
- assignment display
- row/completion counts
- better empty states
- worker today/assigned view
- clearer German labels
- object/job context display
- row completion state
- validation messages
- quick-add row (copy is not implemented)
- browser print style for worksheets
- submitted/reviewed display polish
- docs/smoke updates

Phase 8B did not implement:

- converting worksheet rows to jobs/costs/reports
- recurring agreements
- generated jobs
- invoices/payments/email
- AI
- command board
- drag/drop
- mobile
- generated PDF export

---

## 9. Current Roadmap Direction

Corrected roadmap:

```text
Phase 8  — Daily Worksheets / Team Protocols Foundation — implemented
Phase 8B — Daily Worksheets Usability and Hardening — implemented
Phase 9  — Worksheet Review → Follow-up Jobs / Costs / Reports — in progress; follow-up Job slice implemented
Phase 9B — Worksheet Review Actions: Cost and Report Links — next
Phase 10 — Service Agreements / Recurring Object Duties
Phase 11 — Command Center Dashboard
Phase 12 — Smart Planning / AI / Automation
```

Recurring service agreements are not deleted from the vision. They are moved later.

Correct future role of service agreements:

```text
Recurring agreements define regular object responsibilities and should feed worksheet planning later.
They should not immediately generate rigid future jobs far ahead.
```

---

## 10. Phase 9 — Controlled Review Actions

Phase 9 is intentionally split into small durable actions.

Proposed Phase 9:

```text
Worksheet Review → Follow-up Jobs / Costs / Reports
```

Goal:

After a worksheet is reviewed, office can deliberately convert selected reviewed rows into governed downstream records.

Examples:

- row says “Türgriff kaputt, Verwaltung informieren” → create follow-up Job or report
- row says “Sperrmüll entsorgt 1x Sofa” → create billable cost/service line later
- row says “Neue Schloss eingebaut, 2 Männer 1 Std.” → create job cost / invoice-ready support later

Important principles:

- No automatic conversion during review.
- Office must deliberately choose action.
- Preview source/destination data before creation.
- Store source row snapshot, actor/time/action type/status/destination IDs.
- Enforce idempotency / duplicate prevention.
- Source worksheet/row and destination record must belong to same company.
- WORKER cannot create/retry/cancel/alter review actions.
- Downstream Jobs must be normal Jobs with existing lifecycle.
- Do not create a second Job system.

Resolved for the follow-up Job slice:

- One row can create one action per action type; the implemented type is `CREATE_FOLLOW_UP_JOB`.
- Actions cannot be undone/canceled; the immutable provenance remains while the normal Job uses its own lifecycle.
- Actions are linked back to the row and exposed on worksheet detail.
- Planned and actual text, time, notes, worksheet context, and linked entity summaries are copied into a versioned source snapshot.
- Conversion is allowed only from `REVIEWED`; `ARCHIVED` cannot receive new actions.

Open for Phase 9B and later:

- What correction/supersession model should apply when reviewed work is later found wrong?
- How to handle cost creation if no job exists?
- Should costs require linking to an existing/new job?
- Which structured report types are safe and useful from a worksheet row?

---

## 11. What Is NOT Implemented Yet

Not implemented / must not be claimed as existing:

- production authentication
- token refresh/revocation hardening
- production object/file storage
- formal test suite beyond smoke scripts
- real lint/test enforcement
- mobile app workflows
- offline worker app
- generated PDF export
- customer portal
- customer email sending
- invoices
- offers
- payments
- accounting export
- service agreements
- recurring schedules
- generated future jobs
- command center dashboard
- drag-and-drop planning
- AI summaries/replies
- automation workflows
- QR/barcodes
- logistics/warehouse system
- item movement/custody
- worksheet cost/report/billable/customer-message actions
- generated worksheet PDF/export (browser print exists)

---

## 12. First MVP Definition

A realistic internal MVP should include:

1. Customers/objects/jobs foundation — already implemented.
2. Worker findings/reports/photos — already implemented.
3. Costs — already implemented.
4. Customer report snapshots/browser print — already implemented.
5. Daily worksheets/team protocols — implemented in Phase 8.
6. Worksheet usability polish — safe next step if not done.
7. Worksheet review follow-up actions — needs careful Phase 9.
8. Production-ish deployment/auth/storage pass.
9. UX cleanup/German labels/demo data.

Rough progress estimate from previous discussion:

```text
Technical foundation:        65–70% done
First internal MVP:          55–60% done before Phase 8, likely higher after Phase 8
Sellable MVP:                35–45% done before Phase 8
Big full product vision:     20–30% done
```

These are rough planning estimates, not guarantees.

---

## 13. Validation Culture

Every implementation agent should run baseline checks before large changes and final checks afterward.

Common validation:

```text
Prisma validate/generate
migration status
pnpm typecheck
pnpm build
pnpm smoke:api
git diff --check
```

Do not commit if smoke breaks unless explicitly approved and documented.

Smoke coverage is important because there is no full formal test suite yet.

---

## 14. Git / Windows Notes

User works on Windows.

Known local path:

```powershell
D:\Projects\EinsatzPilot\EinsatzPilot
```

There may be an outer folder:

```powershell
D:\Projects\EinsatzPilot
```

The Git repository is the inner folder.

Important commands:

```powershell
cd D:\Projects\EinsatzPilot\EinsatzPilot
git status
```

Line-ending/executable-bit notes:

- `.gitattributes` was added to normalize LF endings.
- `core.filemode false` may be used on Windows.
- Shell scripts may need executable bit tracked via Git index.

Commit/push pattern:

```powershell
git status
git add .
git diff --cached --check
git commit -m "Meaningful commit message"
git push origin master
```

---

## 15. Founder Preferences / Agent Behavior

The founder wants the agent to build, not just write docs.

Useful style:

- Be direct.
- Keep scope controlled.
- Do not overbuild.
- Do not invent fake features.
- Build real working slices.
- Always preserve tenant isolation and smoke tests.
- Update docs when product direction changes.
- Do not blindly follow prior roadmap if founder corrected it.

Key decisions:

- Assistant/strategy role = roadmap guardrail / scope police.
- Coding agent = builder.
- Founder = final decision maker.

Do not treat agent recommendations as authority. They are suggestions.

---

## 16. Hard Architecture Guardrails

Do not do these unless explicitly approved:

- Do not turn EinsatzPilot into a niche-only Hausmeister product.
- Do not turn it into vague generic software with no real workflow.
- Do not make worksheets a second full Job system.
- Do not generate recurring jobs far ahead as the main planning model.
- Do not silently create downstream jobs/costs/reports from worksheet rows.
- Do not implement invoices/payments/email/AI/mobile/command board as side effects of a different phase.
- Do not weaken tenant isolation.
- Do not show workers internal notes.
- Do not claim PDF export exists when only browser print exists.
- Do not claim mobile is implemented.
- Do not claim all industries are already supported.

---

## 17. Suggested Next Safe Prompt Direction

Phase 8B and the Phase 9 follow-up Job action are implemented. The next prompt is:

```text
Phase 9B — Worksheet Review Actions: Cost and Report Links
```

It must extend `WorksheetReviewAction`, require a tenant-owned normal target Job, reuse existing JobCostLine/JobReport rules, remain explicit and atomic, and avoid automatic conversion or free-floating downstream records.

---

## 18. Phase 9 Implementation Direction

Implemented first slice:

```text
Phase 9 — Worksheet Review Actions: Follow-up Jobs First
```

- from reviewed worksheet row → create follow-up Job
- explicit office action only
- source snapshot stored
- idempotency/duplicate prevention
- tenant-safe relation validation
- normal existing Job plus Job activity and action created atomically

Next, only where existing rules are clean:

- row → cost draft/line
- row → report/finding
- row → customer report source support

---

## 19. One-Sentence Description

**EinsatzPilot is a modular all-in-one operations platform for everyday work, starting with real facility/service workflows but designed to grow into a broader command center for planning, assigning, documenting, reviewing, proving, and improving work across many business types and industries.**
