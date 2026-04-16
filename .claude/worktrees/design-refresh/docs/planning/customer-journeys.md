# Indek — Customer Journeys and Build Features

## Purpose

This document translates the epic plan into user journeys and the concrete features that support them.

Use it to answer two questions:

1. What journeys must work for Indek to be valuable?
2. Which features should we build to make those journeys work?

This document is intentionally more execution-oriented than `epic.md`.

## Product lens

Indek is valuable when one operator can run one real shift from intake to remittance without losing parcel custody or cash visibility.

That means the journeys are prioritized around:

1. operator control
2. rider execution
3. shift reconciliation
4. merchant trust

## Priority order

Build the journeys in this order:

1. Operator creates work
2. Operator assigns work
3. Rider accepts and picks up
4. Rider records outcomes
5. Operator closes the shift
6. Operator generates merchant remittance
7. Operator resolves failed deliveries and disputes
8. Rider works reliably with weak connectivity

## Journey 1 — Operator creates work

### User story

A merchant sends an order batch over WhatsApp, spreadsheet, or copied text. The operator needs to turn that into clean parcels quickly without manual spreadsheet cleanup.

### Why it matters

If intake is slow or messy, everything downstream is already corrupted.

### Success outcome

An operator can create parcels for a merchant in minutes, with each parcel ready for assignment and label generation.

### Features to build

- operator authentication
- merchant setup
- merchant agreement fields
- manual parcel entry
- paste-based batch intake
- parcel validation
- unassigned parcel queue
- QR / label generation
- parcel created event logging

### Must-have rules

- each parcel must belong to one merchant
- each parcel must be clearly COD or prepaid
- parcel creation must write an event
- proof requirements must come from merchant agreement defaults

## Journey 2 — Operator assigns work

### User story

The operator needs to assign parcels to a rider as a shift manifest, while seeing parcel count, expected COD, and rider status.

### Why it matters

Without clear manifest assignment, custody starts in ambiguity.

### Success outcome

The operator can create and assign a manifest with confidence that the right parcels are moving to the right rider.

### Features to build

- rider management
- rider status view
- dispatch board
- manifest builder
- manifest preview
- expected COD calculation
- pickup grouping
- assign manifest action
- manifest assigned event logging

### Must-have rules

- a parcel cannot be assigned to more than one active manifest
- assignment must create manifest and parcel assignment events
- assigned work must become visible on the rider side immediately after assignment

## Journey 3 — Rider accepts and picks up

### User story

The rider opens the PWA, sees assigned work, accepts the manifest, and scans parcels into custody at pickup.

### Why it matters

This is the moment the system moves from planning into real operational custody.

### Success outcome

The rider can start shift, confirm pickup, and establish a trustworthy custody baseline.

### Features to build

- rider sign-in
- assigned manifest screen
- accept manifest action
- pickup location list
- parcel scan flow
- scanned vs expected count
- confirm pickup action
- pickup mismatch reporting
- manifest accepted event logging
- pickup confirmed event logging

### Must-have rules

- a rider cannot deliver parcels that were never picked up into custody
- pickup confirmation must be tied to manifest and rider
- mismatches must be recorded, not silently ignored

## Journey 4 — Rider records delivery outcomes

### User story

At the customer door, the rider needs the fastest possible flow to record what happened and what cash was actually collected.

### Why it matters

This is where custody, proof, and cash all meet.

### Success outcome

Every attempted stop becomes a valid event with proof and correct cash impact.

### Features to build

- parcel worklist
- parcel detail screen
- tap-to-call customer
- address / map link
- arrived action
- delivered flow
- failed attempt flow
- partial delivery flow
- proof capture
- OTP capture when required
- cash confirmation
- variance reason capture
- rider cash total view
- parcel outcome event logging
- cash ledger updates

### Must-have rules

- delivered status requires the configured proof
- actual collected cash must be stored separately from expected cash
- partial delivery must not overwrite original truth silently
- failed attempts must capture a reason

## Journey 5 — Operator closes the shift

### User story

The rider returns with cash and undelivered parcels. The operator needs to reconcile expected versus actual and close the shift without ambiguity.

### Why it matters

This is the core product promise.

### Success outcome

The operator can close a shift with zero ambiguity, zero silent variance, and a durable audit trail.

