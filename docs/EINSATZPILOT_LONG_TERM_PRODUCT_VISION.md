# EinsatzPilot — Long-Term Product Vision

## Status and purpose

This document locks in the agreed long-term product direction for EinsatzPilot. It is guidance for architecture and future planning, not an instruction to implement every item now.

Detailed workflows, priorities, data models, UI designs, pricing limits, and delivery phases must be specified separately before implementation.

Repository checkpoint (2026-10-04): the explicit worksheet review actions, Phase 10 service-agreement/recurring-duty foundation, Phase 11 read-only command center, and Phase 12 responsive worker daily web experience are implemented. Agreements store reusable office-managed responsibility definitions without calculating occurrences or generating worksheets or Jobs. The worker flow keeps worksheet actual work separate from Job-grounded findings/evidence and introduces neither worksheet-row attachments nor native mobile. Phase 13 office review completion, Phase 14 end-to-end MVP proof, and Phase 15 production hardening come next. Communication Hub, Document Studio, email delivery, and external/generative AI assistance remain future phases and are not authorized by this checkpoint.

## Product vision: a company operating system

EinsatzPilot should grow beyond a task planner into a modular operating system for service companies and other small and medium-sized businesses.

Users must be able to run their work manually through clear interfaces. The AI assistant should be able to prepare or perform the same permitted actions through natural-language requests. AI is an additional control layer over the product—not a separate product and not a requirement for normal operation.

The shared platform should eventually connect:

- users, roles, teams, and permissions
- customers, contacts, tenants, suppliers, and other business partners
- locations, properties, objects, and sites
- jobs, tasks, appointments, recurring work, and assignments
- messages, email, documents, files, photos, and notes
- materials, inventory, costs, and finance-related records
- activity history, notifications, approvals, and audit logs

All future modules should reuse these shared core objects rather than create isolated copies of the same business data.

## Communication Hub

The Communication Hub is the central place for business communication connected to operational work.

Long-term capabilities may include:

- receiving, reading, drafting, sending, forwarding, and organizing email
- linking messages to customers, contacts, locations, jobs, and documents
- shared company inboxes and responsibility assignment
- reusable message templates and signatures
- internal comments, mentions, follow-ups, and reminders
- automatic extraction of dates, addresses, contact details, requests, and attachments
- creating or updating work directly from a message after review
- preserving a complete communication history around each record

Communication should not become a disconnected email client. Its main value is turning conversations into traceable business actions.

## Document Studio

The Document Studio is the central place to create and manage operational documents using shared company data.

Long-term capabilities may include:

- reusable company templates
- documents populated from customers, locations, jobs, materials, and teams
- offers, work orders, reports, protocols, confirmations, checklists, and handover records
- editing, previewing, versioning, exporting, and sharing
- photos, attachments, signatures, and structured form fields
- conversion of approved document data into follow-up work or records
- links between each document and its related business objects

The goal is to enter reliable data once and reuse it across workflows instead of repeatedly copying it between tools.

## AI-operable workflows

Everything a user can do manually should be considered for safe AI operation through the same application services and permission checks.

Examples of intended workflows:

- create a team, add workers, and designate a team leader
- extract job details from an incoming email
- create a job with its customer, address, tenant, date, time, notes, and attachments
- assign that job to a selected team
- reschedule an appointment and prepare notifications for affected people
- draft an email, document, report, or checklist from existing data
- summarize activity, identify missing information, and suggest next actions

The AI should use defined product actions such as creating a team or updating an assignment. It must not depend on fragile UI automation or bypass domain validation.

The preferred interaction pattern is:

1. Understand the user's intent and available context.
2. Extract or request missing required information.
3. Prepare a structured preview of the proposed changes.
4. Explain important effects, recipients, or conflicts.
5. Request confirmation when required.
6. Execute only authorized actions.
7. Report the result and record it in the audit history.

AI usage may be limited by subscription plan or token allowance. Manual product capabilities must remain available when an allowance is exhausted or AI is disabled.

## Modular industry packs

EinsatzPilot should have a stable shared core with optional modules, templates, terminology, and workflows suited to different businesses. It must not become a sales-only product or force every company to use every module.

Potential packs include:

### Facility and caretaker services

