# Indek — Epic Plan

## Purpose

This document turns the current product, UX, and technical docs into a practical build sequence.
It is not a replacement for the PRD. It is a recommendation for what to build first, what to defer, and how to reduce risk while getting the system into real operational use quickly.

## The main advice

Indek should be built around one proof point:

**Can one operator run one real shift end to end, reconcile every parcel and every dirham, and produce a merchant-ready remittance statement without falling back to WhatsApp and Excel?**

That is the first milestone that matters.

The biggest trap would be treating this like a generic logistics app and starting with dashboards, rider polish, notifications, or advanced merchant features. Your documents are very clear that the product's differentiator is:

1. Chain of custody
2. Cash reconciliation
3. Merchant remittance

Everything else supports those three things.

## Recommended build order

Build in this order:

1. Core domain and persistence spine
2. Operator intake and dispatch
3. Rider happy-path execution
4. End-of-shift reconciliation
5. Merchant remittance and merchant read-only view
6. Failed attempts, RTO, and dispute lookup
7. Offline tolerance and worker jobs

This order is intentional.

- Intake without reconciliation is just prettier data entry.
- Rider delivery without event logging is just another status app.
- Merchant views before remittance are optics, not substance.
- Offline support matters, but not before the core online loop is correct.

## Epics

### Epic 1 — Domain Spine and Event Log

**Goal:** create the load-bearing backend model before building lots of screens.

This epic should establish:

- merchants
- riders
- merchant agreements
- parcels
- manifests
- shifts
- event log
- remittance statements
- cash ledger model

It should also define the domain operations for:

- create parcels
- assign manifest
- accept manifest
- confirm pickup
- record delivered
- record failed attempt
- record partial delivery
- mark rider ready to drop
- reconcile shift
- generate remittance
- settle remittance

**Why first:** your docs make the event log non-negotiable. If the data model is weak, every later screen becomes rework.

**Deliverables:**

- real Postgres schema
- migrations
- typed DB access
- domain service layer
- transactional write pattern: aggregate update + event append in one transaction

**Success check:** every important state mutation can be expressed as a domain operation and produces an immutable event.

### Epic 2 — Operator Foundations

**Goal:** let ops create work and assign it without using spreadsheets.

This epic should cover:

- operator auth
- merchant management
- rider management
- merchant agreement setup
- batch intake by paste
- parcel creation
- QR / label generation
- dispatch board
- manifest assignment

**Why second:** if the operator cannot create clean manifests, the rider app cannot be meaningfully tested.

**Important constraint:** keep intake brutally simple. Paste-first is the right v1 shape.

**Success check:** an operator can create a merchant batch and assign a manifest to a rider in a few minutes.

### Epic 3 — Rider Happy Path

**Goal:** make the rider able to execute a real shift in the simplest possible online flow.

This epic should cover:

- rider sign-in
- assigned manifest view
- manifest acceptance
- pickup scan flow
- parcel list
- delivered flow with proof
- failed attempt flow
- partial delivery flow
- rider cash view
- ready-to-drop action

**Why third:** this is where the event log starts becoming valuable in production instead of just in theory.

**Important advice:** do not start with full offline support. Start online-only with very clear event creation and validation. Then layer offline support after the flows are correct.

**Success check:** one rider can complete a real shift and every parcel outcome appears correctly in the operator console.

### Epic 4 — Reconciliation and Cash Closure

**Goal:** prove the product thesis at shift end.

This epic should cover:

- rider return / ready-to-drop state
- operator reconciliation screen
- expected vs actual parcel accounting
- expected vs actual cash accounting
- variance reason codes
- shift close rules
- locked shift results
- audit trail of close and write-offs

**Why fourth:** this is the heart of the business problem. If this works, the product is already valuable.

**Important advice:** treat reconciliation as a hard workflow, not a soft report.

**Success check:** a shift can be closed only when accounted for, and unexplained variance is impossible.

### Epic 5 — Merchant Remittance and Merchant Visibility

**Goal:** turn internal operational truth into merchant trust.

This epic should cover:

- merchant token links
- merchant parcel status page
- remittance calculation
- draft remittance review
- dispute hold support
- PDF statement generation
- mark statement settled

**Why fifth:** merchant trust is one of the explicit product outcomes, but it should be powered by already-correct ops and ledger data.

**Success check:** the operator can generate a merchant statement from actual recorded deliveries and cash events.

### Epic 6 — Failed Deliveries, RTO, and Dispute Lookup

