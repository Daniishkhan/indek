---
title: "Indek — Domain Model Document"
version: "0.2"
status: draft
depends_on:
  - docs/product/00-onepager.md
  - docs/product/01-prd.md
scope: "Bounded contexts, aggregates, invariants, state machines, and event semantics"
---

# Indek — Domain Model Document

## 1. Purpose

This document turns the product contract into a lightweight domain outline that is concrete enough to guide the next implementation session.

It is intentionally not a full schema spec. Its job is to lock the bounded areas, core aggregates, and state transitions that the code should honor next.

## 2. Bounded Areas

Indek is organized around four bounded areas for the next phase.

### Access and approval

This area governs who can enter the system and what state that access is in.

Key concerns:

- user role
- merchant account approval
- rider access lifecycle
- operator-admin permissions

### Operations and delivery

This area covers intake, assignment, manifest execution, parcel states, rider custody, and delivery outcomes.

Key concerns:

- merchant intake and request creation
- request review and dispatch decision
- parcel lifecycle
- manifest lifecycle
- rider execution events
- reconciliation inputs

### Finance

This area turns recorded delivery and cash truth into operator-facing money workflows.

Key concerns:

- rider reconciliation
- COD drop and cash handover recording
- route-aware fee calculation
- tax and VAT treatment
- merchant remittance statements
- merchant billing invoices
- CSV finance exports
- settlement and paid-state recording

### Communications and outbox

This area governs durable outbound transactional communication.

Key concerns:

- request follow-up messages
- approval notices
- remittance emails
- billing invoice emails
- send status and resend behavior

## 3. Roles and Access States

### Roles

The only roles in scope are:

- `operator`
- `merchant`
- `rider`

No `writer` role exists.

### Merchant account approval states

Merchant access is explicitly approval-gated.

- `pending_approval`
  Merchant registered, but cannot use the signed-in merchant workspace yet.
- `approved`
  Merchant can enter the signed-in workspace and receive finance documents.
- `rejected`
  Merchant registration was declined and cannot proceed until reviewed again.
- `suspended`
  Merchant previously had access but is temporarily blocked by the operator.

### Rider account lifecycle

Rider access is operator-admin controlled only.

Lifecycle:

- created
- active
- inactive
- removed

Rules:

- riders do not self-register
- only an operator can create, deactivate, reactivate, or remove rider access
- rider access state is separate from rider shift status

## 4. Core Aggregates

### Merchant account

Represents the identity and access state of a merchant user inside the current tenant.

Owns:

- linked user identity
- approval state
- approval timestamps and reviewer attribution
- relationship to one merchant business record

### Merchant business record

Represents the commercial relationship with the courier business.

Owns:

- merchant agreement defaults
- delivery fee and COD handling fee rules
- route or zone charge rules
- tax defaults
- remittance cycle
- proof requirements
- token link access

### Rider account

Represents a rider’s authenticated system access.

Owns:

- linked user identity
- admin-controlled access state
- relationship to one rider operational profile

### Parcel

Represents one delivery request moving through custody and outcome states.

Owns:

- merchant association
- delivery and pickup details
- COD expectation
- request review state
- current parcel state
- latest merchant follow-up requirement if one exists
- references to the manifest and rider currently responsible

### Manifest

Represents a rider assignment unit for a set of parcels.

Owns:

- assigned rider
- parcel set
- assignment and acceptance state
- pickup grouping context

### Reconciliation record

Represents the operator’s close-the-loop view for a rider’s expected versus actual custody and cash.

Owns:

- expected parcel and cash totals
- actual counted totals
- variance
- variance reason if needed
- rider cash handover record
- close/lock status

### Finance export

Represents one generated CSV or tabular export from the finance module.

Owns:

- export type
- filter scope
- generated rows or file reference
- generation timestamp

### Remittance statement

Represents money owed by the operator to the merchant from pass-through COD cash after fees and VAT treatment.

Owns:

- statement period
- included delivery and cash lines
- fee and VAT breakdown
- net payable
- lifecycle state
- settlement reference

Lifecycle:

- `draft`
- `finalized`
- `sent`
- `settled`

### Billing invoice

Represents money owed by the merchant to the operator for courier services and related charges.

Owns:

- invoice period or billing basis
- billable line items
- issue total
- lifecycle state
- payment reference

Lifecycle:

- `draft`
- `issued`
- `sent`
- `paid`
- `void`

### Email outbox item

Represents one durable transactional email attempt tied to a business document or account event.

Owns:

- email type
- recipient
- related document or approval record
- provider response metadata
- send lifecycle

Lifecycle:

- `queued`
- `sent`
- `failed`

## 5. Shared Rules and Invariants

These rules cut across aggregates and must stay true in both docs and code.

1. Reconciliation, remittance, and billing all read from the same recorded delivery and cash truth.
   There is no separate finance spreadsheet or manually entered money ledger inside the product model, and CSV exports must be derived from the same source.
2. Indek never holds funds.
   Finance aggregates describe obligations, statements, and recorded settlement references, not wallet balances controlled by the platform.
3. Merchant approval gates signed-in merchant access, not token existence.
   Token-based merchant links may continue to exist, but approved signed-in merchant access is a separate capability.
4. Rider access control is an admin concern, not a rider concern.
   A rider can work only if an operator has created and left their access active.
5. Every new merchant request is reviewed by an operator before dispatch.
   A request can move forward to dispatch only after operator review, or it can stay blocked awaiting merchant clarification.
6. Remittance and billing are separate finance documents.
   Remittance answers “what the operator owes the merchant”; billing answers “what the merchant owes the operator.”
7. Email send state is durable.
   The UI must be able to show whether a finance document email was queued, sent, or failed.

## 6. Domain Events to Expect Next

The next implementation session should assume these event families exist or will exist:

- `request.submitted`
- `request.reviewed`
- `request.needs_clarification`
- `request.approved_for_dispatch`
- `merchant.registered`
- `merchant.approved`
- `merchant.rejected`
- `merchant.suspended`
- `rider.access_created`
- `rider.access_deactivated`
- `rider.access_removed`
- `reconciliation.cash_dropped`
- `reconciliation.finalized`
- `remittance.finalized`
- `remittance.sent`
- `remittance.settled`
- `invoice.issued`
- `invoice.sent`
- `invoice.paid`
- `invoice.voided`
- `email.queued`
- `email.sent`
- `email.failed`
- `export.generated`

## 7. Next-Session Modeling Defaults

To keep the next build decision-complete, assume these defaults:

- operator-admin is the only actor that can approve merchants or manage rider access
- merchant registration is public within the current single-tenant product instance
- merchant request entry is the primary intake path in v1
- request follow-up is request-scoped messaging, not a general chat system
- WhatsApp is out of the current v1 product workflow
- finance documents live inside the operator app under a single finance module
- remittance documents and invoices can each generate email outbox items
- communications/outbox is a durability layer, not just a fire-and-forget provider call