- property and object documentation
- recurring duties and inspections
- defect and incident reports
- before/after photos and proof of work
- key handovers
- property-management communication
- subcontractor coordination

### Cleaning services

- recurring schedules
- site-specific checklists
- proof photos
- quality controls and complaint handling
- team and shift planning

### Gardening and outdoor services

- seasonal and recurring planning
- offers and service records
- equipment and material notes
- before/after documentation
- optional weather-aware planning in a later phase

### Trades and field technicians

- work orders and appointments
- parts and material usage
- service and warranty history
- reports, approvals, and signatures

### Retail and storage-oriented businesses

- inventory and storage workflows
- suppliers and purchasing support
- staff tasks and daily checklists
- incidents, stock movements, and bookkeeping exports

### Logistics

- routes, deliveries, and handovers
- proof of delivery
- warehouse workflows
- exception and damage reports

### Sales-focused businesses

- leads, pipelines, offers, and follow-ups
- customer communication and document automation

### Office and corporate teams

- internal requests and approvals
- document workflows
- task ownership and meeting follow-ups

Industry packs should configure and extend the shared platform. They should not become separate applications with incompatible customer, job, document, or audit models.

## Safety, permissions, and accountability

The permanent rule is:

> AI may extract, classify, summarize, draft, suggest, and prepare. It may execute only explicitly supported actions within the current user's permissions. Sensitive or high-impact actions require a clear preview and confirmation.

Required safeguards:

- apply the same authentication, authorization, validation, and business rules to manual and AI actions
- never let AI elevate its own or the user's permissions
- show what will change before consequential execution
- require confirmation for external communication, destructive actions, financial actions, and other high-impact changes
- make confirmation specific to the proposed action; do not treat a general chat message as unlimited consent
- keep a durable audit trail containing the initiating user, AI involvement, action, affected records, time, and outcome
- preserve source evidence when data is extracted from messages or documents
- expose conflicts, uncertainty, and missing required information instead of inventing values
- support retry and recovery without silently creating duplicate records or messages
- minimize access to personal and company data and respect tenant isolation

Examples that normally require confirmation include:

- sending an email or notification to external recipients
- deleting, archiving, or bulk-changing records
- assigning or rescheduling work when it affects other people
- creating invoices, payments, purchases, or bookkeeping entries
- changing roles, team leaders, permissions, or account access
- importing or exporting sensitive data

Low-risk read-only assistance and drafts may not require confirmation, subject to the user's permissions and future product policy.

## Architectural guardrails

Future implementation should preserve these principles:

- one domain service layer for both manual UI and AI tool actions
- explicit, typed actions with validated inputs and predictable results
- stable identifiers and links between shared business objects
- event/activity history for meaningful state changes
- idempotency for actions that can create duplicates or send messages
- modular capabilities that can be enabled by company, plan, and role
- provider-independent abstractions where practical for email, files, and AI models
- human-readable previews before consequential actions

## Not-now boundaries

The following are explicitly **not authorized for immediate implementation by this document**:

- building the complete company operating system in one release
- implementing every industry pack or speculative workflow
- adding bookkeeping, invoicing, payments, payroll, tax, or legal-compliance features without a dedicated specification and review
- autonomous AI that performs consequential actions without the defined permission and confirmation flow
- giving AI direct database access or allowing it to bypass application services
- replacing manual workflows with AI-only interfaces
- training on or sharing customer data outside an approved privacy and security design
- sending real emails, notifications, documents, orders, or invoices during prototypes unless explicitly approved and safely isolated
- committing to specific external providers, integrations, pricing, or token allowances before separate decisions are made
- premature microservices, complex plugin systems, or broad infrastructure work solely for hypothetical future scale

Near-term work should focus only on separately approved product requirements. New features should keep this direction possible without building unused abstractions in advance.

## Decision rule for future features

Before implementing a feature from this vision, define:

1. the target user and concrete use case
2. the shared core objects involved
3. the complete manual workflow
4. the AI-assisted workflow, if applicable
5. permissions, confirmation level, and audit events
6. failure, conflict, retry, and recovery behavior
7. data privacy and retention needs
8. plan/module availability and usage limits
9. acceptance criteria and explicit non-goals

This document records the destination. Separate scoped specifications decide the route and timing.
