---
title: "Indek — Technical Architecture Document"
version: "0.2"
status: draft
depends_on:
  - docs/product/00-onepager.md
  - docs/product/01-prd.md
  - docs/product/03-ux.md
scope: "High-level architecture, scaffolding, data flow, and deployment for v1. Not a schema document."
---

# Indek — Technical Architecture Document

## 1. Purpose

This document is the technical companion to the PRD and UX documents. It decides the shape of the system at the architecture level — how the code is organized, how data flows, how the three user surfaces are stitched together, and how the whole thing gets deployed.

It is deliberately _not_ a schema document, an API specification, or an implementation plan. Tables, columns, endpoints, and class hierarchies are downstream of this. This document answers "what does the system look like from 10,000 feet" and "what are the load-bearing technical decisions that everything else hangs off of." Detailed data modeling lives in `02-ddd.md`; specific implementation choices live in code.

## 2. Guiding technical principles

1. **Boring technology by default.** Every dependency and every architectural choice is the most boring option that solves the problem. Novelty has a cost; v1 cannot afford it.
2. **Single deploy, single binary feel.** Solo-built v1 should be a single thing to run, a single thing to deploy, and a single thing to roll back. Microservices are a v3 problem at the earliest.
3. **The event log is the spine.** Every state change in the system is captured as an immutable event record. The current state of any aggregate is derivable from its event history. This is non-negotiable because the chain-of-custody promise of the product depends on it.
4. **Offline-tolerant on the rider, online-only on the operator.** The rider PWA must survive lost connectivity mid-shift. The operator console is allowed to assume connectivity.
5. **No fund holding, ever.** No technical component touches money flow. There is no payment integration, no wallet table, no balance held by the system on behalf of anyone. The cash ledger is a record of physical cash that exists in someone else's hands or someone else's bank account.

## 3. The stack at a glance

- **Language:** TypeScript end to end. Same language across operator console, rider PWA, merchant view, server, and shared domain logic.
- **Framework:** Next.js (App Router) as the single application framework. Server-side rendering for the operator console and merchant view; client-side rendering with service worker for the rider PWA.
- **Database:** Managed Postgres (Neon, Supabase, or Railway — choice deferred to deploy time, all three work).
- **File storage:** S3-compatible object storage (Cloudflare R2 or AWS S3) for delivery photos, remittance PDFs, and billing invoice PDFs.
- **Authentication:** Simple email-password for operator and approved merchants, simple credentials for riders, and signed unguessable tokens for merchant links. No third-party auth provider in v1.
- **Email delivery:** Transactional email via a provider-backed outbox model, with Resend as the default v1 provider.
- **Background work:** Postgres-backed job queue (a thin wrapper around a `jobs` table with a worker process, or Graphile Worker if a library is preferred). No Redis, no separate queue infrastructure in v1.
- **Hosting:** Vercel for the application; managed Postgres provider for the database; R2/S3 for storage. Single-region (Middle East or Europe-West, whichever has the lowest latency to UAE).
- **Package management and monorepo:** pnpm workspaces. Turborepo only if build performance becomes a problem.

The whole stack should be standable-up by a solo developer in an afternoon and deployable in another afternoon.

## 4. Repository layout

The monorepo holds one application and a small set of shared packages.

```
dispatch/
├── apps/
│   └── web/                  # The single Next.js application
│       ├── app/
│       │   ├── operator/     # Operator console routes
│       │   ├── rider/        # Rider PWA routes (with manifest.json + service worker)
│       │   ├── m/            # Merchant view routes (link-based)
│       │   └── api/          # Server-side route handlers
│       └── public/
├── packages/
│   ├── db/                   # Database client, migrations, schema (lives here per DDD)
│   ├── domain/               # Domain logic — aggregates, state machines, invariants
│   └── shared/               # Shared types and small utilities
├── docs/
│   └── product/              # 00-onepager, 01-prd, 02-ddd, 03-ux, 04-tech
└── package.json
```

The single application choice is deliberate. Three apps would be cleaner conceptually but triple the deployment surface, the build time, and the ways things can go wrong. One Next.js app with three route groups is simpler and faster to ship. If the rider PWA's needs eventually diverge enough to justify a split, that's a refactor worth doing later — not a problem to solve now.

## 5. Application structure inside the single Next.js app

The app is divided into four route groups, each of which behaves like its own product but shares the underlying server, database, and domain layer.

