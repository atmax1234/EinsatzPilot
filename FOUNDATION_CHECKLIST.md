# EinsatzPilot — Foundation Checklist

Use this to track when the system is actually ready to move out of foundation work.
Be strict. “Kinda works” = not done.

Assessment snapshot: checked items below were verified through 2026-10-04 against the live local setup where applicable.
Verification now includes real PostgreSQL migrations, the API smoke flow, and web pages rendering live updated data from the database.

Directory and Job relation snapshot: Customer, Address, Object, and ObjectArea foundation plus backwards-compatible Job relations were migrated and verified through the expanded live PostgreSQL smoke flow on 2026-07-19.

Item foundation snapshot: tenant-safe ItemCategory and Item identity, validation, role rules, real-API administration, migration, and expanded smoke coverage were verified on 2026-07-19.

Assignment foundation snapshot: typed tenant-safe source/target links, lifecycle, validation, role rules, real-API administration, migration, and expanded smoke coverage were verified on 2026-07-19.

Job execution report snapshot: backwards-compatible structured findings, follow-up data, worker assignment access, linked evidence, explicit OWNER/OFFICE review, migration, UI, and expanded smoke coverage were verified on 2026-07-19.

Job cost ledger snapshot: tenant-safe job cost lines, strict amount rules, optional item references, actor attribution, backend-derived summaries, real-API job-detail UI, migration, and expanded smoke coverage were verified on 2026-07-19.

Customer report foundation snapshot: OWNER/OFFICE-only, job-grounded stable snapshots; explicit approved-report, attachment, and cost selection; copied directory/job context; lifecycle/activity rules; real-API web review; additive migration; and expanded smoke coverage were verified on 2026-08-03. Phase 7B customer-readable presentation, internal-only separation, source-scope UX, and browser print were added and verified through code inspection, typecheck, production build, and the unchanged 163-assertion smoke flow on 2026-08-07. PDF generation/export and delivery do not exist.

Daily worksheet snapshot: company-owned dated sheets and ordered rows, free text plus optional tenant-safe directory/Job links, direct/team assignment, role-specific planning/actual-work boundaries, the forward-only send/submit/review/archive lifecycle, real office/worker UI, additive migration, and expanded 196-check smoke coverage were verified on 2026-08-31. No worksheet review-to-follow-up conversion or recurring agreement exists yet.

Daily worksheet usability/hardening snapshot: exact role-safe filters, a dedicated today query and worker flow, completion/context/review/lock clarity, browser-print styling, and status-scoped transactional row-write protection were added without a schema change and verified with the expanded 200-check smoke flow on 2026-10-02. At that checkpoint, no Phase 9 conversion action existed; worksheet PDF export, recurring agreements, and generated-future-Job behavior remain absent.

Worksheet review-action snapshot: Phase 9 and Phase 9B add one explicit OWNER/OFFICE `CREATE_FOLLOW_UP_JOB`, `CREATE_JOB_COST_LINE`, and `CREATE_JOB_REPORT` action per reviewed row through one provenance aggregate. All retain a schema-versioned immutable source snapshot, actor/time/status, required destination Job, typed downstream identity where applicable, atomic downstream/activity/action creation, tenant-safe source/target/Item/Team handling, deterministic replay, and changed-request conflict. The complete slice was verified with the expanded 233-check smoke flow on 2026-10-03. Billable/customer-message actions, automatic conversion, generated future Jobs, PDF export, email, and AI remain absent.

Service-agreement snapshot: Phase 10 adds company-owned, OWNER/OFFICE-only service agreements and stable ordered recurring duties with lifecycle/audit, inclusive effective dates, IANA timezone, every-N cadence anchors, reusable planning text, optional tenant-safe directory context, real API/web administration, and an additive migration. The complete slice was verified with the expanded 263-check smoke flow on 2026-10-03. Due-occurrence evaluation, exceptions, worksheet handoff, background scheduling, worker access, and automatic Job/worksheet generation remain absent.

