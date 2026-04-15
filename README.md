# Indek

Indek is a COD-native operations platform for small UAE courier operators running multi-merchant, home-based rider fleets.

The current repo contains:

- a Next.js web app in `apps/web`
- shared TypeScript packages in `packages/*`
- product documentation and execution trackers in `docs/`

## Current State

This repository is no longer just a scaffold. The local MVP already supports a real request-to-delivery loop on Postgres:

- operator can create merchants and riders
- merchant token portal can submit delivery requests
- request entry captures pickup/dropoff details and shows a route-aware average shipping charge
- operator can assign parcels to rider manifests
- rider can accept manifests and complete parcels as `delivered` or `failed`
- operator, merchant, and rider surfaces share a consistent app shell and design-token-based UI

The next product focus is access control and finance:

- merchant creates the request inside Indek; no WhatsApp integration in v1
- operator reviews each request before dispatch
- operator can either assign the request to a rider or send the merchant a follow-up message
- merchant registration with admin approval
- admin-managed rider permissions
- admin finance module with COD drop, reconciliation, route-aware charges, tax math, and CSV exports
- remittance, billing invoices, and finance email workflows

## Repo Layout

```text
.
├── apps/
│   └── web/
├── docs/
│   ├── journeys.md
│   ├── progress.md
│   └── product/
├── packages/
│   ├── db/
│   ├── domain/
│   └── shared/
├── AGENTS.md
├── Makefile
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

Requirements:

- Node.js 20+
- `pnpm`
- local Postgres for the current MVP flow

Install dependencies:

```bash
pnpm install
```

Run the web app:

```bash
pnpm dev
```

Other useful commands:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm check
pnpm check:full
pnpm format
make help
```

## Documentation

Start here:

- `docs/progress.md` for the current state of the project
- `docs/journeys.md` for the priority-ordered slices we build from next

Product docs:

- `docs/product/00-onepager.md`
- `docs/product/01-prd.md`
- `docs/product/02-ddd.md`
- `docs/product/03-ux.md`
- `docs/product/04-tech.md`

## Working Flow

- choose the next slice from `docs/journeys.md`
- implement it in code
- update `docs/progress.md` when the slice is partial or complete
- keep the relevant product docs in sync when workflows or architecture change

## Status

Indek is currently a local-first, Postgres-backed MVP with the core request, dispatch, and rider execution loop working end to end. The main work ahead is request review, admin finance, COD reconciliation, route-aware billing, remittance, CSV exports, and approval workflows.
