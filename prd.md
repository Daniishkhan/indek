---
title: "Indek — Product Requirements Document"
version: "0.1"
status: draft
depends_on:
  - docs/product/00-onepager.md
scope: "High-level product contract, MVP scope, user roles, and business decisions"
---

# Indek — Product Requirements Document

## 1. Purpose

This document is the business contract for Indek v1. It decides who the product is for, what it must do, what it explicitly will not do, and which decisions are fixed and not up for re-litigation during implementation.

It is not the place for domain modeling (aggregates, state machines, invariants — those live in `02-ddd.md`), screen-by-screen workflows (those live in `03-ux.md`), or technology choices (those live in `04-tech.md`). When in doubt, this document answers "what are we building and what are we deliberately not building," and the downstream documents answer "how."

- **Who it is for:** Small UAE courier operators (3–20 home-based riders) running multi-merchant cash-on-delivery parcel delivery, currently operating on WhatsApp and Excel.
- **What it solves:** Cash leakage, dispute losses, ops time cost, and remittance trust erosion — the four failure modes that prevent these operators from scaling past their tenth rider.
- **What is in scope:** Chain of custody, cash reconciliation, RTO management, merchant remittance generation, and the operator-rider dispatch loop.
- **What is fixed:** Indek never holds funds. Indek is internal-first. Indek is PWA-only and English-only at v1. WhatsApp remains the customer- and merchant-facing notification channel.

## 2. Product goal

Indek makes every parcel and every dirham reconcile at the end of every shift, for a small UAE courier running multi-merchant COD with home-based riders, without ever sitting in the path of the money. The operator should be able to close the day in minutes instead of hours, defend any dispute with an event log, and remit to merchants on a predictable cycle with VAT correctly separated from pass-through cash.

- Replace the WhatsApp-and-Excel dispatch loop with a single ops control plane for assignment, status, and reconciliation.
- Make COD cash a first-class object with a per-rider, per-merchant ledger that closes to zero (or to an explicitly justified variance) at every shift end.
- Make every parcel state transition — including the messy ones (partial delivery, concierge handoff, rider-to-rider transfer, return-to-merchant) — an immutable event with rider, time, place, and proof.
- Survive the operational doubling of the fleet from 5 to 10 riders without a corresponding increase in ops headcount or a slip in merchant trust.

## 3. Primary users

### Operator (founder, ops lead)

The owner-operator or their ops person. Runs intake, dispatch, reconciliation, and merchant remittance. Currently lives in three WhatsApp groups and a Google Sheet, ends every day reconciling yesterday.

- **Needs:** Fast intake of merchant order batches; visual dispatch board showing rider availability and load; live view of cash held per rider per merchant; one-screen end-of-shift reconciliation; clean merchant remittance statements; defensible dispute evidence.
- **Authority or risk-sensitive actions:** Assigning manifests to riders; closing shifts; writing off cash variance with reason codes; generating and sending merchant remittance; resolving disputes; deactivating riders. The operator is the only role that can write off variance or override a custody event.

### Rider

A home-based delivery rider on a company-sponsored employment visa, riding a 150cc+ motorcycle with a fixed delivery box. Picks up parcels from multiple merchants in a shift, delivers them across the city, collects COD cash, and hands cash + undelivered parcels back to ops at end of shift. Smartphone literacy is variable; English fluency is variable.

- **Needs:** A simple PWA that works on a budget Android phone, tolerates spotty connectivity, requires few taps per delivery, and gives the rider a live view of their own cash float and parcels in custody.
- **Authority or risk-sensitive actions:** Marking a delivery as completed (with proof), recording variance at the door (partial acceptance, exact-change shortfall, customer renegotiation), recording a failed attempt with reason, accepting a custody transfer from another rider, dropping cash and parcels back to the operator. Riders cannot edit history, cannot override variance reasons after the fact, and cannot mark a delivery as complete without the required proof artifact.

### Merchant

A small UAE business — Instagram boutique, home baker, perfume seller, pharmacy, small e-commerce store — handing 5 to 100 parcels a week to the operator. Sends orders via WhatsApp, Google Sheet, or occasionally a Shopify export. Wants live status visibility and predictable, itemized remittance.