Command-center snapshot: Phase 11 adds a tenant-safe, server-derived `GET /api/dashboard` read model and real German web command center without a schema change. OWNER/OFFICE receive company-wide worksheet/Job/review/workforce/agreement/cost/follow-up metrics with explicit definitions; WORKER receives only assigned worksheet and Job scope and no office aggregate. The complete slice was verified with the expanded 272-check smoke flow on 2026-10-04. No dashboard writes, trends, alerts, occurrence calculation, scheduler, generated work, drag-and-drop, AI, email, PDF export, billing, logistics, or mobile behavior was introduced.

Worker-daily snapshot: Phase 12 adds a responsive WORKER web shell, focused today execution/submission, assignment-scoped Job list/detail, and separate actual-work versus Job-grounded finding/evidence actions without a schema change. Sent worksheet links extend Job contribution only while `SENT`; sent-or-later links remain readable. Reports and optional evidence reuse normal `JobReport`/`JobAttachment` records, and worksheet rows still own no files. The complete slice was verified with the expanded repeat-safe 278-check smoke flow on 2026-10-04. Native/offline mobile, automatic follow-up, object-only findings, AI, email, PDF export, billing, generated work, and logistics remain absent.

---

## 1. Repo / Structure

* [x] monorepo structure is stable
* [x] apps (web, mobile, api) clearly separated
* [x] packages (types, utils, etc.) clearly scoped
* [x] docs match implementation
* [ ] project boots without confusion

---

## 2. Database / Prisma

* [x] PostgreSQL runs reliably
* [x] DATABASE_URL works correctly
* [x] Prisma client initializes cleanly
* [x] schema applies without errors
* [x] seed/dev workspace works
* [x] no random DB startup issues

---

## 3. Auth / Tenant Context

* [x] login works
* [x] session/token works
* [x] tenant context always resolved
* [x] all endpoints are tenant-scoped
* [x] no cross-company data leaks

---

## 4. Roles

* [x] OWNER defined
* [x] OFFICE defined
* [x] WORKER defined
* [x] permissions enforced in backend
* [x] no “temporary allow everything” logic

---

## 5. Core Data Model

* [x] Company/User/Membership stable
* [x] Team/TeamMember stable
* [x] Job model makes sense
* [x] JobActivity purpose is clear
* [x] relationships are clean and consistent

---

## 6. Job Lifecycle

* [x] statuses finalized (with or without DRAFT)
* [x] meanings are clear
* [x] transitions are defined
* [x] invalid transitions blocked
* [x] basic edit rules exist

---

## 7. Job Write Flows

* [x] create job
* [x] edit job
* [x] assign team
* [x] change status
* [x] validation works
* [x] permission checks enforced
* [x] tenant scoping enforced

---

## 8. Team Write Flows

* [x] create team
* [x] edit team
* [x] add members
* [x] remove members
* [x] membership validation works
* [x] permission checks enforced

---

## 9. Activity Logging

* [x] job creation logs activity
* [x] status changes log activity
* [x] assignment changes log activity
* [x] customer/address/object/object-area relation changes log activity
* [x] activity contains useful info
* [x] history is readable in UI

---

## 10. Frontend Sync

* [x] dashboard uses real data
* [x] jobs list uses real data
* [x] job detail uses real data
* [x] teams page uses real data
* [x] UI updates after writes correctly
* [x] no fake frontend state for core flows

---

## 11. Reports / Files / Photos (Foundation)

* [x] schema direction exists
* [x] ownership model defined
* [x] structure won’t require redesign for the Phase 5 workflow
* [x] ready for future uploads
* [x] structured worker findings exist
* [x] work performed / still needed / follow-up fields exist
* [x] OWNER/OFFICE report review lifecycle exists
* [x] customer-facing report data and review UI exist (no PDF/export artifact)
* [x] job cost ledger exists

---

## 12. API Discipline

* [x] clean controller structure
* [x] DTOs exist for writes
* [x] validation in place
* [x] consistent naming
* [x] no messy mixed concerns

---

## 13. Errors / Debugging

* [x] useful error messages
* [x] permission vs validation errors clear
* [x] missing data handled cleanly
* [ ] logs help debugging

---

## 14. Mobile Readiness

* [ ] backend supports mobile use cases
* [ ] no web-only assumptions
* [ ] job execution logic reusable
* [x] attachments model ready for mobile

---

## 15. Final Proof (MOST IMPORTANT)

You can do ALL of this without hacks:

