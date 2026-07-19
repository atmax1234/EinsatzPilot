# EinsatzPilot — Foundation Checklist

Use this to track when the system is actually ready to move out of foundation work.
Be strict. “Kinda works” = not done.

Assessment snapshot: checked items below were verified on 2026-04-18 against the live local setup where applicable.
Verification now includes real PostgreSQL migrations, the API smoke flow, and web pages rendering live updated data from the database.

Directory and Job relation snapshot: Customer, Address, Object, and ObjectArea foundation plus backwards-compatible Job relations were migrated and verified through the expanded live PostgreSQL smoke flow on 2026-07-19.

Item foundation snapshot: tenant-safe ItemCategory and Item identity, validation, role rules, real-API administration, migration, and expanded smoke coverage were verified on 2026-07-19.

Assignment foundation snapshot: typed tenant-safe source/target links, lifecycle, validation, role rules, real-API administration, migration, and expanded smoke coverage were verified on 2026-07-19.

Job execution report snapshot: backwards-compatible structured findings, follow-up data, worker assignment access, linked evidence, explicit OWNER/OFFICE review, migration, UI, and expanded smoke coverage were verified on 2026-07-19.

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
* [ ] customer-facing report output exists
* [ ] job cost ledger exists

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
* [x] costs, PDFs, recurrence, movement, command board, AI, and mobile remain out of scope

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
