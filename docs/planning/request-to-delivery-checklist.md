# Request-to-Delivery Checklist

## Goal

Prove one thin local MVP loop for Indek: a merchant submits a request, an operator assigns it, a rider accepts the manifest and resolves the parcel, and both operator and merchant see the updated state from the same live Postgres-backed data.

## Acceptance Criteria

- Merchant token portal at `/m/[token]` creates a parcel in `unassigned`.
- Operator dispatch assigns one or more `unassigned` parcels to a rider and moves them to `assigned`.
- Rider can accept an assigned manifest from `/rider`.
- Accepting a manifest sets `acceptedAt` and moves the manifest's assigned parcels to `in_transit`.
- Rider can mark an `in_transit` parcel as `delivered`.
- Rider can mark an `in_transit` parcel as `failed` with one of:
  - `customer_not_home`
  - `customer_refused`
  - `reschedule_requested`
  - `other`
- Merchant and operator surfaces reflect `in_transit`, `delivered`, and `failed` without mock data.
- Terminal parcels disappear from the rider's active worklist.

## Now

- No open items in this slice right now.

## Done

- [x] Add typed rider delivery failure reasons to `@indek/shared`.
- [x] Add rider domain mutations for manifest acceptance, delivered, and failed outcomes.
- [x] Enforce rider ownership and `in_transit` guardrails in server actions and domain logic.
- [x] Wire `/rider` to accept manifests and resolve active parcels with delivered or failed actions.
- [x] Refresh operator, merchant, and rider surfaces after rider actions.
- [x] Fix rider action redirects so success notices are not swallowed by Next.js redirect exceptions.
- [x] Show parcel update timestamps on merchant-facing status surfaces.
- [x] Capture pickup and dropoff details on merchant and operator intake forms.
- [x] Show an average shipping charge before merchant submission based on the merchant base fee plus a light lane heuristic.
- [x] Raise the admin notification for new delivery requests inside the operator overview and dispatch surfaces instead of adding a separate push or email channel.
- [x] Add a dedicated planning checklist for this slice.
- [x] Run one browser smoke pass across the merchant token portal, operator dashboard/dispatch, and rider route.
- [x] Run automated verification: `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

## Deferred

- [ ] OTP and photo proof capture
- [ ] COD cash confirmation
- [ ] Pickup scan flow
- [ ] Partial delivery
- [ ] Reattempt queue
- [ ] Offline support
- [ ] Merchant and rider account provisioning from the operator UI