- **Needs:** A read-only status view per parcel (accessible via a link sent over WhatsApp); a running view of accumulating COD owed; a clean remittance statement on the agreed cycle; clear separation of delivery fees and COD pass-through cash for their own VAT records.
- **Authority or risk-sensitive actions:** None in v1. Merchants are read-only consumers of status and remittance information. Merchant onboarding, agreement configuration, and dispute initiation are operator-mediated in v1.

## 4. Product principles

1. **Cash and custody are first-class, not fields.** Every screen, every event, every aggregate in the system is built around the idea that a parcel and a dirham are the things being tracked — not a "shipment record" with cash as an attribute.
2. **Nothing closes until it reconciles.** A shift cannot close with parcels still in custody or cash variance unexplained. The system refuses ambiguity by default; the operator can override, but the override is itself an event with a reason.
3. **The event log is the source of truth.** No status is real unless it has an event behind it. Disputes are queries against the log, not arguments about who remembers what.
4. **Indek records money; it never holds money.** Cash flows physically from rider to operator to bank to merchant. Indek logs every step but is never an account, a wallet, or a holder of funds. This principle is what makes the product legal in the UAE without a Central Bank licence, and it overrides every feature request that would compromise it.
5. **WhatsApp stays for talking; Indek handles the work.** The product replaces WhatsApp in the operator-rider critical path (assignment, status, cash, proof). It does not try to replace WhatsApp as the merchant- and customer-facing notification channel — it sends notifications through it.
6. **Build for the tenth rider, not the third.** Every workflow is designed to survive a doubling of fleet size without a doubling of ops effort. If a feature only works at three riders, it does not ship.

## 5. Fixed product decisions

### Decision 1: Indek never holds, pools, or processes funds

- **What is fixed:** No digital wallet, no holding account, no instant remittance, no rider top-ups, no merchant escrow, no card processing, no payment links. Indek records cash movements that happen physically and through the operator's existing bank account; it is never in the funds flow itself.
- **Why it is fixed:** The CBUAE Retail Payment Services and Card Schemes regulation defines "Payment Aggregation Service" as facilitating merchants to accept payments, pooling them, and transferring them after a time period — which describes a courier operation almost exactly. Stored Value Facility licensing has its own thresholds. Indek is shippable as a logistics SaaS tool; it is not shippable as an unlicensed payment platform.
- **Tradeoff it creates:** Indek cannot offer "pay your rider instantly" or "advance the merchant their COD" features that would be commercially appealing. Every feature request that smells like a financial product gets tested against this constraint and most will fail it.

### Decision 2: Internal-first, single tenant at launch

- **What is fixed:** v1 is built and validated against exactly one courier operation — the team building it. The architecture is designed to be multi-tenant later, but v1 ships as a single-tenant deployment with no onboarding flow, no billing, no tenant isolation work.
- **Why it is fixed:** The team building Indek is also the first customer. This is the fastest path to validation and the only way to know whether the model survives contact with real riders, real merchants, and real cash. A second tenant is a v2 problem.
- **Tradeoff it creates:** Some assumptions baked into v1 will turn out to be specific to the founding operator and will need rework before a second tenant can be onboarded. This is acceptable — and surfacing those assumptions is one of the goals of v1.

### Decision 3: PWA only, English only, no native apps

- **What is fixed:** The rider client is a Progressive Web App. No iOS or Android native build at v1. UI is English only.
- **Why it is fixed:** PWA is fast to build, fast to update, and works well enough on a budget Android with offline-tolerant design. The rider workforce is predominantly South Asian and works in English; the social-commerce merchant base is predominantly English-using. Arabic is a v2 problem that arrives with the first Emirati-merchant-heavy operator.
- **Tradeoff it creates:** Some rider UX patterns that would be easier with native APIs (background sync, push notifications, camera control) will be more constrained. Capacitor remains the escape hatch if PWA limits become blockers.

### Decision 4: WhatsApp is a notification channel, not a competitor