- **`/operator/*`** — the operator console. Authenticated, desktop-first, server-rendered. Rich UI, information-dense. Talks to the server via route handlers and server actions.
- **`/operator/finance/*`** — the admin-only money hub inside the operator console. Reconciliation, COD drop, remittances, billing invoices, tax review, CSV exports, and finance email history live here. It is not a separate service.
- **`/rider/*`** — the rider PWA. Has its own `manifest.json` and service worker so it can be installed to the home screen. Mobile-first, designed for one-handed use, offline-tolerant. Communicates with the server via route handlers, with all writes queued through a local sync layer.
- **`/merchant/*`** — the approved merchant workspace. Authenticated, lightweight, and approval-gated. Used for request entry, request follow-up visibility, plus finance document visibility.
- **`/m/[token]/*`** — the merchant token view. The token in the URL is signed and scoped to a single merchant; presenting it grants low-friction access to that merchant's request/status/remittance surfaces without replacing the approval-gated workspace.

All four route groups share the same backend code under `app/api/*` and the same domain package under `packages/domain`. The split is purely a frontend organizational choice.

## 6. Data layer at a high level

The system has four categories of data, each treated differently:

- **Aggregates and reference data.** Merchants, merchant approval states, riders, rider access states, parcels, manifests, shifts, route-charge rules, remittance statements, billing invoices, reconciliation summaries, CSV export jobs, and finance outbox items. Stored in normalized Postgres tables. Mutated through domain operations defined in `packages/domain` — never directly from route handlers. This is the "current state" view of the world.
- **Events.** The event log. Append-only. Every state-changing operation in the system writes both an aggregate update _and_ an event record in the same database transaction. Events carry actor (rider/operator), timestamp, geolocation when applicable, and references to proof artifacts. The event log is queryable for dispute lookup and is the backbone of the chain-of-custody promise.
- **Files.** Delivery photos, signed-off remittance PDFs, billing invoice PDFs, anything binary. Stored in object storage, referenced by URL from the relevant event or aggregate record. Never stored in the database.
- **Outbox state.** Durable email-send status for approval notices and finance documents, plus durable request follow-up state when operator messaging is delivered through the product. Stored in Postgres so the UI can show `queued`, `sent`, and `failed` states reliably.

The DDD document specifies which aggregates exist and which invariants they enforce. This document only cares that the data lives in Postgres (relational), the event log lives next to it in the same database (for transactional integrity), and binary files live in object storage (for cost and serving efficiency).

## 7. Authentication

Three different auth models for three different surfaces, all kept as simple as possible:

- **Operator:** Email + password. Sessions managed via signed cookies. One account per operator user. No SSO, no MFA in v1 — the operator is a small trusted group inside one company.
- **Rider:** A simple credential the operator sets when creating the rider profile. The rider signs in on their phone once and stays signed in via long-lived session. The PWA assumes a signed-in rider for all functionality. Rider access remains admin-managed only; there is no rider self-sign-up.
- **Merchant:** Merchant registration is public inside the current tenant, but it creates a `pending_approval` account first. Only `approved` merchants can enter the signed-in merchant workspace. Merchant tokens remain supported for low-friction access and can be revoked and reissued from the operator console.

A library like Lucia, Auth.js, or even a hand-rolled session table is all acceptable. No third-party identity provider in v1 — they add cost, complexity, and a vendor dependency that isn't earning its keep at this scale.

## 8. The event log as a first-class concern

This is the most important architectural decision in the document, so it gets its own section.

Every domain mutation in Indek happens through a single pattern: a domain operation in `packages/domain` validates the change against the relevant aggregate's invariants, updates the aggregate's row in Postgres, and writes one or more event rows to the event log — all in the same database transaction. If the transaction fails, neither the aggregate update nor the events are persisted. If it succeeds, the event log is guaranteed to be in sync with the current state of the world.

Reads come from the aggregate tables for normal display. Reads come from the event log for dispute lookup, audit trail, and reconciliation backtracing. The aggregate tables are essentially a materialized view over the event log — they exist for query speed, not as the source of truth.

The finance module follows the same rule: reconciliation, remittance, and billing all read from the same delivery and cash truth rather than separate manually edited finance tables.