### Features to build

- ready-to-drop rider action
- operator reconciliation screen
- expected parcel list
- actual parcel confirmation
- expected cash summary
- actual cash entry
- variance calculation
- reason code requirement
- close shift action
- locked shift record
- shift close event logging

### Must-have rules

- unexplained variance cannot be closed
- parcels still in custody must be resolved before close
- operator is the only role allowed to finalize close
- write-offs must be explicit events

## Journey 6 — Operator generates merchant remittance

### User story

At the end of the remittance cycle, the operator needs to produce a clean merchant statement from actual recorded deliveries and collections.

### Why it matters

This is how operational truth becomes merchant trust.

### Success outcome

The operator can generate a merchant-ready statement that separates collected COD from fees and VAT.

### Features to build

- remittance cycle calculation
- draft remittance screen
- delivered parcel inclusion rules
- dispute hold support
- delivery fee calculation
- COD handling fee calculation
- VAT breakdown
- net payable calculation
- statement finalization
- PDF statement generation
- mark as settled action
- remittance events

### Must-have rules

- Indek never initiates payment
- pass-through COD and platform fees must be visibly separate
- disputed amounts must be holdable without corrupting the statement

## Journey 7 — Merchant checks status and statement

### User story

A merchant taps a WhatsApp link and wants a clear answer to “where are my parcels?” and “where is my money?”

### Why it matters

Merchant trust improves when the operator does not have to answer every basic status question manually.

### Success outcome

The merchant can self-serve parcel visibility and view remittance details without needing login.

### Features to build

- signed merchant token links
- merchant parcel status page
- parcel detail view with masked customer identity
- remittance statement page
- PDF download access

### Must-have rules

- merchant links must be scoped to one merchant
- merchant view must remain read-only
- sensitive rider details and exact geolocation should not be exposed

## Journey 8 — Operator handles failed deliveries and disputes

### User story

The operator needs to manage failed attempts, reattempts, returns, and parcel disputes without reconstructing history by memory.

### Why it matters

This is where the event log proves its value.

### Success outcome

The operator can answer what happened, what is next, and what money should be held or remitted.

### Features to build

- failed-attempt queue
- reattempt counter
- RTO transition rules
- return-to-merchant workflow
- parcel search
- parcel event log screen
- dispute flagging
- remittance hold linkage

### Must-have rules

- event history is append-only
- parcel disputes are answered from event history, not edited status
- reattempt and RTO states must stay consistent with custody state

## Journey 9 — Rider works with weak connectivity

### User story

A rider loses signal in a basement or parking area and still needs to continue work safely without losing records.

### Why it matters

The rider environment is operationally hostile to always-online assumptions.

### Success outcome

The rider can continue recording work and sync later without breaking trust in the ledger.

### Features to build

- service worker
- manifest cache
- parcel cache
- offline event queue
- offline photo staging
- sync retry
- per-event sync result handling
- online/offline indicator
- pending sync count

### Must-have rules

- offline events must preserve timestamp and intended action
- sync failures must be visible
- the server must validate replayed events safely

## Features by build phase

## Phase 1 — Foundations

- real database
- migrations
- merchant model
- rider model
- merchant agreement model
- parcel model
- manifest model
- event log model
- auth skeleton

## Phase 2 — First operational loop

- intake
- dispatch board
- manifest assignment
- rider accept
- pickup scan
- delivered / failed / partial flows
- rider cash view

## Phase 3 — Core product promise

- ready-to-drop
- reconciliation screen
- variance handling
- shift close
- audit trail visibility

## Phase 4 — Merchant trust

- remittance calculation
- remittance PDF
- merchant token pages
- statement settlement

## Phase 5 — Hard cases and resilience

- RTO queue
- dispute lookup
- offline queue
- background jobs

## What not to build early

- live GPS
- route optimization
- customer tracking
- analytics dashboards
- deep notification systems
- third-party commerce integrations
- AI intake parsing
- multi-tenant onboarding
- native apps

## Final recommendation

The first version of Indek should be judged by one operational demo:

1. intake a merchant batch
2. assign a rider
3. pick up parcels
4. complete a few deliveries including one failed or partial
5. reconcile the rider at shift end
6. generate the merchant remittance statement

If that works with real data, the product has started becoming useful.