* [x] login
* [x] create team
* [x] create job
* [x] assign team
* [x] change status
* [x] edit job
* [x] see activity updates
* [x] see changes reflected in UI

---

## 16. Directory Foundation

* [x] Customer/Address/Object/ObjectArea schema and migration exist
* [x] shared types and runtime payload validation exist
* [x] OWNER/OFFICE write permissions are enforced in backend services
* [x] WORKER read policy is explicit
* [x] company-scoped relation lookups reject foreign tenant IDs in code
* [x] customer/address/object/object-area admin pages use real API data
* [x] Prisma validation/generation, directory typechecks, and production builds pass
* [x] directory migration applied against live PostgreSQL
* [x] expanded directory smoke flow passes, including role and cross-tenant checks
* [x] jobs link optionally to structured customer/address/object/object-area data
* [x] legacy `Job.customerName` and `Job.location` creation remains supported
* [x] object-area links require and match the selected object
* [x] Job relation options and forms use company-scoped real API data
* [x] Job relation create/update, activity, mismatch, and cross-tenant smoke checks pass

---

## 17. Item Foundation

* [x] ItemCategory and Item schema plus additive migration exist
* [x] categories and items are scoped by company in every API read/write
* [x] OWNER/OFFICE write and WORKER read permissions are enforced in services
* [x] category names and item custom IDs are unique per company
* [x] omitted custom IDs are generated in a safe stable format
* [x] optional category relations reject foreign-company IDs with safe not-found errors
* [x] quantity items accept validated nonnegative decimal quantities
* [x] serialized items require quantity 1 in service and database rules
* [x] shared contracts and enum/schema helpers cover item/category payloads
* [x] `/items` uses real API data for minimal create/list/update administration
* [x] expanded smoke covers category/item CRUD, ID rules, tracking rules, roles, and tenant isolation
* [x] Phase 1/2 smoke assertions remain intact and passing
* [x] movement, custody, bundles, QR, and inventory dashboards remain out of scope
* [x] items/materials are documented as supporting job and cost context, not the product center

---

## 18. Generic Assignment Foundation

* [x] Assignment schema, enums, and additive migration exist
* [x] assignment source/target types are closed enums rather than arbitrary strings
* [x] source and target IDs are validated against the active company in services
* [x] USER assignment endpoints require an active company membership
* [x] OWNER/OFFICE write and WORKER read permissions are enforced
* [x] source, target, and kind remain immutable after creation
* [x] optional timing rejects end values that do not follow start values
* [x] duplicate exact active source/target/kind links are rejected in service and database rules
* [x] assignment lifecycle transitions are explicit and terminal states remain terminal
* [x] `Job.teamId` remains independent and passes post-assignment smoke verification
* [x] `/assignments` uses grouped real API entity options and no fake state
* [x] expanded smoke covers team-to-job, item-to-job, item-to-object, roles, validation, and tenant isolation
* [x] Phase 1/2/3 smoke assertions remain intact and passing
* [x] movement, custody, command board, drag/drop, QR, billing, AI, automation, and mobile remain out of scope

---

## 19. Job Execution Reports / Worker Findings

* [x] existing simple reports remain valid as GENERAL/SUBMITTED
* [x] structured report types and finding/work/follow-up fields are migrated
* [x] report and review payload validation is strict and readable
* [x] WORKER submission requires direct-team or active user/team assignment access
* [x] OWNER/OFFICE can submit for any job in the active company
* [x] OWNER/OFFICE review decisions are explicit and service-enforced
* [x] WORKER review attempts are blocked
* [x] reports and review writes are tenant-scoped with safe not-found behavior
* [x] report-linked attachments remain supported and visible
* [x] report creation and review produce readable JobActivity entries
* [x] job detail and Reports pages use real API data for structured reports
* [x] expanded smoke preserves Phase 1/2/3/4 coverage and proves Phase 5 roles/tenancy
* [x] Phase 5 report behavior remains intact after the separate Phase 6 cost ledger addition

---

## 20. Job Cost Ledger

