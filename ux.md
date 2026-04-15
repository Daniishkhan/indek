---
title: "Indek — UX & Feature Document"
version: "0.1"
status: draft
depends_on:
  - docs/product/00-onepager.md
  - docs/product/01-prd.md
scope: "Core features, surfaces, and user journeys for v1 — the things that turn into screens and code"
---

# Indek — UX & Feature Document

## 1. Purpose

This document is the bridge between the PRD and the code. It enumerates the features the product needs at v1, the surfaces those features live on, and the user journeys that thread them together. It is deliberately lean: nothing in here is a "nice to have." If a feature is described in this document, it ships in v1; if it isn't, it doesn't.

What this document does *not* do: specify pixel layouts, color systems, component libraries, or interaction micro-detail. Those decisions belong to the implementation phase. This document specifies *what* must be possible and *in what order the user does it*, not *what it looks like*.

## 2. Design principles

1. **One screen per decision.** The operator's day and the rider's day are made up of small decisions made under time pressure. Each screen should be built around one decision the user is making at that moment.
2. **No empty states without an action.** Every list, board, and queue surfaces the next thing to do.
3. **Tap counts matter on the rider side.** The rider is standing at a customer's door, sometimes in the heat, sometimes with the customer watching. The happy-path delivery should be completable in five taps or fewer.
4. **Reconciliation closes loops, not opens them.** End-of-shift screens don't ask the operator open-ended questions. They surface what doesn't match and force a decision (accept variance with reason, or fix the data).
5. **Read-only is a feature.** The merchant surface has no actions in v1. It exists to answer two questions — "where is my parcel?" and "where is my money?" — and nothing else.

## 3. The three surfaces

Indek has three distinct user surfaces, each with its own access pattern, device assumption, and information density.

- **Operator console.** A desktop-first web app. The operator sits at a laptop or tablet and runs the day. Information-dense; built for seeing the whole operation at once. Authenticated.
- **Rider PWA.** A mobile-first progressive web app installed on the rider's Android phone. Built for one-handed use, sunlight readability, and tolerating spotty connectivity. Authenticated via a simple sign-in tied to the rider's profile.
- **Merchant view.** A read-only hosted page reached via a link the operator sends over WhatsApp. No login. Two views only: parcel status and remittance statement. Each link is unguessable and scoped to one merchant.

## 4. Core user journeys

The product's whole reason to exist is to make seven journeys faster, safer, and more reconcilable than they are on WhatsApp + Excel. Everything else is supporting infrastructure for these.

### Journey 1 — Operator: take in a batch of orders from a merchant (daily)

A merchant sends the operator a WhatsApp message with the day's orders, or hands over a printed list, or shares a Google Sheet. The operator opens Indek, goes to the intake screen, picks the merchant from a dropdown, and either pastes the order rows or types them in one at a time. Each row becomes a parcel in the system: customer name, phone, address (free text + optional pin-drop link), COD amount, item description, optional notes. The operator hits "Create labels" and Indek generates QR-coded labels that the operator prints and sticks on the parcels. The orders are now in the system as unassigned parcels, grouped under that merchant.

This journey happens 3–10 times a day depending on how many merchants the operator works with. It needs to be fast — under 30 seconds per merchant batch for an experienced operator. The intake screen should accept paste from Excel and Google Sheets without configuration.

### Journey 2 — Operator: build and assign a shift manifest (daily)

With unassigned parcels in the system, the operator opens the dispatch board. The left side shows unassigned parcels grouped by merchant pickup location. The right side shows the rider roster with status (available, on shift, off duty). The operator picks a rider, then taps parcels (or drags them) into that rider's pending manifest. As parcels are added, the manifest preview shows total parcel count, total expected COD, the pickup locations the rider will need to visit, and a rough zone summary based on the delivery addresses. When the operator is satisfied, they hit "Assign" — the manifest moves to the rider's queue, and the rider gets a notification on their PWA.

The operator can build multiple manifests in parallel and assign them in any order. There is no automatic balancing in v1 — the operator's judgment is the routing engine.

