---
title: "Indek — Progress"
version: "0.1"
status: active
depends_on:
  - docs/journeys.md
  - docs/product/01-prd.md
  - docs/product/02-ddd.md
  - docs/product/03-ux.md
  - docs/product/04-tech.md
scope: "Current project status and slice tracker"
---

# Indek — Progress

## Purpose

This is the current-state tracker for the project.

Use `docs/journeys.md` to choose work.
Use this file to record what is done, what is partial, and what is next.

## Working Rules

- Take new implementation work from `docs/journeys.md`.
- Keep slice IDs the same between both documents.
- Mark a slice complete only when the flow works end to end, not when a screen or route exists in isolation.

## Current Snapshot

### What works locally today

- Local Postgres-backed request-to-delivery slice is live.
- Role-specific routes exist for `operator`, `merchant`, and `rider`.
- Operator can create merchants and riders, intake orders, and assign manifests.
- Merchant token portal can create delivery requests and show active and recent parcel status.
- Request entry captures pickup and dropoff details and shows a route-aware average shipping charge before submit.
- Operator sees new delivery requests as in-app alerts and can assign them from dispatch.
- Merchant-submitted requests now land in an operator review queue before dispatch.
- Operator review records due-diligence checklist state, can approve for dispatch, send merchant follow-up, or hold a request.
- Operator sets a per-order delivery fee during review (replaces flat merchant-level rate).
- Merchant follow-up is now request-scoped and durable, and merchant edits return the request to review instead of bypassing ops.
- Rider can accept a manifest and resolve parcels as `delivered` or `failed`.
- Shared app shell/navigation exists across operator, merchant, rider, and merchant token surfaces.
- Husky and repo checks are in place.
- Merchant self-signup at `/sign-up/merchant` with post-signup onboarding (company name).
- Merchant dashboard (`/merchant`) shows KPI cards, status funnel chart, COD vs fees chart, and remittance visibility. Empty state with CTA when no parcels exist.
- Merchant settings route (`/merchant/settings`) for profile and platform defaults.
- Unified sidebar navigation across `/merchant` and `/m/[token]` routes via shared `merchant-nav.ts`.
- Orders route (`/m/[token]/orders`) combines single order form and bulk CSV upload with client-side parsing, validation, and preview.
- Tracking route (`/m/[token]/tracking`) with search by AWB/customer/phone/area and state filter chips.
- Finance module (`/m/[token]/finance`) with per-order fee breakdown table, search/filter, KPI cards (net payable, COD collected, pending collection, fees & VAT), fee structure sidebar, and CSV statement export.
- Fulfillment setup on request portal: rider pickup vs merchant drop-off at hub. Pickup address pre-fills into order creation.
- Per-order delivery fee: operator assigns fee during review, stored on parcel, flows into remittance calculation. Approve button requires fee + full checklist.

### What is still partial or missing

- Merchant signed-in access is not gated by admin approval state yet (self-signup works but no pending/approved/rejected flow).
- Rider access is not modeled as a real admin-controlled lifecycle yet.
- Reconciliation is still mostly a placeholder workflow.
- Merchant finance module exists for visibility (read-only statements, CSV export) but not yet a full operator-driven remittance workflow (no settlement tracking, payment confirmation, or historical cycles).
- Remittance is still computed on-the-fly from delivered parcels — no persisted statement history or cycle close.
- Billing invoices do not exist yet.
- Finance email sending and outbox history do not exist yet.
- Pickup scan, partial delivery, dispute holds, and offline sync are still future work.

## Locked Decisions

- `writer` was a typo for `rider`; no writer role exists.
- Roles remain `operator | merchant | rider`.
- Merchant request entry is the default intake path in v1.
- Every merchant request should go through operator review before dispatch.
- Operator response to a bad or incomplete request is a simple merchant follow-up message, not a chat workflow.
- There is no WhatsApp integration in the current v1 plan.
- Operator notifications for new requests are in-app, not WhatsApp.
- The admin finance section is a first-class module, not a reporting afterthought.
- Finance must cover rider cash drop, COD reconciliation, route-aware charges, taxes, and CSV exports.
- Merchant access states are `pending_approval | approved | rejected | suspended`.
- Riders are admin-managed only and do not self-register.
- Finance is admin-only in this phase.
- Finance includes reconciliation, remittance, billing invoices, and email outbox/history.
- Remittance and billing invoices are separate artifacts.
- Billing means merchant service billing, not SaaS subscription billing.
- Indek never holds, pools, or processes funds.

## Slice Tracker

- [x] `S1` Intake and request capture
- [x] `S2` Request review and merchant follow-up (includes per-order delivery fee assignment)
- [x] `S3` Dispatch and manifest assignment
- [x] `S4` Rider execution basics
- [ ] `S5` Reconciliation and close shift
- [x] `S6` Merchant registration and approval (self-signup + onboarding done; admin approval gating not yet)
- [ ] `S7` Rider access administration
- [x] `S8` Finance module shell (merchant-facing: KPIs, per-order breakdown, search/filter, CSV export)
- [ ] `S9` Remittance workflow (operator-driven cycle close, settlement tracking)
- [ ] `S10` Billing invoice workflow
- [ ] `S11` Finance email workflow
- [ ] `S12` Disputes and finance holds
- [ ] `S13` Pickup scan and partial delivery
- [ ] `S14` Offline rider sync
- [x] `S15` Merchant UX — bulk CSV order upload
- [x] `S16` Merchant UX — dedicated tracking route with search and filters
- [x] `S17` Merchant UX — fulfillment setup (rider pickup vs drop-off)

## Next Up

Build these next, in order:

1. `S5` Reconciliation and close shift
2. `S6` Merchant admin approval gating (pending/approved/rejected/suspended lifecycle)
3. `S9` Remittance workflow (operator-driven cycle close, persisted statements, settlement tracking)
4. `S10` Billing invoice workflow
5. `S11` Finance email workflow

## Not Now

Keep these out of the immediate cycle:

- payroll or rider salary calculation
- wallets, payment links, pooled funds, or instant payouts
- marketing email or CRM workflows
- live maps or GPS tracking
- multi-tenant SaaS onboarding or subscription billing
- deep analytics or BI dashboards
- third-party commerce/accounting integrations
