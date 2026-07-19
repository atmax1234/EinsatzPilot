# Product Vision

## Definition

EinsatzPilot is:

> A modular company operations command center for managing customers, objects, jobs, teams, reports, costs, responsibilities, and customer-facing proof.

The product is not an inventory, logistics, delivery, or warehouse application. Items, materials, tools, and assets are supporting context for operational work: what was needed, purchased, used, installed, documented, or charged on a job.

## Product center

- **Jobs are the star:** recurring services, one-time work, incidents, repairs, inspections, and side tasks are planned, assigned, executed, reviewed, and commercially prepared through jobs.
- **Objects are the memory:** buildings, sites, addresses, areas, customers, recurring duties, incidents, findings, photos, and completed work accumulate around stable objects.
- **Reports are the proof:** workers document findings and work; the office reviews evidence; customers receive understandable records.
- **Costs are the money layer:** labor, travel, materials, purchases, external services, and custom cost lines turn execution into invoice- and offer-ready information.
- **Assignments are the control layer:** people, teams, responsibilities, and supporting resources are connected to work without replacing explicit job lifecycle rules.
- **Items and materials are supporting context:** they help explain job cost, consumption, purchases, tools, and proof. They are not the product's organizing center.

## Target users

- Facility-management and property-service companies coordinating clients, managed objects, recurring services, incidents, teams, reports, and costs.
- Cleaning, caretaking, gardening, winter service, maintenance, installation, inspection, and technical-service companies that need one dependable operational record.
- Small companies needing structure without enterprise complexity, and growing companies needing clearer responsibility, review, proof, and commercial preparation.

The core remains industry-neutral, but it is optimized around service operations and customer accountability rather than stock movement or warehouse throughput.

## Guiding workflow

A facility-management company manages `Musterstr. 1` for a property-management customer (`Verwaltung`). The object has regular work such as building cleaning, window cleaning, caretaking, inspections, and recurring checks.

A tenant reports a roof leak or broken pipe. The office creates an incident job linked to the same object and assigns Team 1. Workers inspect the issue, upload photos, record findings, describe work performed, and identify follow-up work.

The office reviews the report, plans the repair, purchases required materials, and records quantities and costs against the job. The company can then send the Verwaltung a clear report containing:

- the issue found;
- photos and supporting evidence;
- work performed;
- labor time;
- materials and costs;
- follow-up notes;
- an invoice-ready summary.

This end-to-end path is the product direction: object context leads to governed jobs, team execution, reviewed proof, cost clarity, and customer communication.

## Long-term system

- **Customers and Verwaltung:** organizations or people receiving or commissioning work, with contact and commercial context.
- **Objects and addresses:** stable buildings, sites, units, and areas that retain operational memory.
- **Jobs:** recurring services, one-time work, incidents, repairs, inspections, and follow-up tasks with explicit lifecycle.
- **People, teams, and assignments:** responsibility, dispatch, support, and scheduling context.
- **Worker findings and reports:** issue descriptions, work performed, remaining work, photos, files, and office review.
- **Job costs:** labor, travel, material purchases/use, external services, and custom cost lines.
- **Customer-facing proof:** damage, maintenance, service, and object-history reports, including PDF output.
- **Recurring service contracts:** object-based templates and schedules for repeatable services.
- **Commercial preparation:** offer- and invoice-ready summaries grounded in reviewed work and cost data.
- **Company control:** dashboards for jobs, teams, reports, costs, objects, and open issues.
- **Automation and AI:** assist with German customer replies, summaries, message-to-job intake, and commercial drafts after trusted workflows exist.

## Supporting item scope

Items can identify materials, tools, consumables, or assets used in operational context. Useful capabilities include job cost lines, purchased and used quantities, evidence, and later optional traceability where a real customer workflow requires it.

Item movement history may be added later as supporting infrastructure. It must not drive the default roadmap, introduce warehouse-first concepts, or displace job execution, reporting, cost, and customer-proof work.

## Product principles

1. Jobs and customer outcomes before supporting-resource mechanics.
2. Objects provide durable operational memory.
3. Worker input becomes reviewed, customer-usable proof.
4. Costs are grounded in real jobs and reviewed execution.
5. Assignments provide control without becoming client-only scheduling fiction.
6. Tenant safety, role enforcement, and explicit lifecycle remain non-negotiable.
7. Automation and AI assist trusted workflows; they do not replace missing domain rules.

## Status boundary

Today the repository implements identity, teams, jobs, reports, attachments, customers, structured addresses, objects, object areas, item categories, items, optional backwards-compatible Job directory links, and a generic Assignment foundation. `Job.teamId` remains the existing operational team link and is not synchronized with generic assignments.

Richer worker findings, review workflows, job cost ledgers, customer report generation, recurring service contracts, and a company command-center dashboard remain planned. Item movement is optional later infrastructure, not the next default phase.
