# Indek

Indek is a COD-native operations platform for small UAE courier operators running multi-merchant, home-based rider fleets.

The current repo contains:

- a Next.js web app in `apps/web`
- shared TypeScript packages in `packages/*`
- product and planning documentation in `docs/`

## Repo Layout

```text
.
├── apps/
│   └── web/
├── packages/
│   ├── db/
│   ├── domain/
│   └── shared/
├── docs/
│   ├── planning/
│   └── product/
├── AGENTS.md
├── Makefile
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

Requirements:

- Node.js 20+
- `pnpm`

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
make help
```

## Documentation

Product docs:

- `docs/product/00-onepager.md`
- `docs/product/01-prd.md`
- `docs/product/02-ddd.md`
- `docs/product/03-ux.md`
- `docs/product/04-tech.md`

Planning docs:

- `docs/planning/epic.md`
- `docs/planning/customer-journeys.md`
- `docs/planning/tonight-mvp.md`

## Status

The repo is currently a scaffolded foundation with mock domain data and product docs guiding the next implementation steps.