### Journey 3 — Rider: start shift and pick up parcels

The rider opens the PWA and sees their assigned manifest waiting. They tap "Accept" and the shift starts — a timestamped event. The manifest screen shows the pickup locations they need to visit (one per merchant), each with the count of parcels to collect. The rider goes to the first pickup, taps the location, and arrives at a scanning screen. They scan each parcel's QR label one by one; the screen shows a running count of "scanned vs. expected." When all parcels at this pickup are scanned, the rider hits "Confirm pickup" and the parcels move into the rider's custody. The rider repeats for each pickup location on the manifest.

If a parcel is missing at pickup or the merchant has an extra one not in the manifest, the rider taps "Report mismatch" and notes it; ops resolves it asynchronously. The shift continues.

### Journey 4 — Rider: deliver a parcel (the workhorse)

This is the journey the rider runs 15–25 times a day. It must be tight.

The rider opens the manifest, sees the list of parcels in custody, and taps the next one to deliver. The parcel screen shows: customer name, customer phone (tappable to call), address (with a tap-to-open-in-Maps link if a pin is attached), COD amount, item summary, and any notes from the merchant. The rider hits "Arrived" when they reach the location. The arrival screen presents three primary actions: **Delivered**, **Failed**, **Partial**.

- **Delivered (happy path):** The rider taps Delivered, takes a photo (camera opens directly), enters the customer OTP if the merchant requires one, confirms the cash amount collected matches the expected COD, and hits Done. The parcel state moves to delivered, the cash ledger updates, and the rider returns to the manifest list.
- **Failed:** The rider taps Failed, picks a reason from a short list (customer not home, customer refused, wrong address, customer asked for reschedule, other), optionally takes a photo, and hits Done. The parcel enters the reattempt queue and the rider returns to the manifest list.
- **Partial:** The rider taps Partial, enters the actual cash collected, picks a variance reason (customer kept some items, exact-change shortfall, customer renegotiated, other), takes a photo, marks which items the customer kept versus returned, and hits Done. Indek splits the parcel into a delivered portion (with the adjusted COD) and a returned portion (which enters the RTO flow). The rider returns to the manifest list.

The happy-path delivery is five taps: tap parcel → tap Arrived → tap Delivered → take photo → confirm. Variance flows are longer because they have to be — but they're never the default and never block the happy path.

### Journey 5 — Operator: monitor the day in progress (passive)

The operator's main screen during the day is the live operations view. It shows each rider on a card with: their current shift status, parcels in custody, parcels delivered today, cash held (with per-merchant breakdown on tap), and the time since their last logged event. Cards highlight when something is off — a rider with no logged event for over 30 minutes, a manifest with more failed attempts than expected, a cash variance brewing.

The operator does not actively manage the day from this screen. They watch it, and they intervene only when something looks wrong. Intervention means: tapping a rider card to see detail, calling the rider on WhatsApp, or fixing a data issue from the parcel detail view.

### Journey 6 — Rider and operator: end-of-shift drop and reconciliation

When the rider has delivered or attempted everything on their manifest, they tap "End shift" in the PWA. The end-of-shift screen shows them their own summary: parcels delivered, parcels failed, parcels still in custody (which need to be returned), total cash collected per merchant. They hit "Ready to drop" — this notifies the operator that the rider is on the way back.

The rider arrives at the operator's location. The operator opens the rider's reconciliation screen on the desktop console. It shows two columns: **Expected** (what the system believes) and **Actual** (what the operator confirms in person).

- **Parcel reconciliation:** A list of parcels still in custody. The operator confirms each one is physically present (a tap per parcel, or a single bulk confirm if the count matches). Any parcel the system thinks is in custody but isn't physically there is flagged.
- **Cash reconciliation:** Total expected cash, broken down per merchant. The operator counts the cash the rider hands over and enters the actual total. If it matches, the shift can close. If it doesn't, the variance is highlighted in red and the operator must enter a reason code (rider float adjustment, cash short, cash over, counterfeit note, other) before the shift can close.