**Goal:** support the messy cases that make the product defensible.

This epic should cover:

- failed-attempt queue
- reattempt rules
- return-to-merchant lifecycle
- parcel search
- parcel event log view
- dispute lookup workflow

**Why sixth:** these flows are crucial, but they depend on the earlier event and reconciliation machinery.

**Success check:** the operator can answer “what happened to this parcel?” from the log without reconstructing the story manually.

### Epic 7 — Offline Tolerance and Background Work

**Goal:** make the rider app resilient in real-world field conditions.

This epic should cover:

- service worker
- IndexedDB manifest cache
- local offline event queue
- offline photo staging
- sync engine
- per-event sync results
- jobs table and worker process
- scheduled reattempt and remittance jobs

**Why seventh:** this is important, but it should stabilize a working system, not rescue an unproven one.

**Success check:** a rider can complete deliveries with weak connectivity and sync later without breaking the ledger or event history.

## Features to do first

If you want the shortest list of what to build first, it is this:

1. Postgres schema and migrations
2. Event log write model
3. Merchant and rider setup
4. Operator batch intake
5. Manifest assignment
6. Rider accept + pickup + delivered/failed/partial
7. End-of-shift reconciliation
8. Merchant remittance generation

That is the first real product.

## Features to explicitly defer

These should not be early priorities:

- real-time maps
- live GPS
- analytics dashboards
- Shopify or third-party integrations
- advanced notification systems
- native apps
- multi-tenant work
- AI parsing
- customer-facing tracking

They are either out of scope in your docs or lower leverage than the ledger and custody loop.

## Product advice

### 1. Treat reconciliation as the real hero feature

The temptation will be to think the rider delivery flow is the flagship. It is important, but the real differentiator is that the system closes the loop at shift end and produces defensible remittance data.

That is what replaces Excel.

### 2. Decide the v1 cash drop mechanism early

This is one of the few open decisions that can change both UX and data model.

You should pick one v1 default now rather than leave it abstract. My recommendation for v1 is:

- **In-person rider-to-operator handoff with operator-confirmed cash count and parcel handover**

Why:

- it is simplest operationally
- it is easiest to model
- it avoids introducing bank deposit complexity too early
- it keeps the proof and reconciliation event in one place

CDM deposit can come later if real operations demand it.

### 3. Keep the first rider version aggressively narrow

The rider app should feel almost like a rugged scanner plus proof logger, not a general mobile platform.

Prioritize:

- big buttons
- fast transitions
- minimum typing
- obvious online/offline state later

Do not overdesign it early.

### 4. Defer rider-to-rider transfer until the core loop is stable

Your docs mention custody transfer as important, but one UX document also defers rider-to-rider transfer to v1.1. That tension is a signal.

Recommendation:

- model custody transfer in the domain early
- defer the full rider-facing UX until after the base shift loop is working
- support it operator-mediated first if needed

### 5. Merchant agreement design matters more than it looks

Do not bury agreement details in free text if they drive system rules.

At minimum, model these as structured fields:

- proof requirement
- remittance cycle
- COD handling fee percent
- delivery fee
- dispute window
- reattempt limit
- RTO cost rule

Free text can sit alongside those fields, but should not replace them.

### 6. Make the event log visible early

Do not wait until “audit mode” later.

As soon as the first real parcel flows exist, make it possible for ops to open a parcel and see the full event history. That will keep domain design honest and make debugging much easier.

## Suggested implementation phases

### Phase 1 — Skeleton to real data

- add real database
- add migrations
- replace seed-only flows with real persistence
- build auth skeleton for operator and rider

### Phase 2 — First operational loop

- intake
- dispatch
- rider execution
- reconciliation

### Phase 3 — First financial trust loop

- remittance
- merchant status
- statement PDF

### Phase 4 — Hardening

- RTO
- disputes
- offline
- worker jobs

## Exit criteria for a meaningful v1

Indek is meaningfully alive when all of the following are true:

- an operator can intake and assign a real merchant batch
- a rider can execute a real shift on the phone
- every important action writes an immutable event
- the operator can reconcile shift cash and parcels
- a merchant remittance statement can be generated from recorded events
- the team can answer parcel disputes from the event log

If these are true, the product is already valuable even before all polish and edge cases are done.

## Final recommendation

Build the product from the inside out:

- first the truth model
- then the operator control loop
- then the rider execution loop
- then the reconciliation loop
- then the merchant trust loop

That sequence matches the actual promise of the product and gives you the fastest path to something load-bearing.