This pattern keeps the system simple (no separate event store, no eventual consistency, no event-replay infrastructure in v1) while preserving the chain-of-custody promise. It can evolve into something more sophisticated later (a true event sourcing setup, a separate read model, projections) if it ever needs to. For v1, it's a single Postgres database with a strict discipline about how writes happen.

## 9. Data flow: the life of an order

To make the architecture concrete, here is how a single order moves through the system.

```
Merchant creates request in Indek
        │
        ▼
Request enters review queue
        │   Server action → domain.createParcels()
        │   → INSERT parcels + request.submitted events (one txn)
        ▼
Operator reviews request
        │
        ├── Needs clarification
        │     → domain.requestClarification()
        │     → INSERT request.needs_clarification event
        │
        └── Ready for dispatch
        │     → domain.approveRequestForDispatch()
        │     → INSERT request.approved_for_dispatch event
        ▼
Parcels appear on dispatch board
        │
        ▼
Operator builds a manifest, assigns it to a rider
        │   Server action → domain.assignManifest()
        │   → INSERT manifest + manifest.assigned event + parcel.assigned events
        ▼
Rider PWA sees the new manifest (poll or server-sent event)
        │
        ▼
Rider accepts manifest, picks up parcels
        │   PWA sends events to /api/events (or queues offline)
        │   → domain.recordPickup() validates + writes events
        ▼
Rider delivers parcels (happy, partial, or failed)
        │   PWA sends events; offline ones queue locally and sync later
        │   → domain.recordDelivery() / recordPartial() / recordFailedAttempt()
        │   → Cash ledger entries written as events; aggregate updated
        ▼
Rider ends shift, drops cash and parcels with operator
        │   Operator opens reconciliation screen
        │   → domain.reconcileShift() validates parcel + cash counts
        │   → INSERT shift.closed event (with variance + reason if any)
        │   → exportable COD drop summary and reconciliation rows derived from same truth
        ▼
Cycle ends; operator opens finance module
        │
        ├── Remittance
        │     → domain.generateRemittance() reads delivered parcels for merchant in period
        │     → Computes route-aware fees, taxes, and pass-through cash
        │     → INSERT remittance.draft event; PDF generated to object storage
        │
        ├── Billing
              → domain.generateInvoice() reads billable merchant charges for the period
              → Creates route-aware invoice lines, totals, and tax values
              → INSERT invoice.draft event; PDF generated to object storage
        │
        └── Exports
              → domain.generateFinanceExport() produces CSV rows for reconciliation,
              → COD drop, remittance, billing, and tax review
              → INSERT export.generated event
        ▼
Operator sends remittance or invoice by email
        │   → INSERT email.queued event / update outbox row
        │   → provider send attempt / update send status
        ▼
Operator marks remittance as settled or invoice as paid with payment reference
        │   → INSERT remittance.settled or invoice.paid event
        ▼
Merchant opens approved workspace or token link, sees status and finance documents
        │   Server-rendered read from aggregate tables, scoped by approval state or merchant token
```

Every arrow that crosses a system boundary is a transaction that updates aggregates and writes events together. There are no fire-and-forget mutations.

## 10. Offline strategy for the rider PWA

The rider PWA must work when connectivity drops. The strategy:

- **Service worker** registers on first visit and caches the application shell, the current manifest, and all parcel details for the active shift.
- **IndexedDB** holds (a) the cached manifest data, (b) a local queue of pending events the rider has created offline, and (c) any photos taken offline that haven't uploaded yet.
- **Sync layer** in the PWA tries to flush the local event queue whenever connectivity is detected. Events are sent to a single `/api/events` endpoint that accepts batches and returns per-event success/failure. Events that fail validation server-side are flagged in the PWA for the operator to review.
- **Optimistic UI** — the rider always sees the result of their action immediately, computed from local state. When the event syncs successfully, the local state is reconciled with what came back from the server. Conflicts are rare in practice because each rider is the sole writer for their own parcels in their own shift.
- **Photos** are uploaded directly to object storage via signed upload URLs the server issues on demand. Offline photos sit in IndexedDB until connectivity returns, then upload in the background.
- **Visible state** — the rider always sees an "online / offline / N pending" indicator. Offline is not a hidden state.

The operator console gets none of this. It assumes a working connection and shows an error if connectivity is lost.

## 11. Background work