* [x] JobCostLine schema, closed kind/unit enums, and additive migration exist
* [x] every line is scoped to company and job in API reads/writes
* [x] optional item references reject foreign-company IDs with safe not-found errors
* [x] quantity is positive and monetary/tax/currency inputs have strict bounds
* [x] material, labor, and travel totals derive from quantity times unit cost in backend logic
* [x] external, fee, and other lines support validated manual totals
* [x] one currency is enforced per job and defaults to EUR
* [x] creator and updater users are retained
* [x] OWNER/OFFICE write and WORKER read permissions are service-enforced
* [x] job detail uses real API data for cost list/create/edit and backend-derived summaries
* [x] expanded smoke preserves Phase 1/2/3/4/5 coverage and proves Phase 6 roles/tenancy
* [x] invoices, payments, PDFs, item movement, warehouse behavior, command board, AI, and mobile remain out of scope

---

## 21. Phase 7 Customer/Object Report Generator Foundation

* [x] Phase 5 reviewed findings, work, follow-up, and evidence prerequisites are implemented and smoke-proven
* [x] Phase 6 job costs and backend-derived summary prerequisites are implemented and smoke-proven
* [x] CustomerReportSnapshot schema, closed type/status enums, and additive migration exist
* [x] every created snapshot is company-owned and grounded in a tenant-validated Job
* [x] copied Job/directory context remains stable and preserves free-text customer/location fallbacks
* [x] source data and cost breakdown use explicit schema version and capture timestamp
* [x] only explicitly selected APPROVED JobReports are copied, with stable requested ordering
* [x] selected attachment IDs and metadata/captions/order are copied without pretending file bytes are embedded
* [x] selected cost lines and backend-derived selected summary are copied with item/tax/vendor/receipt metadata
* [x] optional full Job cost summary is distinct from selected detailed lines
* [x] source selection and copied context are immutable after creation
* [x] draft-authored fields and period validation are service-enforced
* [x] DRAFT/READY_FOR_REVIEW/APPROVED/ARCHIVED transitions and terminal archival are service-enforced
* [x] approval actor/time and report creation/status JobActivity are retained
* [x] OWNER/OFFICE-only read/write/source permissions and WORKER denial are backend-enforced
* [x] customer-report list, source, detail, create, draft-update, and status endpoints exist
* [x] `/customer-reports` list/create/detail flows and Job-detail integration use real API data
* [x] expanded smoke passes all 163 assertions: 121 preserved Phase 1-6 predicates plus 42 Phase 7 source, snapshot, lifecycle, role, validation, and tenant-isolation predicates
* [x] Phase 7 behavior remains intact after the separate Phase 8 worksheet addition
* [x] service agreements, actual PDF export, invoices, payments, email sending, AI, movement/logistics mechanics, command board, drag/drop, QR, and mobile remain unimplemented

## 22. Phase 7B Customer Report Polish and PDF Readiness

* [x] customer-visible output and office-only internal fields are separated in presentation
* [x] report layout and information hierarchy are polished for customer reading
* [x] print-specific view or styling is implemented and verified through code inspection and production build
* [x] reusable snapshot-only presentation boundary is defined without a template engine
* [x] source-selection eligibility, ordering, and cost-scope UX are polished
* [x] missing attachment/file-retention behavior is represented honestly in office context
* [x] PDF export is described as preparation only until a real artifact/export flow exists
* [x] invoice and email behavior require separate later approval

---

## 23. Phase 8 Daily Worksheets / Team Protocols Foundation

* [x] company-owned dated `WorkdaySheet` and ordered `WorkdaySheetRow` models exist
* [x] office can create and edit a `DRAFT` for a team and/or direct WORKER
* [x] planned rows support free text and optional customer/address/object/object-area/Job context
* [x] every linked entity is tenant-validated and object areas require/match their object
* [x] `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED` transitions and audit actor/timestamps are enforced
* [x] office planning is locked after send and reviewed/archived content is locked
* [x] assigned workers see only authorized non-draft sheets and do not receive internal office notes
* [x] workers can update only `actualText` on assigned `SENT` sheets and must complete all rows before submission
* [x] OWNER/OFFICE can review submitted sheets and archive reviewed sheets
* [x] `/workday-sheets` list/create/detail flows use the real API for office and worker roles
* [x] expanded smoke passes all 196 checks, including roles, lifecycle, locking, optional links, and cross-tenant behavior
* [x] worksheet review does not silently create follow-up Jobs, costs, reports, billable items, or customer messages
* [x] recurring service agreements do not generate rigid future Jobs or form a second Job system
* [x] next recommended phase is Phase 9 — Worksheet Review → Follow-up Jobs / Costs / Reports

