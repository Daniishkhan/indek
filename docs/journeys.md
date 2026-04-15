---
title: "Indek — Journeys and Slices"
version: "0.1"
status: active
depends_on:
  - docs/product/00-onepager.md
  - docs/product/01-prd.md
  - docs/product/02-ddd.md
  - docs/product/03-ux.md
  - docs/product/04-tech.md
scope: "Priority-ordered functional slices used to decide what to build next"
---

# Indek — Journeys and Slices

## Purpose

This is the source-of-truth document for what we build next and in what order.

If we need to choose work, we choose from this file.
If we need to mark status, we update `docs/progress.md`.

## How to use it

- Work from top to bottom unless there is a hard dependency or blocker.
- Treat each slice as a Linear-sized workstream that can be broken into smaller implementation tasks.
- Only mark a slice complete in `docs/progress.md` when the flow works end to end and is not just scaffolded.

## Current Build Order

For the current phase, work in this order:

1. `S2` Request review and merchant follow-up
2. `S5` Reconciliation and close shift
3. `S8` Finance module shell
4. `S9` Remittance workflow
5. `S10` Billing invoice workflow
6. `S11` Finance email workflow
7. `S6` Merchant registration and approval
8. `S7` Rider access administration

## Priority Order

| ID    | Slice                                 | Why it matters next                                                                                |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `S1`  | Intake and request capture            | Work has to enter the system cleanly before anything else matters.                                 |
| `S2`  | Request review and merchant follow-up | Every request needs an operator decision before it becomes rider work.                             |
| `S3`  | Dispatch and manifest assignment      | Custody starts here.                                                                               |
| `S4`  | Rider execution basics                | The product is not real until riders can move parcels through outcomes.                            |
| `S5`  | Reconciliation and close shift        | This is the core money-control loop.                                                               |
| `S6`  | Merchant registration and approval    | Merchant signed-in access needs a real approval gate.                                              |
| `S7`  | Rider access administration           | Rider access must be explicitly admin-controlled.                                                  |
| `S8`  | Finance module shell                  | Admin needs one money hub instead of scattered screens.                                            |
| `S9`  | Remittance workflow                   | Merchant trust depends on statement generation and settlement.                                     |
| `S10` | Billing invoice workflow              | Operators also need the merchant-owes-us side of the ledger.                                       |
| `S11` | Finance email workflow                | Finance documents need durable delivery and retry history.                                         |
| `S12` | Disputes and finance holds            | Money workflows need hold logic before they are production-safe.                                   |
| `S13` | Pickup scan and partial delivery      | The field workflow still needs the messy real-world cases.                                         |
| `S14` | Offline rider sync                    | Important, but it should stabilize a correct online workflow rather than rescue an unfinished one. |

## Slice Definitions

### `S1` Intake and request capture

**Goal:** let operators and merchants create real parcel requests without spreadsheets being the system of record.

**Includes:**

- merchant request entry
- operator fallback intake
- pickup and dropoff details
- route-aware average shipping charge estimate
- unassigned parcel queue

**Done when:** requests can be created reliably and show up in the operator queue with the right merchant, COD, and address details.

### `S2` Request review and merchant follow-up

**Goal:** make the operator review every merchant request before it becomes rider work.

**Includes:**

- request review queue
- basic due-diligence checklist
- approve-for-dispatch decision
- request return or hold decision
- simple operator follow-up message to the merchant

**Done when:** every new request can be reviewed by an operator and either moved forward to dispatch or returned to the merchant with a clear follow-up message.

### `S3` Dispatch and manifest assignment

**Goal:** convert unassigned requests into real rider work.

**Includes:**

- rider roster
- dispatch board
- manifest builder
- assign action
- assigned parcel state

**Done when:** the operator can assign parcels to a rider and the rider sees that assignment immediately.

### `S4` Rider execution basics

**Goal:** let a rider accept work and record basic delivery outcomes.

**Includes:**

- manifest acceptance
- in-transit state
- delivered action
- failed action
- basic rider worklist

**Done when:** rider actions update operator and merchant views from the same live data.

### `S5` Reconciliation and close shift

**Goal:** let the operator close the day with parcel and cash truth aligned.

**Includes:**

- ready-to-drop flow
- expected vs actual parcel counts
- expected vs actual cash counts
- rider cash handover recording
- variance reason codes
- shift close and lock

**Done when:** a shift can be closed only with zero ambiguity or an explicit operator write-off.

### `S6` Merchant registration and approval

**Goal:** let merchants register, but keep signed-in merchant access behind admin approval.

**Includes:**

- merchant sign-up
- `pending_approval`, `approved`, `rejected`, `suspended` states
- approval queue
- approved merchant workspace gating

**Done when:** a merchant can register, stay blocked pending review, and gain signed-in access only after operator approval.

### `S7` Rider access administration

**Goal:** make rider access explicitly admin-managed.

**Includes:**

- rider access creation
- rider access deactivation
- rider access removal
- rider self-signup remaining unsupported

**Done when:** every rider who can use the rider app has been created or enabled by an operator.

### `S8` Finance module shell

**Goal:** give the operator one money hub in the admin panel.

**Includes:**

- `/operator/finance/*`
- reconciliation section
- COD drop section
- remittances section
- billing invoices section
- tax review section
- CSV exports section
- email outbox/history section

**Done when:** the operator can enter one finance area and navigate all money workflows from there.

### `S9` Remittance workflow

**Goal:** generate, finalize, send, and settle merchant remittance statements.

**Includes:**

- remittance drafts
- route-aware fee calculation
- VAT and tax separation
- finalize action
- send action
- CSV export
- settled state

**Done when:** the operator can move a remittance statement from draft to sent to settled using delivery and cash truth.

### `S10` Billing invoice workflow

**Goal:** generate and manage merchant billing invoices that are separate from remittance.

**Includes:**

- invoice drafts
- route-aware line items
- tax breakdown
- issued state
- sent state
- CSV export
- paid state
- void state

**Done when:** the operator can bill a merchant for service charges without mixing that document into remittance.

### `S11` Finance email workflow

**Goal:** make finance document delivery durable and visible.

**Includes:**

- approval notices
- remittance emails
- billing invoice emails
- outbox states `queued`, `sent`, `failed`
- retry flow

**Done when:** the operator can see whether a finance email was sent successfully and retry failed sends.

### `S12` Disputes and finance holds

**Goal:** keep finance documents safe when parcel outcomes or merchant charges are disputed.

**Includes:**

- dispute flags
- remittance holds
- finance linkage back to parcel history

**Done when:** disputed amounts can be held cleanly without corrupting remittance or invoice state.

### `S13` Pickup scan and partial delivery

**Goal:** support the real field workflow beyond the simplest happy path.

**Includes:**

- pickup scan confirmation
- pickup mismatch reporting
- partial delivery flow
- actual vs expected COD variance at the door

**Done when:** the rider can handle pickup and partials without pushing the operator back into manual notes and ad hoc follow-up.

### `S14` Offline rider sync

**Goal:** let rider execution survive bad connectivity without losing trust in the ledger.

**Includes:**

- cached manifest data
- offline event queue
- offline photo staging
- sync status and retry

**Done when:** a rider can keep working through signal loss and sync safely later.
