# EinsatzPilot — Foundation Checklist

Use this to track when the system is actually ready to move out of foundation work.
Be strict. “Kinda works” = not done.

Assessment snapshot: checked items below were verified on 2026-04-18 against the live local setup where applicable.
Verification now includes real PostgreSQL migrations, the API smoke flow, and web pages rendering live updated data from the database.

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
* [ ] structure won’t require redesign later
* [x] ready for future uploads

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