Some things have to happen on a schedule rather than in response to a user action: reattempt queue processing (a parcel that's been failed three times needs to enter the return-to-merchant flow), shift cleanup, remittance cycle generation, billing invoice generation where scheduled, finance email retries, and link token expiry.

For v1, all of this lives in a single background worker that runs alongside the web app. The worker reads from a `jobs` table in Postgres, executes due jobs, and writes the results back as events in the same event log as everything else. No Redis, no separate queue infrastructure, no Lambda functions. If the worker crashes, jobs stay in the table and get picked up on restart.

## 12. Deployment topology

Single region, single environment for v1 (plus a staging environment that mirrors production for testing).

- **Application:** Vercel deployment of the Next.js app. Auto-deploys from `main`.
- **Database:** Managed Postgres in a region close to UAE (the closest options are typically Frankfurt or Bahrain, depending on provider). Connection pooling handled by the provider.
- **Object storage:** Cloudflare R2 (preferred for lower egress costs) or AWS S3, in the same general region as the database.
- **Background worker:** A small long-running process colocated with the database — Railway, Fly.io, or Render — pulling from the `jobs` table. Not on Vercel because Vercel is serverless. This worker handles finance email retries and scheduled document jobs in addition to operational jobs.
- **Domain and DNS:** Cloudflare in front of everything. The merchant view and the rider PWA may eventually want their own subdomains for cleaner installation experience; v1 ships under a single domain with route prefixes.
- **Backups:** Daily Postgres snapshots via the managed provider's built-in tooling. Object storage has its own redundancy.
- **Secrets:** Managed via Vercel environment variables and (for the worker) the worker host's secret store.

The whole thing should cost well under $100/month at v1 scale.

## 13. Observability

Minimal but present:

- **Application logs:** Structured logs from the Next.js app and the worker, shipped to a single destination (Vercel logs are fine for v1; Logflare or Axiom if more searchability is needed).
- **Error tracking:** Sentry on both the operator console and the rider PWA.
- **Database monitoring:** Whatever the managed Postgres provider gives you. No custom instrumentation in v1.
- **Uptime checks:** A simple external uptime monitor pinging the operator console and the rider PWA every minute.
- **The event log itself is observability** for the business logic. Every state transition is queryable, timestamped, and attributed.
- **Finance email observability:** The outbox table is the first-line operational view for finance document delivery state.

No analytics, no heatmaps, no user-behavior tracking in v1.

## 14. Security posture

- All traffic over HTTPS, enforced.
- Operator and rider sessions stored in HttpOnly, Secure, SameSite cookies.
- Merchant tokens are long, random, and signed; revocable from the operator console.
- Signed-in merchant workspace access is approval-gated even if token links still exist.
- Photos in object storage are accessed via short-lived signed URLs, not made public.
- The database is not exposed to the public internet — access is via the managed provider's pooler, with allow-listed IPs where supported.
- No PII stored beyond what the business actually needs (customer name, phone, address — nothing more).
- Backups encrypted at rest by the provider.
- No payment data ever in the system, by design (Decision 1 in the PRD).

This is the bar for v1. Penetration testing, formal security audits, and compliance certifications are post-v1 problems.

## 15. What is deliberately deferred

These are technical decisions and capabilities that some systems have on day one and Indek does not. Each is a deliberate exclusion, not an oversight.

- Microservices, message buses, event streaming infrastructure (Kafka, RabbitMQ, etc.)
- Separate read models or CQRS infrastructure
- A dedicated API layer separate from the Next.js app
- Real-time websockets or GraphQL subscriptions (polling is fine for v1)
- A native mobile build pipeline
- Multi-region deployment, read replicas, geo-distributed storage
- Feature flags infrastructure
- A/B testing framework
- Customer-facing analytics
- Payroll module or rider pay calculation
- Anything Kubernetes
- Anything that requires a DevOps engineer to operate

If any of these become necessary, they're earned by real load and real pain — not assumed at the start.

## 16. Document relationships

- The strategic framing lives in `docs/product/00-onepager.md`.
- The product contract lives in `docs/product/01-prd.md`.
- The domain model — bounded contexts, aggregates, state machines, invariants, schema-relevant decisions — lives in `docs/product/02-ddd.md`.
- The user-visible features and journeys live in `docs/product/03-ux.md`.
- Priority-ordered slices live in `docs/journeys.md`.
- Current implementation status lives in `docs/progress.md`.
- Implementation-level decisions — specific libraries, table schemas, API contracts, deployment scripts — live in code, not in this document.