---

## 24. Phase 8B Daily Worksheets Usability and Hardening

* [x] worksheet list supports exact date and status filtering for visible sheets
* [x] office list additionally supports team and worker filtering
* [x] status, direct/team assignment, row counts, completion counts, progress, actions, and empty states are clear
* [x] `GET /api/workday-sheets/today` preserves tenant and direct/team assignment visibility
* [x] `/workday-sheets/today` supports assigned-worker actual-text entry and guarded submission
* [x] time ranges and linked customer/address/object/object-area/Job context are readable per row
* [x] submitted/reviewed/archived state, actor/time attribution, review notes, and locks are explicit
* [x] worksheet detail has A4-oriented browser-print styling that hides controls and internal notes
* [x] draft/actual row writes are status-scoped transactionally against send/submit races
* [x] expanded smoke passes all 200 checks, preserving Phase 1–8 and proving filters/today/count/redaction/isolation behavior
* [x] no schema migration or lifecycle state was added
* [x] Phase 8B introduced no Phase 9 action, PDF artifact/export, recurring agreement, generated Job, or automatic downstream record

---

## 25. Phase 9 Worksheet Review → Follow-up Jobs / Costs / Reports

* [x] reviewed worksheet rows retain an explicit, auditable `WorksheetReviewAction` record
* [x] action stores a versioned immutable source snapshot, actor/time/type/status, fingerprint, and destination identity
* [x] action retries are idempotent and changed retries cannot duplicate downstream records
* [x] OWNER/OFFICE deliberately chooses conversion; WORKER cannot trigger it
* [x] only `REVIEWED` rows are eligible and `ARCHIVED` remains terminal for new actions
* [x] source and destination records are tenant-validated with safe not-found behavior
* [x] follow-up Jobs use the existing Job model and lifecycle and start `PLANNED`
* [x] Job, Job activity, and review action are committed atomically
* [x] real worksheet detail UI previews destination fields and links the completed action to the normal Job
* [x] expanded smoke passes all 233 checks while preserving Phase 1–8B and the follow-up Job action
* [x] Phase 9B cost-line and structured report/finding actions are implemented
* [x] every cost/report action requires a deliberately selected tenant-owned normal Job
* [x] cost actions reuse existing amount/currency/Item rules and create normal JobCostLine records
* [x] report actions accept structured types only and create normal PENDING_REVIEW JobReport records
* [x] cost/report downstream record, readable Job activity, and action commit atomically
* [x] assigned workers can read authorized action results but cannot invoke review actions
* [x] one action per row/type, deterministic replay, changed-input conflict, and archived lockout are smoke-proven
* [x] no silent review automation, invoice/email/AI behavior, recurring generation, or second Job system is introduced

---

## 26. Phase 10 Service Agreements / Recurring Object Duties Foundation

* [x] `ServiceAgreement` and `RecurringObjectDuty` are company-owned persisted models
* [x] lifecycle is explicit: `DRAFT -> ACTIVE -> INACTIVE -> ACTIVE`, with terminal archival from draft/inactive
* [x] lifecycle actors/timestamps and database consistency checks are present
* [x] effective dates are inclusive and validated; timezone must be a valid IANA identifier
* [x] optional customer/address/object/object-area context is tenant-safe and relation-compatible
* [x] duties retain stable identity/order, reusable planned text, optional notes/times, active state, first-due date, and every-N day/week/month/year cadence
* [x] agreement/duty edits require `DRAFT` or `INACTIVE`; activation requires at least one active duty
* [x] OWNER/OFFICE alone can read/write; WORKER receives no agreement API or navigation access
* [x] list/detail/options/create/update/status/duty endpoints use strict runtime validation and safe not-found behavior
* [x] real office web UI supports filtering, creation, definition editing, lifecycle controls, duty maintenance, context, audit, and locked states
* [x] additive migration is applied and all sixteen migrations are current
* [x] expanded smoke passes all 263 checks while preserving Phase 1–9B
* [x] smoke proves cross-tenant denial, lifecycle/locking, active-duty activation eligibility, and zero automatic Job/worksheet creation
* [x] no occurrence engine, exception calendar, completion history, worksheet handoff, scheduler, generated future Job, invoice/email/AI, or second Job system is introduced
* [x] Phase 11 — Command Center Dashboard is implemented as the next separate phase

