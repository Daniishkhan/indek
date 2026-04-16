# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product framing

Indek is a COD-native operations platform for small UAE courier operators running multi-merchant, home-based rider fleets. The product name is **Indek** — the working directory is named `dispatch` for historical reasons, and "dispatch board" is workflow terminology, not branding. Preserve this framing in code, copy, and docs.

## Commands

The repo is a pnpm workspace (pnpm 10.33, Node 20+). Root scripts proxy to `apps/web`.

- `pnpm install` — install workspace deps
- `pnpm dev` — run the Next.js app (`next dev` in `apps/web`)
- `pnpm build` / `pnpm lint` / `pnpm typecheck` — forwarded to `apps/web`
- `pnpm --filter web <script>` — run a script in the web app directly
- `make dev` — convenience alias for `pnpm dev`
- `make seed` — convenience alias for `pnpm seed`

Run `pnpm typecheck` after meaningful TypeScript or path changes (per `AGENTS.md`). There is no test runner wired up yet.

## Git workflow

Standard git workflow. Use `git` and `gh` CLI for branch, commit, push, and PR operations. PRs go to `main`.

## Architecture

### Monorepo layout

- `apps/web` — Next.js 16 App Router, React 19. Today this is both frontend and backend runtime.
- `packages/shared` — pure TypeScript domain types (`Merchant`, `Rider`, `Parcel`, `Manifest`, `EventLogEntry`, `RemittanceStatement`, `IndekSeed`). No runtime logic.
- `packages/domain` — selector/business-logic functions over seed data (`listRiders`, `getParcelsForRider`, `getOpsSnapshot`, token-based merchant lookup, etc.).
- `packages/db` — currently just an in-memory `seedData` object typed as `IndekSeed`. The package is the seam where real persistence will land.

Packages are wired via tsconfig `paths` in `tsconfig.base.json` (`@indek/shared`, `@indek/domain`, `@indek/db` → each package's `src/index.ts`) and as `workspace:*` deps. Use the `@indek/*` scope when adding new shared modules.

Note: `packages/domain/src/index.ts` imports seed data via a relative path (`../../db/src/index`) rather than `@indek/db`. Keep that in mind when moving files — both the path alias and the relative import must stay consistent.

### Web app surfaces

`apps/web/app` uses three distinct user surfaces, each with its own layout:

- `/operator/*` — operations console: `dispatch`, `intake`, `live`, `reconciliation/[riderId]`
- `/rider` — rider PWA (has a `manifest.ts`)
- `/m/[token]` — tokenized merchant view; tokens are mapped to merchant IDs in `domain/getMerchantByToken`

Pages consume data through `@indek/domain` selectors, not by importing from `@indek/db` directly.

## Documentation

Product and planning docs are the source of truth for product language and sequencing — update them when workflows or architecture change.

- `docs/product/` — onepager, PRD, DDD, UX, tech (`00-onepager.md` … `04-tech.md`)
- `docs/planning/` — `epic.md`, `customer-journeys.md`, `tonight-mvp.md`
