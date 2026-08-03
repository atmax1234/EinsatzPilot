# Agent Start Here

## What EinsatzPilot is

EinsatzPilot is a modular company operations command center for managing customers, objects, jobs, teams, reports, costs, responsibilities, and customer-facing proof.

It began as a smaller, Lütjens-oriented protocol and job application. The existing implementation remains valuable: it provides a tenant-aware foundation for companies, users, memberships, teams, jobs, activity, reports, attachments, and an office web app. The direction is broader now, but agents must extend this foundation deliberately rather than discard it.

The platform is industry-neutral. Gardening, Hausmeister, and cleaning businesses are valid use cases, not hard-coded product boundaries.

## Read and inspect first

Read the documents in `/docs` in numeric order, followed by the root `README.md` and `FOUNDATION_CHECKLIST.md`. Then inspect the relevant implementation. At minimum, check the Prisma schema and migrations, shared types and schemas, related API module, and every consuming web or mobile surface. Documentation is orientation, not a substitute for reading code.

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

The directory, backwards-compatible Job relation, item/category, generic Assignment, Job Execution Reports / Worker Findings, Job Cost Ledger, and Phase 7 Customer/Object Report Generator foundations are implemented and migrated. Phase 7 adds OWNER/OFFICE-only, job-grounded customer report snapshots with explicit approved-report, attachment, and cost selection; copied directory/job context; an explicit review lifecycle; real API-backed web administration; and expanded PostgreSQL smoke coverage.

The next recommended session is exactly `Phase 7B — Customer Report Polish and PDF Readiness`, following `07_NEXT_STEPS.md`. Improve the existing report presentation and source-selection experience and prepare a deliberate print/PDF boundary without claiming that PDF generation or export already exists. Preserve the stable snapshot contract and current permissions while inspecting the implementation before changing it.

Do not skip into invoice issuance, payments, customer email sending, AI summaries, recurring contracts, item movement/logistics, command-board work, drag-and-drop, QR codes, or mobile work. Invoice or email behavior requires later explicit approval. Items support job documentation and costs; they are not the center of an inventory or logistics product.