The operator hits "Close shift." The rider's shift ends, parcels still in custody are transferred to ops or back into the reattempt queue, and the cash ledger for that shift is locked.

### Journey 7 — Operator: generate and send merchant remittance (per cycle)

On the agreed cycle (typically weekly), the operator opens the remittance screen, picks a merchant, and sees a draft statement: every delivered parcel for the merchant in the period, the COD collected per parcel, the delivery fee and COD handling fee per parcel (with VAT broken out), and the net amount payable to the merchant. The operator reviews, hits "Finalize," and the system marks the statement as ready. The operator can download the statement as a PDF and share it with the merchant via WhatsApp, then record the actual payment (bank transfer, cheque, cash) outside the system and mark the statement as settled.

If there are disputed parcels in the period, the operator sees them flagged at the top of the draft. They can put a hold on disputed amounts, which removes them from the current statement; the held amount carries forward to the next cycle once the dispute resolves.

### Journey 8 — Operator: look up a parcel for a dispute (as needed)

A merchant or customer asks "what happened with parcel X?" The operator goes to the parcel search, finds the parcel, and sees the full event log: every state transition with timestamp, rider, geolocation, photo, and OTP. The log answers the question without further investigation. If the dispute is valid, the operator can flag the parcel and put a hold on the related remittance amount.

### Journey 9 — Merchant: check parcel status (passive)

The merchant taps the link the operator sent them in WhatsApp. A page opens showing all their active and recently completed parcels with status (unassigned, picked up, in transit, delivered, failed, returning, returned). The merchant can tap a parcel to see basic details and the delivery photo if one exists. There is no login, no search, no editing — just the list.

### Journey 10 — Merchant: review remittance statement (per cycle)

The merchant taps the remittance link the operator sent them in WhatsApp. A page opens showing the itemized statement: parcel-by-parcel collected COD, fees deducted, VAT, net payable. The merchant can download the PDF. There is no acceptance flow, no signature, no in-app dispute — disputes happen in WhatsApp and the operator handles them through the operator console.

## 5. Feature inventory by surface

Each feature below is in v1. Anything not on this list is not in v1.

### Operator console

- **Merchant management:** Create a merchant. Edit merchant agreement parameters (delivery fee, COD handling fee, remittance cycle, dispute window, default proof requirement, default reattempt limit, default RTO cost allocation rule). Deactivate a merchant.
- **Rider management:** Create a rider profile. Set the rider's PWA login. Mark a rider as active or inactive. View a rider's history.
- **Order intake:** Manual single-order entry. Batch entry by paste from Excel/Google Sheets. QR label generation with print view (one label per parcel, A4 sheet of labels for batch printing).
- **Dispatch board:** List of unassigned parcels grouped by merchant. List of riders with status. Build a manifest by tapping parcels into a rider's pending manifest. Manifest preview (count, expected COD, pickups, rough zone). Assign manifest to rider.
- **Live ops view:** Per-rider cards showing current state, parcels in custody, parcels delivered today, cash held, last event time. Anomaly highlighting.
- **Parcel detail and event log:** View any parcel's full state and complete event log with proof artifacts.
- **End-of-shift reconciliation:** Per-rider reconciliation screen with parcel and cash columns, variance highlighting, reason code entry, close-shift action.
- **RTO and reattempt queue:** List of failed parcels in the reattempt queue. After the configured attempt limit, parcels enter the return-to-merchant flow. Operator can override the attempt count, mark a parcel as returned to merchant, or escalate a parcel out of the queue.
- **Merchant remittance:** Draft statement view per merchant per cycle. Finalize and download as PDF. Mark as settled with payment method and reference. Hold disputed amounts.
- **Search and dispute lookup:** Find a parcel by AWB, customer phone, or merchant + date.

### Rider PWA

