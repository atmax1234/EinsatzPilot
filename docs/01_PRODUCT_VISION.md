# Product Vision

## Definition

EinsatzPilot is:

> A modular all-in-one operations platform for planning, assigning, documenting, reviewing, proving, and improving everyday work across business types and industries.

The product maxim is: **specific execution, broad architecture**. Concrete workflows must be useful enough to run real work, while the domain and module boundaries remain adaptable beyond one trade or service vertical.

## Positioning

Hausmeister, cleaning, gardening, and facility-service workflows are the first concrete proof and product workbench. They supply real objects, teams, daily duties, incidents, evidence, costs, and customer-accountability requirements. They are not the final product or market boundary.

The long-term platform should support small businesses, service companies, shop owners, plumbers, electricians, technicians, office teams, logistics teams, corporate operational teams, and other industries that need dependable everyday-work coordination. This is an architectural direction, not a claim that every industry-specific module exists today.

The current product is not a dedicated inventory, warehouse-management, route-planning, or delivery application. Materials, tools, items, and assets remain supporting operational context unless a later, demonstrated workflow justifies a dedicated module. Logistics teams can still use the broader planning, assignment, execution, and review platform without warehouse mechanics becoming the organizing center.

## Product center

- **Everyday work is the center:** the platform coordinates what should happen, who owns it, what actually happened, what needs review, and what follows next.
- **Daily worksheets/team protocols are the execution bridge:** they translate object responsibility, existing Jobs, routine duties, and ad hoc instructions into one dated workday plan and execution record for a team or worker.
- **Jobs are governed work records:** the current implementation uses Jobs for scheduled work, incidents, repairs, inspections, and follow-up tasks with explicit lifecycle. Worksheets complement this foundation; they do not replace it or create a second Job system.
- **Objects are the memory:** buildings, sites, addresses, areas, customers, responsibilities, incidents, findings, photos, and completed work accumulate around stable objects.
- **Reports are the proof:** workers document findings and work; the office reviews evidence; customers receive understandable records.
- **Costs are the money layer:** labor, travel, materials, purchases, external services, and custom cost lines turn execution into invoice- and offer-ready information.
- **Assignments are the control layer:** people, teams, responsibilities, and supporting resources are connected to work without replacing explicit lifecycle rules.
- **Items and materials are supporting context:** they help explain work, cost, consumption, purchases, tools, and proof. They are not the product's organizing center.

## Target users

The first, most concrete users are facility-management and property-service companies plus cleaning, caretaking, gardening, winter-service, maintenance, installation, inspection, and technical-service teams.

The wider target includes:

- small businesses and service companies that need structure without enterprise complexity;
- shop owners and office teams coordinating recurring and ad hoc operational work;
- plumbers, electricians, technicians, installers, and other trades;
- logistics teams coordinating people, duties, issues, and proof without requiring EinsatzPilot to be their warehouse system;
- larger corporate operational teams that need clearer responsibility, review, evidence, and improvement loops;
- other industries whose daily work can be represented through modular planning, execution, review, and follow-up workflows.

## Guiding workflow

The old Lütjens protocol workflow is a useful business reference for the next product foundation, but its code is not an implementation source to copy.

An office user creates a worksheet/protocol for a date and a team or worker. The draft contains planned rows such as cleaning or inspection duties at `Musterstr. 1`, optional links to existing Jobs or directory context, and ad hoc instructions such as “meet tradesperson at 11:00,” hand over keys, inspect a broken door, or order bulbs. The office can edit the draft until it is deliberately sent and planning becomes locked.

At the start of the workday, the assigned worker sees the current sheet, records actual work, extra work, issues, findings, and notes, and submits the result. The office reviews the protocol. In a later phase, reviewed entries can deliberately become follow-up Jobs, cost records, reports, billable work candidates, or customer communications.

This is the core relationship:

> Worksheet/protocol planning is the operational bridge between object responsibility and actual worker execution.

Real work changes daily. Recurring agreements should therefore later feed flexible worksheet planning rather than generate large numbers of rigid Jobs far in advance.

## Long-term system

