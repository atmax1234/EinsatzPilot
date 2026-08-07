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

The directory, backwards-compatible Job relation, item/category, generic Assignment, Job Execution Reports / Worker Findings, Job Cost Ledger, Phase 7 Customer/Object Report Generator foundation, and Phase 7B Customer Report Polish and PDF Readiness are implemented. Phase 7B adds a customer-readable snapshot presentation, explicit internal-only separation, clearer source and cost-scope selection, and an A4-oriented browser-print stylesheet. The presentation consumes stored `CustomerReportSnapshot` fields only; original attachment files remain a separately authorized local-storage dependency and are not embedded in the print output.

The next recommended session is exactly `Phase 8 — Recurring Service Contracts Foundation`, following `07_NEXT_STEPS.md`. Preserve the verified Phase 1–7B behavior, especially customer-report snapshot immutability and the customer-visible/internal presentation boundary. Browser print is not a generated PDF or export artifact.

Do not skip into invoice issuance, payments, customer email sending, AI summaries, item movement/logistics, command-board work, drag-and-drop, QR codes, or mobile work. Invoice, email, or actual PDF behavior requires later explicit approval. Items support job documentation and costs; they are not the center of an inventory or logistics product.
