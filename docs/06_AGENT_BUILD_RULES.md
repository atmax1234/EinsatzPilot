# Agent Build Rules

## 1. Inspect before changing

Inspect repository instructions, git state, Prisma schema/migrations, shared types/schemas, relevant API controllers/services/permissions/mappers, consuming pages, verification, and docs. Search before creating a concept. Do not casually remove stale or apparently unused code.

## 2. Extend existing architecture

Prefer current NestJS modules, Prisma conventions, shared packages, API helpers, server actions, and page structure. Do not create parallel state, validation, or domain layers without a documented reason. A large rewrite needs explicit scope, migration strategy, and behavior proof.

## 3. Preserve tenant safety

- Resolve company from authenticated membership, never an arbitrary payload.
- Scope every company-owned read/write by active `companyId`.
- Validate every referenced record is in the same company.
- Prefer not-found behavior when existence would leak another tenant's data.
- Add cross-tenant verification for each aggregate and cross-domain relation.
- Decide global versus per-company uniqueness deliberately.

## 4. Preserve role permissions

- Define permissions for list, read, create, update, archive/delete, assign, move, approve, and export.
- Enforce permissions in the backend; UI visibility is not security.
- Reuse centralized helpers and do not broaden roles merely to make a screen work.

## 5. Use the correct implementation order

1. Decide invariants, ownership, lifecycle, compatibility, and permissions.
2. Update Prisma schema.
3. Add and review a migration; schema edits alone are incomplete.
4. Update shared input/response types and schema helpers.
5. Add runtime validation and tenant-safe reference lookup.
6. Implement service rules and permissions.
7. Add controllers and public mappers.
8. Verify happy, invalid, unauthorized, and cross-tenant paths.
9. Connect web UI to the real API.
10. Connect mobile through the same governed API.
11. Update documentation.

## 6. Do not build frontend fiction

- No shiny frontend before backend logic.
- No fake state where real API data belongs.
- Do not duplicate lifecycle, conflict, movement, total, or permission rules solely in clients.
- Drag-and-drop is an interaction, not assignment logic.
- Every dashboard number needs a defined tenant-safe source and meaning.

## 7. Protect data evolution

- Treat checked-in migrations as history; normally add a new migration rather than editing an applied one.
- Plan backfills and compatibility before replacing legacy/free-text fields.
- Decide nullability, deletion/archive, indexes, and uniqueness explicitly.
- Avoid ambiguous polymorphism and untyped JSON for core relationships.
- Preserve records with operational, audit, or commercial significance.

## 8. Verify claims

Run relevant typechecks/builds. For schema/API work, run Prisma checks and representative PostgreSQL-backed verification. Test denial and cross-tenant isolation, not only happy paths. Placeholder lint/test scripts are not successful quality checks; report exactly what ran.

## 9. Keep changes logically scoped

Keep commits focused on one domain slice or migration path. Do not mix styling, upgrades, unrelated cleanup, and domain work. Preserve unrelated user changes. Commit/PR descriptions must call out migrations, behavior, compatibility, and follow-ups.

## 10. Update docs after meaningful changes

- Update `02_CURRENT_REPO_STATE.md` for implementation status.
- Update `03_DOMAIN_MODEL.md` for model decisions.
- Update `04_FEATURE_DEPENDENCIES.md` when gates change.
- Update `05_ROADMAP.md` and `07_NEXT_STEPS.md` when phases advance.
- Update the root README for setup/product changes.
- Update `FOUNDATION_CHECKLIST.md` only with evidence.

Never mark a feature complete because only a model, route skeleton, or UI shell exists.
