# Product Vision

## Definition

EinsatzPilot is a modular operations command center: one tenant-safe system in which a company can model its operational world, plan work, assign resources, record execution, trace movement, produce evidence, and eventually connect that work to commercial and automated workflows.

It is not one giant fixed workflow. It should provide stable shared primitives and optional modules that companies can adopt as their operational maturity grows.

## Target users

- Small companies needing one dependable place for customers, work, people, and records.
- Growing teams needing explicit responsibility, shared resources, scheduling, traceability, and repeatable processes.
- Larger operational businesses needing multiple teams, richer permissions, configurable workflows, reporting, billing integration, automation, and auditable history.

The product is not only for gardeners, Hausmeister services, or cleaning companies. Those are use cases, not domain boundaries. The core should also serve field service, maintenance, installation, logistics, inspection, event, technical-service, and other operational organizations without embedding one trade's vocabulary.

## Long-term system

- **Jobs:** governed units of work with lifecycle, time, priority, destination, requirements, assignments, activity, and outcomes.
- **Customers:** organizations or people receiving work, with contact and billing context.
- **Objects and locations:** stable managed sites or entities, subdividable into areas and connected to reusable addresses and history.
- **People and teams:** users, memberships, groups, qualifications, availability, and responsibility.
- **Items and materials:** things used, consumed, delivered, installed, or returned.
- **Assets and vehicles:** durable resources with identity and lifecycle.
- **Packages or bundles:** reusable groups of work, items, materials, or requirements.
- **Assignments:** explicit links between work and responsible people, teams, items, assets, or other resources.
- **Movements:** append-oriented history of location, custody, and quantity changes.
- **Reports and documents:** notes, evidence, photos, files, forms, approvals, and generated records.
- **Billing:** offers, prices, line items, invoices, and commercial status grounded in real customers and performed work.
- **Automation:** notifications, rules, integrations, and AI assistance operating on trusted data and auditable events.

## Product principles

1. Operational truth before presentation.
2. Modular but connected domains with no duplicate sources of truth.
3. Tenant safety in schema, queries, services, permissions, and tests.
4. Explainable lifecycle, assignment, movement, reporting, and commercial history.
5. An industry-neutral core with configurable trade-specific edges.
6. Progressive complexity suitable for both small and larger organizations.
7. Web and future mobile clients backed by the same governed API behavior.

## Status boundary

This document defines direction, not completion. Today the repository implements identity, teams, jobs, reports, attachments, customers, structured addresses, objects, object areas, item categories, items, optional backwards-compatible Job directory links, and a generic Assignment foundation. `Job.teamId` remains the existing operational team link and is not synchronized with generic assignments. Item movements, custody, command-board behavior, billing, automation, and enterprise workflow configuration remain planned.