- **Customers and counterparties:** organizations or people receiving, commissioning, or participating in work, with contact and commercial context.
- **Objects and addresses:** stable buildings, sites, units, areas, accounts, or other managed operational contexts that retain memory.
- **Daily worksheets/team protocols:** dated team/worker plans containing expected, Job-linked, object-linked, and ad hoc work plus actual execution and review.
- **Jobs:** governed one-time work, incidents, repairs, inspections, and follow-up tasks with explicit lifecycle.
- **People, teams, assignments, and responsibilities:** ownership, dispatch, support, and scheduling context.
- **Worker findings and reports:** issue descriptions, work performed, remaining work, photos, files, and office review.
- **Job costs:** labor, travel, material purchases/use, external services, and custom cost lines.
- **Review-to-follow-up:** deliberate conversion of reviewed worksheet results into Jobs, costs, reports, customer communication, and commercial preparation.
- **Customer-facing proof:** damage, maintenance, service, and object-history reports, with later reproducible export/delivery channels.
- **Service agreements and recurring object duties:** reusable expectations and cadence that supply worksheet planning inputs without becoming a rigid parallel Job generator.
- **Company control:** dashboards for workdays, Jobs, teams, reports, costs, objects, agreements, and open issues.
- **Automation and AI:** assistance with planning, German customer replies, summaries, intake, and commercial drafts after trusted workflows exist.

## Product principles

1. Specific execution, broad architecture.
2. Plan real everyday work rather than force changing duties into rigid long-range records.
3. Use worksheets to bridge responsibility and execution; use Jobs where governed work lifecycle is needed.
4. Objects provide durable operational memory.
5. Worker input becomes reviewed, reusable proof.
6. Costs are grounded in real work and reviewed execution.
7. Assignments provide control without becoming client-only scheduling fiction.
8. Tenant safety, role enforcement, and explicit lifecycle remain non-negotiable.
9. Automation and AI assist trusted workflows; they do not replace missing domain rules or human review.

## Status boundary

Today the repository implements identity, teams, Jobs, structured execution reports and office review, attachments, customers, structured addresses, objects, object areas, item categories, items, optional backwards-compatible Job directory links, a generic Assignment foundation, a tenant-safe Job cost ledger with backend-derived summaries, OWNER/OFFICE-only Job-grounded customer report snapshots, company-owned daily worksheets/team protocols, all three explicit worksheet-review actions, and office-managed service agreements with recurring object duties. The customer-report foundation copies explicit approved reports, attachment metadata references, selected cost details, optional full cost summaries, and directory/Job context into stable reviewable data. `Job.teamId` remains the existing operational team link and is not synchronized with generic assignments.

Customer-report layout polish and browser-print readiness are implemented on the immutable snapshot foundation. The customer presentation excludes internal notes and does not reread mutable operational sources; evidence is represented by stored metadata references rather than embedded file bytes.

Daily worksheets/team protocols implement the dated `DRAFT -> SENT -> SUBMITTED -> REVIEWED -> ARCHIVED` execution bridge. Planned rows support free text and optional customer/address/object/object-area/Job links; assigned workers can read sent-or-later sheets and edit only `actualText` while sent. Phase 9 lets OWNER/OFFICE deliberately create one normal follow-up Job, one Job-grounded cost line, and one structured Job report per reviewed row with immutable provenance and duplicate-safe replay. Phase 10 service agreements now store reusable duties, effective dates, an IANA timezone, cadence anchors, lifecycle, and optional directory context. They do not yet calculate due occurrences, model exceptions, copy duties into worksheets, schedule background work, or generate Jobs. The company command center is next in Phase 11, followed by smart planning/AI/automation in Phase 12.

The separate long-term product vision also preserves a future Communication Hub and Document Studio with optional AI assistance. Those are architectural direction only: no mailbox, email sending, document editor, or AI workflow exists or is authorized by the current phase. Manual, permission-safe operational workflows remain the prerequisite. Actual PDF generation/export, invoice/payment workflows, customer email delivery, and optional movement/logistics mechanics remain planned or explicitly deferred.
