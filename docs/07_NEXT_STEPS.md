# Next Steps

## Completed gate

Domain Foundation Phase 4 is complete in the verified local setup.

- All eight migrations are applied to PostgreSQL.
- Tenant-safe directory, Job relation, item/category, and generic Assignment foundations are implemented.
- Existing Job lifecycle, `Job.teamId`, reports, attachments, roles, and cross-tenant protections remain covered by the expanded smoke flow.

## Corrected product direction

EinsatzPilot is a company operations command center, not an inventory or logistics application.

- Jobs are the star.
- Objects are the memory.
- Reports are the proof.
- Costs are the money layer.
- Assignments are the control layer.
- Items/materials are supporting context for job costs, purchases, tools, quantities, and evidence.

The next implementation should improve what workers document and what the office can review. Item movement is optional later infrastructure and is not a prerequisite.

## Recommended next implementation slice

Begin `Phase 5 — Job Execution Reports / Worker Findings` after confirming the Phase 4 migration, root typecheck, API/web builds, expanded smoke flow, and diff checks are clean.

Build additively on current `JobReport` and `JobAttachment` behavior. The goal is structured worker output for incidents, inspections, service visits, repairs, and follow-up work, followed by office review.

## Required scope

- Define additive fields or related records for findings, work performed, work still needed, and follow-up required.
- Preserve current report creation/listing and attachment/photo behavior.
- Retain worker/author attribution and company/job ownership.
- Add an explicit office review state and clear transition rules.
- Support tenant-safe worker submission and OWNER/OFFICE review.
- Add minimal worker/admin UI backed only by real API data.
- Expand smoke coverage without weakening Phase 1/2/3/4 assertions.
- Update current-state, domain, dependency, roadmap, next-step, and checklist docs.

## Guiding workflow

For an incident at `Musterstr. 1`, a worker should be able to document the issue found, upload photos, record work performed, state what remains, and request follow-up. The office should review that submission before it becomes customer-facing proof or feeds the later job cost ledger.

## Still out of scope for Phase 5

- Job cost ledger and invoice totals.
- Customer PDF/report generation.
- Recurring service contract generation.
- Command center dashboard or drag-and-drop.
- Item movement, stock, warehouse, delivery, or custody workflows.
- AI-generated official reports or automated customer sending.

## Exact recommended prompt

```text
Implement `Phase 5 — Job Execution Reports / Worker Findings`.

First read `/docs` and verify that all Phase 4 migrations are applied and that root typecheck, API/web builds, the expanded smoke flow, and git diff checks are clean. Stop if existing Phase 1/2/3/4 smoke coverage breaks.

Evolve the existing JobReport and JobAttachment foundation additively so workers can submit structured findings, work performed, work still needed, follow-up required, notes, and photos/evidence. Add explicit office review states and tenant-safe role rules: workers may submit for jobs they can access; OWNER/OFFICE may review. Preserve current report and attachment behavior, Job.teamId, Job lifecycle, directory relations, assignments, and tenant isolation.

Add shared contracts, runtime validation, service-level permissions, real-API worker/admin UI, expanded smoke coverage, and documentation updates. Do not add job cost accounting, PDF generation, recurring contracts, command-board drag-and-drop, item movement, warehouse/logistics behavior, billing, AI automation, or mobile features in this phase.
```
