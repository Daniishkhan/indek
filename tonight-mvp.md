# Dispatch — Tonight MVP Plan

## Goal for tonight

Get one thin but real slice of the product working end to end so the app stops being a scaffold and starts being a usable system.

The goal is not to build all of Dispatch tonight.

The goal is to make one core operational loop real.

## Recommendation

Focus tonight on:

**Landing page + authentication + operator intake and dispatch**

This is the best first module to complete end to end tonight.

## Why this module first

If we try to do operator, merchant, and rider flows together tonight, we will spread ourselves too thin and finish none of them properly.

The operator side should come first because:

1. the operator is the control plane
2. rider flows depend on real manifests existing
3. merchant views depend on real parcel data existing
4. authentication is easiest to reason about if we establish roles from the operator side first

So the right first cut is:

- public landing page
- auth system
- operator dashboard shell
- merchant management
- rider management
- parcel intake
- manifest assignment

That creates the first real “work enters the system” loop.

## What not to do tonight

Do not try to finish these tonight:

- offline support
- delivery proof uploads
- partial delivery complexity
- remittance PDFs
- dispute tooling
- background jobs
- rider-to-rider transfer
- deep merchant portal

These are important, but they are not tonight-important.

## The auth model we should use

You said:

- admin dashboard
- customers / clients
- riders

For this product, I recommend we normalize that into three roles:

1. `operator`
2. `merchant`
3. `rider`

That maps cleanly to the product docs.

### Role definitions

#### Operator

Internal admin user.

Can:

- access `/operator`
- manage merchants
- manage riders
- create parcels
- assign manifests
- eventually reconcile shifts and generate remittance

#### Merchant

Client / customer account holder.

Can:

- access `/merchant` or token-based merchant routes later
- see their parcels
- see remittance summaries

For tonight, merchant auth can exist in schema and route protection, but the merchant UI can stay minimal.

#### Rider

Field worker.

Can:

- access `/rider`
- see assigned manifest later
- eventually execute deliveries

For tonight, rider auth can exist in schema and route protection, but the rider working flow can remain mostly placeholder.

## Tonight’s real MVP

If we want something meaningful by tonight, it should be this:

### 1. Public landing page

Purpose:

- explain the product clearly
- provide sign-in entry points
- make the app feel intentional instead of internal-only and unfinished

Must include:

- product positioning
- role-aware sign-in links
- a clear primary CTA

### 2. Authentication

Purpose:

- create the real app boundary
- establish role-based access

Must include:

- sign up / seed flow for first operator
- sign in
- sign out
- session handling
- role-based route protection

Recommended simple model:

- one `users` table
- one role field: `operator | merchant | rider`
- optional linked profile tables:
  - `operator_profiles`
  - `merchant_profiles`
  - `rider_profiles`

For tonight, operator is the only role that needs full working screens.

### 3. Operator dashboard shell

Purpose:

- give authenticated operators a real place to work

Must include:

- overview page
- navigation
- counts for merchants, riders, unassigned parcels, active manifests

### 4. Merchant management

Purpose:

- make intake usable against real merchant records

Must include:

- create merchant
- list merchants
- minimal merchant agreement fields:
  - name
  - delivery fee
  - COD handling fee percent
  - proof requirement
  - remittance cycle

### 5. Rider management

Purpose:

- make assignment usable against real rider records

Must include:

- create rider
- list riders
- active / inactive state

### 6. Parcel intake

Purpose:

- turn outside work into real system records

Must include:

- manual parcel creation
- paste-based intake
- assign merchant
- COD amount
- customer name
- phone
- address
- item summary
- notes

### 7. Dispatch / manifest assignment

Purpose:

- convert intake into actionable rider work

Must include:

- view unassigned parcels
- select rider
- assign parcels to a manifest
- create manifest record
- mark parcels as assigned

## The one module to complete end to end tonight

If I had to pick exactly one module, it would be:

**Operator Operations Module**

That module includes:

- operator auth
- merchant management
- rider management
- parcel intake
- manifest assignment

Why this is the best choice:

- it creates real data
- it unlocks later rider work
- it unlocks later merchant visibility
- it is enough to feel like progress tonight
- it avoids overcommitting to the hardest field-execution problems immediately

## Suggested execution order for tonight

### Step 1 — Real app foundation

- set up database
- set up migrations
- define user + role model
- define merchant, rider, parcel, manifest tables
- add auth

### Step 2 — Landing page

- replace scaffold homepage with a real product landing page
- add sign-in entry

### Step 3 — Protected operator area

- protect `/operator`
- create operator dashboard shell

### Step 4 — Merchant and rider CRUD

- build create/list pages
- keep forms minimal

### Step 5 — Parcel intake

- build parcel form
- build simple paste intake
- save to DB

### Step 6 — Manifest assignment

- build unassigned parcel list
- build rider selection
- create manifest

## What “done tonight” looks like

Tonight is a success if:

1. the app has a real landing page
2. we can authenticate as an operator
3. we can create merchants
4. we can create riders
5. we can create parcels
6. we can assign parcels into a manifest

If those six things work, the scaffold becomes a real product foundation.

## Technical recommendation

Keep tonight’s implementation boring:

- Next.js app router
- server actions or route handlers
- Postgres
- one auth library
- no Docker required
- no separate backend service yet

Do not split frontend and backend tonight.
Keep everything inside the single Next app while we establish the first real slice.

## Final call

The right move tonight is not “build all roles.”

The right move tonight is:

**Make the operator side real, and make auth real.**

Then tomorrow we can use the operator-created manifests to power the rider experience.
