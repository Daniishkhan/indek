# AGENTS.md

## Purpose

This repository is for Indek, a COD-native courier operations platform. Agents working here should preserve the product framing and keep code and docs aligned.

## Project Conventions

- Keep product docs under `docs/`.
- Keep product-spec documents in `docs/product/`.
- Keep execution and sequencing docs in `docs/planning/`.
- Prefer updating the relevant docs when product language, workflows, or architecture change.

## Codebase Shape

- `apps/web` contains the Next.js application.
- `packages/shared` contains shared types.
- `packages/domain` contains domain selectors and business logic.
- `packages/db` contains seed data and database-facing code.

## Naming

- The product name is `Indek`.
- Use the workspace package scope `@indek/*`.
- Treat phrases like "dispatch board" as workflow terminology, not product branding.

## Working Style

- Make focused changes.
- Keep imports and package metadata consistent when renaming shared modules.
- Run `pnpm typecheck` after meaningful TypeScript or path changes.
- Update docs when moving files so references do not drift.