- **Sign in.** Simple sign-in tied to the rider profile. Persistent session.
- **Manifest acceptance.** See the assigned manifest, accept it, start the shift.
- **Pickup flow.** Visit each pickup location, scan parcels, confirm pickup, report mismatch.
- **Parcel list.** See all parcels currently in custody, sortable by manual order or grouped by area.
- **Delivery flow.** Per-parcel screen with customer details, arrival action, three primary outcomes (delivered, failed, partial), photo capture, OTP entry, cash confirmation, variance recording.
- **Failed attempt flow.** Reason code selection, optional photo, return to manifest list.
- **Partial delivery flow.** Cash entry, variance reason, item-level returned marking, photo, return to manifest list.
- **End-of-shift summary.** Self-view of the shift's outcomes, cash to drop per merchant, "Ready to drop" action.
- **Personal cash float view.** A small running total of the rider's own change-making float, separate from collected cash.

### Merchant view (link-based, read-only)

- **Parcel status list.** All parcels for this merchant, current state, last update timestamp, optional delivery photo.
- **Parcel detail.** Customer name (masked), state, full state history at a high level (without rider names or precise geolocation), delivery photo if available.
- **Remittance statement view.** Itemized statement per cycle, downloadable as PDF.

## 6. Cross-cutting concerns

### Notifications

Indek sends notifications at exactly three moments in v1:
- **To the rider PWA**, when a manifest is assigned to them. In-app notification, with a small audible cue if the PWA is open.
- **To the operator**, in-app, when a rider taps "Ready to drop" or when an anomaly threshold is crossed (no rider event for 30+ minutes, cash variance forming).
- **To the merchant**, via WhatsApp message generated from the operator console when the operator chooses to send a status link or a remittance statement. Indek generates the message text and the link; the operator sends it (manually copy-paste in v1, or via a WhatsApp send integration if available).

There is no email, no SMS, no push notifications outside the rider PWA in v1.

### Offline tolerance on the rider PWA

The rider PWA must be usable when connectivity drops, because UAE basements, parking lots, and elevators all kill 4G signal. The minimum offline behavior for v1:
- The current manifest and all parcel details are cached locally on shift start.
- Delivery, failed-attempt, and partial-delivery events captured offline are queued locally and synced when connectivity returns.
- Photos taken offline are stored locally and uploaded on reconnection.
- The rider sees a clear "offline — N events pending sync" indicator when offline, and a "synced" confirmation when reconnected.
- Cash ledger updates are computed locally from queued events so the rider always sees the right running total.

The operator console assumes connectivity. If it drops, the operator stops working until it returns. This is acceptable in v1.

### Time and timezone

Everything in the system runs on UAE time (Asia/Dubai, UTC+4). No multi-timezone support in v1.

### Accessibility

The rider PWA targets the lowest common denominator: budget Android, small screen, sometimes one-handed, sometimes in bright sunlight. High contrast, large tap targets, no hover-dependent interactions, minimal text.

## 7. Out of scope for v1

These are things people will ask for that are not in v1:

- Rider-to-rider custody transfer flow (deferred to v1.1; if it happens before then, it's a manual operator-mediated event)
- Multi-shift days for a single rider (one shift per rider per day in v1)
- Rider chat or messaging within the app
- Operator analytics dashboards beyond the live ops view
- Heatmaps, time-of-day analysis, rider performance scoring
- Customer-facing tracking
- Self-service merchant onboarding or merchant agreement editing
- Merchant-initiated disputes
- Anything requiring login for merchants
- Multi-language UI
- Native mobile apps
- Push notifications outside the PWA
- Bulk operations on the dispatch board (drag-multiple, etc.)
- Search and filter beyond the basic dispute lookup
- Rider payroll views or pay calculation
- Print views beyond QR labels and remittance PDFs
- Integration with Shopify, WooCommerce, accounting software, or anything else
- Any feature that requires Indek to hold, pool, or process funds

## 8. Document relationships

- The strategic framing lives in `docs/product/00-onepager.md`.
- The product contract — what's fixed, what's in scope, what the principles are — lives in `docs/product/01-prd.md`.
- The domain model — bounded contexts, aggregates, state machines, invariants — lives in `docs/product/02-ddd.md`.
- The technical architecture — stack, data flow, deployment, offline strategy — lives in `docs/product/04-tech.md`.
