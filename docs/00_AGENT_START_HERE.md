# Agent Start Here

## What EinsatzPilot is

EinsatzPilot is a modular all-in-one operations platform for planning, assigning, documenting, reviewing, proving, and improving everyday work across business types and industries.

It began as a smaller, Lütjens-oriented protocol and job application. The existing implementation remains valuable: it provides a tenant-aware foundation for companies, users, memberships, teams, jobs, activity, reports, attachments, and an office web app. The direction is broader now, but agents must extend this foundation deliberately rather than discard it.

Hausmeister, cleaning, gardening, and facility-service workflows are the first concrete proof and product workbench, not the final market boundary. The long-term architecture must also remain adaptable to small businesses, trades, technical and office teams, logistics teams, and larger operational teams. The governing product rule is: **specific execution, broad architecture**.

## Read and inspect first

Read the numbered documents in `/docs` in order, then `einsatzpilot_project_brain.md`, `EINSATZPILOT_LONG_TERM_PRODUCT_VISION.md`, the root `README.md`, and `FOUNDATION_CHECKLIST.md`. The project-brain file preserves context but may contain an older checkpoint; the dated current-state and next-step documents plus checked-in code resolve implementation status. The long-term vision constrains architecture but does not authorize future features by itself. Then inspect the relevant implementation. At minimum, check the Prisma schema and migrations, shared types and schemas, related API module, and every consuming web or mobile surface. Documentation is orientation, not a substitute for reading code.

## Working approach

- Establish current behavior before proposing a change. Search for existing models, types, routes, services, permissions, mappers, UI calls, and smoke coverage.
- Reuse and extend existing code. Do not create a parallel architecture because current naming or structure is imperfect. Rewrite only when a specific constraint makes extension unsafe, and document why.
- Work from domain logic outward: invariants, data model, migration, shared contracts, API validation and permissions, API behavior, then UI.
- Treat tenant isolation and role enforcement as non-negotiable. Client-supplied company IDs are never authority.
- Clearly distinguish implemented behavior from planned behavior. Never let a route, card, button, or mock dataset imply that an absent capability exists.
- Follow the dependency map and roadmap. Later phases must not bypass unfinished prerequisites.
- Verify changes in proportion to risk. Schema and authorization changes need stronger proof than text or styling changes.

## Documentation is part of completion

After every meaningful change, update the affected `/docs` files, the root README when setup or product status changes, and the foundation checklist when a foundation claim changes.

A meaningful change includes a new or changed model, migration, relationship, permission, endpoint, lifecycle rule, shared contract, workflow, deployment assumption, or roadmap decision. Documentation that presents planned behavior as implemented is a defect.

## Current instruction

The directory, backwards-compatible Job relation, item/category, generic Assignment, Job Execution Reports / Worker Findings, Job Cost Ledger, Phase 7 Customer/Object Report Generator foundation, Phase 7B Customer Report Polish and PDF Readiness, Phase 8 Daily Worksheets / Team Protocols Foundation, and Phase 8B usability/hardening are implemented.

Phase 9 and Phase 9B are implemented. From one reviewed worksheet row, OWNER/OFFICE can explicitly create one normal follow-up Job, one Job-grounded cost line, and one structured Job report. All three use the same `WorksheetReviewAction` aggregate with a schema-versioned source snapshot, actor/time, action type/status, deterministic idempotency identity, request fingerprint, required destination Job identity, and the typed downstream identity where applicable. Each downstream record, readable Job activity, and action commit atomically; identical retries return the original result, changed retries conflict, and WORKER or cross-tenant requests are denied. Nothing is created automatically, and no second Job, cost, or report system exists.

Phase 10 is implemented. Company-owned service agreements now define explicit effective dates, IANA timezone, lifecycle, optional tenant-safe directory context, and stable ordered recurring-duty rows with reusable planning text and every-N day/week/month/year cadence anchors. OWNER/OFFICE alone can administer them. They remain responsibility definitions: no due-occurrence engine, exception calendar, worksheet handoff, scheduler, or automatic Job/worksheet generation exists.

The next recommended session is exactly `Phase 11 — Command Center Dashboard`, following `07_NEXT_STEPS.md`. It must use trusted server-backed operational data and must not invent fake metrics or begin Phase 12 automation.

Daily worksheets/team protocols are execution papers, not a second Job system. Service agreements describe reusable recurring responsibility and may later supply deliberate worksheet planning near execution time. Do not silently generate worksheets or Jobs from them. Do not expand Phase 11 into scheduling automation, invoice issuance, payments, the future Communication Hub/Document Studio, customer email sending, AI summaries, item movement, drag-and-drop, QR codes, or mobile work. Invoice, email, AI, or actual PDF behavior requires a later dedicated phase and specification. Items support job documentation and costs; they are not the product center or a reason to turn the current foundation into a warehouse system.