- **What is fixed:** Indek generates merchant and customer notifications and delivers them through WhatsApp (via a sending integration in v1, manual link-share if integration isn't ready). The merchant status view is a hosted page reached via a link in a WhatsApp message. Indek does not try to move merchants or customers off WhatsApp.
- **Why it is fixed:** 80% of small businesses in the region use WhatsApp as primary infrastructure. Trying to move merchants to a portal is an adoption fight Indek will lose.
- **Tradeoff it creates:** Indek's "single ops control plane replacing WhatsApp" promise is bounded — it replaces WhatsApp in the operator-rider critical path, not everywhere.

### Decision 5: Multi-merchant pooling and home-based riders are the assumed model

- **What is fixed:** Riders carry parcels for many merchants in a single shift. There is no depot. The rider's day starts and ends wherever they are. Cash is pooled in the rider's bag but reconciled per merchant. The shift manifest is the unit of assignment.
- **Why it is fixed:** This is the reality of the target customer. A platform that assumes single-shipper or assumes a depot is solving a different problem.
- **Tradeoff it creates:** The data model is more complex than a single-shipper system. Per-merchant sub-ledgers, multi-pickup manifests, and merchant agreement variability all become first-class concerns from day one.

### Decision 6: Flat, per-merchant pricing — no dynamic or per-kilometer charges

- **What is fixed:** Each merchant agreement carries flat rates: per-parcel delivery fee, COD handling fee (typically 5–10% of order value), optional surcharges for cross-emirate or oversized parcels. These are configured manually per merchant and applied automatically at billing time. No distance-based pricing, no surge pricing, no zone-based rules.
- **Why it is fixed:** Flat pricing matches how small operators actually quote merchants today. Dynamic pricing requires routing, distance calculations, and rate cards Indek is not building in v1.
- **Tradeoff it creates:** Operators cannot use Indek to optimize their pricing. Merchant agreements that already have complex rate structures will need to be flattened to fit the model.

### Decision 7: Route optimization, live GPS, and customer-facing tracking are out of v1

- **What is fixed:** No routing engine, no live GPS streaming, no customer tracking portal. The dispatch board shows rider status (available, on-shift, returning) and assigned manifest, not real-time location.
- **Why it is fixed:** These are expensive to build, expensive to operate, and not what makes the difference between a working operation and a broken one for the target customer. Cash and custody are.
- **Tradeoff it creates:** Some merchants and customers will ask "where is my parcel right now?" and the answer in v1 is "out for delivery in [zone]," not a moving dot on a map.

## 6. MVP scope

### In scope

- **Order intake:** Manual single-order entry, batch entry via paste/upload (CSV/Excel/Google Sheets shape), QR label generation and printing.
- **Merchant management:** Merchant records with agreement parameters (delivery fee, COD handling fee, remittance cycle, accepted PoD methods, dispute window, RTO cost allocation rule).
- **Dispatch board:** List of available riders, list of unassigned orders, drag-or-tap assignment to a rider as a shift manifest.
- **Rider PWA:** Manifest acceptance, parcel scanning at pickup, per-stop delivery flow with photo and OTP capture, variance recording at the door (partial acceptance, exact-change shortfall, customer renegotiation, refusal), failed-attempt recording with reason codes, custody transfer to another rider, end-of-shift cash and parcel drop.
- **Cash ledger:** Live per-rider, per-merchant sub-ledger updating on every confirmed delivery; rider personal float tracked separately from collections; variance highlighted in real time.
- **End-of-shift reconciliation:** Single screen showing parcels expected vs. parcels accounted for, cash expected vs. cash dropped, per-merchant breakdown, variance with required reason code to close.
- **RTO and reattempt queue:** Failed deliveries enter a reattempt queue; after the configured attempt limit (default 3), they enter a return-to-merchant flow with custody tracking back to the merchant.
- **Merchant remittance:** Auto-generated itemized statements per merchant per cycle, with delivery fees and COD handling fees clearly separated from pass-through COD cash for VAT purposes; remittance is computed by Indek but executed by the operator outside the system (bank transfer, cheque, cash).
- **Merchant status view:** A read-only hosted page per merchant showing parcel status and accumulating COD balance, accessed via a link the operator can share over WhatsApp.
- **Event log:** Immutable, queryable record of every state transition with rider, timestamp, geolocation, and proof artifact references. Operator-facing dispute view that surfaces the relevant log slice for any parcel.

### Out of scope

- Holding, pooling, processing, or advancing funds in any form
- Route optimization, live GPS tracking, ETA prediction
- Customer-facing tracking portal (a hosted status link sent over WhatsApp is enough)
- Rider payroll calculation, salary disbursement, or pay-slip generation
- Merchant self-service onboarding or agreement editing (operator-mediated in v1)
- AI features: address resolution, intake parsing, photo verification, voice logging
- Multi-language UI (English only; Arabic deferred)
- Public API or third-party integrations (Shopify, WooCommerce, accounting software)
- Native iOS or Android apps
- Dynamic pricing, distance-based charges, surge pricing
- Multi-tenant architecture with onboarding flow and billing
- Real-time chat between operator and rider (WhatsApp continues to handle this)
- Customer account or login of any kind

### Explicitly unsupported combinations or edge cases

- **A delivery marked complete without a proof artifact.** Every delivered status requires the configured proof for that merchant agreement (photo, OTP, photo + OTP). No exceptions.
- **A shift closed with unexplained variance.** The operator may write off variance, but the write-off requires a reason code and is itself a logged event. Silent closing is impossible.
- **Cash transfer between riders without a custody transfer event.** If two riders need to swap parcels or cash mid-shift, the swap goes through a logged transfer with both-party acknowledgment. Informal handoffs are unsupported.
- **Editing history.** No event in the log can be edited or deleted. Corrections happen by appending compensating events.
- **A merchant agreement that mixes prepaid and COD on the same parcel.** v1 treats every parcel as either fully COD or fully prepaid; split-payment parcels are unsupported.
- **Same-rider continuous shifts spanning the summer midday ban window.** The system warns when a manifest's expected delivery times overlap the 12:30–3:00 PM ban (June 15–September 15) but does not enforce a hard block in v1.
- **Cross-emirate manifests with mixed merchant agreements.** v1 supports cross-emirate deliveries but assumes a single rider for a single shift; multi-rider relay across emirates is unsupported.

## 7. Capability areas

- **Intake and labeling:** Get orders into the system from however the merchant sends them, attach a scannable label, and make them ready for assignment.
- **Dispatch and assignment:** Match available riders to unassigned orders as shift manifests; surface rider load, current custody, and availability.
- **Field execution:** Give the rider a low-friction PWA for picking up, delivering, capturing proof, and recording variance; tolerate poor connectivity.
- **Cash custody and reconciliation:** Maintain the rider cash ledger with per-merchant sub-totals; close shifts with zero variance or explicit write-off; produce the audit trail.
- **Returns and reattempts:** Manage the lifecycle of failed deliveries from first failed attempt through reattempt queue to return-to-merchant custody handover.
- **Merchant remittance:** Compute itemized statements per merchant per cycle with correct VAT separation; make it easy for the operator to execute payment outside the system.
- **Status visibility:** Give merchants a read-only view of their parcels and accumulating COD; give the operator a real-time picture of the whole operation.
- **Audit and dispute support:** Make the event log queryable; surface the relevant slice for any parcel or any reconciliation discrepancy.

## 8. Use case sketch

```mermaid
flowchart LR
  Operator[Operator] --> Intake((Intake & label))
  Operator --> Indek((Indek & assign))
  Operator --> Reconcile((Reconcile shift))
  Operator --> Remit((Remit to merchant))
  Rider[Rider] --> Execute((Pickup, deliver, log))
  Rider --> Drop((End-of-shift drop))
  Merchant[Merchant] -.read-only.-> Status((Status & balance))
  Merchant -.read-only.-> Statement((Remittance statement))
```

## 9. High-signal decision tables

### Closing a shift

| Situation | Required behavior | Forbidden behavior | Deeper detail lives in |
| --------- | ----------------- | ------------------ | ---------------------- |
| All parcels accounted for, cash matches expected | Shift closes automatically on operator confirmation | Closing without operator confirmation | `02-ddd.md` shift lifecycle |
| Parcels still in rider custody at attempted close | Block close; require explicit custody transfer (back to ops, to another rider, or into RTO queue) | Closing with parcels in custody | `02-ddd.md` custody invariants |
| Cash variance not zero | Require operator write-off with reason code; log the write-off as an event | Silent closing; deleting the variance | `02-ddd.md` cash ledger |
| Rider attempts to close their own shift | Allow rider to mark shift "ready for drop"; only operator can finalize close | Rider self-closing without operator drop event | `03-ux.md` rider close flow |

### Recording a delivery

| Situation | Required behavior | Forbidden behavior | Deeper detail lives in |
| --------- | ----------------- | ------------------ | ---------------------- |
| Customer accepts in full, exact COD collected | Delivery marked complete with proof; cash ledger updated | Marking complete without proof artifact | `02-ddd.md` parcel lifecycle |
| Customer keeps part of order | Split into delivered portion (with adjusted COD) and returned portion (enters RTO flow); both events logged | Editing original COD amount; deleting the returned items | `02-ddd.md` partial delivery |
| Customer not home / not answering | Failed attempt logged with reason; parcel enters reattempt queue | Marking delivered to "leave at door" without merchant agreement permission | `02-ddd.md` failed-attempt model |
| Concierge accepts on behalf of customer | Logged as `delivered_to_concierge` if merchant agreement permits; otherwise must be logged as failed attempt | Logging as `delivered_to_recipient` when handed to concierge | `02-ddd.md` delivery dispositions |
| Customer pays less than COD amount | Recorded as collection with variance reason "partial payment"; operator policy decides whether parcel is delivered or failed | Pocketing the difference; silent acceptance | `02-ddd.md` cash variance |

### Merchant remittance

| Situation | Required behavior | Forbidden behavior | Deeper detail lives in |
| --------- | ----------------- | ------------------ | ---------------------- |
| End of remittance cycle for a merchant | Generate itemized statement: per-parcel collected COD, minus delivery fees and COD handling fees (with VAT clearly broken out), equals net payable | Bundling fees and pass-through cash into one line | `02-ddd.md` remittance context |
| Operator executes payment to merchant | Operator records the payment with method (bank transfer, cheque, cash) and reference; statement marked settled | Indek initiating or holding the payment | Decision 1 (this doc) |
| Disputed parcel pending resolution | Hold the disputed amount out of the current statement with a clear hold marker; remit the rest | Auto-deducting disputed amounts from future statements without merchant agreement | `02-ddd.md` dispute holds |

## 10. Examples and counterexamples

**Example workflow the product must support:** A Dubai operator with eight riders takes a Sunday-morning batch of 60 orders from twelve merchants — Instagram fashion sellers, two pharmacies, a home baker, and a perfume brand. The operator pastes the order batches into Indek from each merchant's WhatsApp message, generates QR labels, and assigns them as four shift manifests across four available riders. By 2 PM, the riders have delivered 48 parcels, recorded 4 partial deliveries (fashion try-before-buy), 6 failed attempts (customer not home), and 2 customer refusals. One rider transferred 3 parcels to another rider mid-shift after a flat tire, with both riders confirming the custody transfer in the app. At end of shift, all four riders drop cash and undelivered parcels back to the operator. The reconciliation screen shows one rider has an AED 50 cash shortfall; the rider explains they made change for a customer and forgot to log the float adjustment. The operator writes off the variance with the reason code "rider float adjustment" and closes the shift. The next morning, the operator generates remittance statements for the twelve merchants and sends each one a WhatsApp message with the statement attached.

**Why it matters:** This workflow contains every concept the product is built around — multi-merchant pooling, partial delivery, failed attempts, rider-to-rider custody transfer, end-of-shift reconciliation with variance, and per-merchant remittance with VAT separation. If the product can do this, it can scale to ten riders. If it can't, it's a worse Excel.

**Counterexample the product should reject, block, or leave out of scope:** A merchant asks the operator if Indek can "hold the COD for a week" until they're ready to receive it, or "advance us 80% of the COD on day one and remit the balance after returns settle." Indek refuses both, because both put the platform in the funds flow and trigger CBUAE licensing scope.

**Why it is excluded:** Decision 1. No exceptions. The right answer is "the operator holds the cash in their own bank account and remits per the agreement; if you want financing on COD receivables, that's a separate financial product from a separate provider."

## 11. Success criteria

- **User-visible outcome:** Riders stop arguing with the operator about cash; merchants stop asking "where's my money?"; disputes resolve in minutes by pulling up the event log instead of hours of WhatsApp scrolling. Failed-delivery rate trends down month over month as the reattempt queue catches what used to fall through.
- **Operational outcome:** End-of-shift reconciliation takes under 10 minutes per shift instead of 1–2 hours. The operator stops using WhatsApp for assignments and uses it only as a notification channel. The fleet scales from 5 to 10 riders without adding ops headcount and without losing a merchant to a remittance dispute.
- **Business outcome:** Monthly COD variance drops below 0.5% of collected cash. The internal tool is proven load-bearing for the real business. The architecture and the legal posture are clean enough to onboard a second operator as the first external tenant — without a rewrite and without a regulatory conversation.

## 12. Risks and open decisions

- **Risk: Rider PWA adoption.** Riders may resist using the PWA over WhatsApp in the first weeks, particularly older riders with limited smartphone literacy. Mitigation: keep tap counts low, design for one-handed use, allow the operator to enter events on the rider's behalf during the transition. This is a UX problem, not a technology problem.
- **Risk: The CBUAE line is bright but not infinitely far away.** Any feature that *feels* like a payment platform — a wallet, a hold, an instant remittance — risks pulling Indek into licensing scope. Mitigation: every feature gets tested against Decision 1 before it ships, and a CBUAE-regulated legal opinion is obtained before launching to a second operator.
- **Risk: Single-tenant assumptions get baked in.** Validating on one fleet hides assumptions that don't generalize. Mitigation: surfacing those assumptions is a goal of v1, and a second-tenant onboarding is a deliberate post-v1 milestone, not an afterthought.
- **Risk: Visa-sponsorship power asymmetry.** The operator-rider relationship in the UAE is structurally unequal because the operator sponsors the rider's visa. Features around cash deductions, shortage handling, and rider termination must be designed so the product cannot become a tool for abuse. Mitigation: every rider-facing punitive workflow gets reviewed for fairness before shipping.
- **Open decision: What is the default cash drop mechanism in v1?** Candidates: (a) in-person rider-to-ops handoff with photo + signature, (b) rider direct CDM deposit with slip upload, (c) operator-led visit to rider home with logged collection. The choice has UX, security, and proof-artifact implications. To be decided before the cash ledger ships.
- **Open decision: How is the merchant agreement modeled in v1?** It needs to capture remittance cycle, COD handling fee percentage, accepted PoD methods, dispute window, RTO cost allocation, and per-merchant rider instructions. The decision is whether v1 ships a structured editor for these or a free-text document attached to the merchant record with the structured fields filled in by the operator at intake time.
- **Open decision: What signal tells us we're ready to onboard a second operator?** Likely a combination of (a) zero cash variance for N consecutive weeks, (b) zero dispute losses for N consecutive weeks, and (c) the operator successfully running the system without developer help for N weeks. The exact thresholds are TBD.
- **Open decision: Which v2 AI feature earns its place first?** Candidates: messy address resolution, intake parsing of arbitrary-format merchant order lists, photo-PoD verification. To be decided based on what data v1 collects and what pain dominates after v1 ships.

## 13. Document relationships

- Domain truth — bounded contexts, aggregates, state machines, invariants — belongs in `docs/product/02-ddd.md`. This includes the parcel lifecycle, the RTO lifecycle, the rider cash ledger, the shift manifest, the merchant remittance context, and the custody transfer event model.
- User-visible workflow behavior — screen flows, rider PWA interaction patterns, dispatch board layout, reconciliation screen design — belongs in `docs/product/03-ux.md`.
- Technical reality — runtime, storage, deployment, PWA constraints, offline strategy — belongs in `docs/product/04-tech.md`.
- The strategic framing and customer promise live in `docs/product/00-onepager.md`.