---

## 27. Phase 11 Command Center Dashboard

* [x] `GET /api/dashboard` derives authoritative metrics in the API from the active company context
* [x] shared contracts define audience, data scope, Job/worksheet status counts, completion, office aggregates, per-currency costs, and recent follow-up items
* [x] OWNER/OFFICE company scope and WORKER assigned worksheet/Job scope are explicit
* [x] WORKER responses structurally omit review, workforce, agreement, cost, and follow-up office aggregates
* [x] today's worksheet totals, status counts, rows, and completed rows use fixed documented semantics
* [x] Job totals and actionable Jobs use stored lifecycle status and direct workflow links
* [x] review demand counts `SUBMITTED`/`PENDING_REVIEW` Job reports and `SUBMITTED` worksheets
* [x] active team, assignment, and agreement metrics use stored active status without due inference
* [x] current-month cost totals use explicit UTC boundaries and remain separate per currency
* [x] recent activity uses completed explicit worksheet review actions and links source/destination records
* [x] `/dashboard` provides real German office/worker views with empty/error states and metric definitions
* [x] no schema change or migration was needed; all sixteen migrations remain current
* [x] expanded smoke passes all 272 checks while preserving Phase 1–10
* [x] smoke proves contract shape, metric correctness, worker visibility, unrelated-worker isolation, cross-tenant isolation, cost semantics, and recent follow-ups
* [x] no dashboard write command, fake data, occurrence engine, scheduling/generation, notification, drag-and-drop, AI, email, PDF export, billing, logistics, or mobile behavior is introduced
* [x] next roadmap sequence was corrected to Worker Daily Experience, Office Review Completion, End-to-End MVP Proof, and Production Hardening

---

## 28. Phase 12 Worker Daily Experience

* [x] no Prisma model or migration was added; the existing worksheet, Job, report, and attachment domains remain authoritative
* [x] WORKER navigation is reduced to the daily flow, assigned Jobs, assigned worksheets, and role-scoped overview
* [x] today view supports planned-row context, touch-friendly actual-work entry, guarded submission, upcoming sheets, and open assigned Jobs
* [x] WORKER `/jobs` and `/jobs/[jobId]` use API-authoritative assignment scope and omit office-only edit/review/cost/customer-report controls
* [x] direct Job team membership and active user/team assignments remain valid worker access paths
* [x] an assigned sent-or-later worksheet row grants read access to its linked Job
* [x] worksheet-only finding/evidence contribution is allowed only while the assigned sheet is `SENT`
* [x] actual work remains `WorkdaySheetRow.actualText`; findings use normal structured `JobReport` records
* [x] optional photo/video/file evidence uses normal report-linked `JobAttachment` records
* [x] Job cost, report/attachment list, metadata/file, and photo-library reads apply the same worker Job visibility rule
* [x] unrelated worker artifact reads return safe not-found responses and denied uploads remain forbidden
* [x] rows without a linked Job show the limitation and do not create worksheet-row attachments or free-floating evidence
* [x] `JobReportListResponse.createdReport` supplies the exact created identity for the follow-up evidence upload
* [x] responsive CSS uses larger controls and compact cards without claiming native or offline mobile behavior
* [x] no automatic conversion, new lifecycle, second Job/report system, scheduler, notification, AI, email, PDF export, billing, or logistics behavior was introduced
* [x] all sixteen migrations remain current; Prisma validate/generate, typecheck, build, 278-check smoke, and diff check pass
* [x] next roadmap phase is Phase 13 — Office Review Completion

---

## Scoring

* Done = solid and repeatable
* Partial = works but messy
* Not Done = missing

### Interpretation:

* 0–40% → early foundation
* 40–70% → incomplete
* 70–85% → close
* 85–100% → foundation DONE

---

## Definition of Done

Foundation is done when:

**the system can safely create and change real operational data**

Not when:

* UI looks good
* routes exist
* demos worked once
* repo looks clean

---
