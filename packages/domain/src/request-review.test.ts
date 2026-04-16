import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { resetDbForTest, setDbForTest } from "@indek/db";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@indek/db/schema";
import {
  approveParcelForDispatch,
  assignManifest,
  createMerchant,
  createParcel,
  createRider,
  getEventLogForParcel,
  getParcelsForMerchant,
  getRequestReviewQueueData,
  holdParcelRequest,
  listDispatchReadyParcels,
  sendParcelFollowUp,
  updateParcelRequestByMerchant,
} from "./index";
import {
  requestReviewChecklistFields,
  type RequestReviewChecklist,
} from "@indek/shared";

function buildCompleteChecklist(): RequestReviewChecklist {
  return Object.fromEntries(
    requestReviewChecklistFields.map(({ key }) => [key, true]),
  ) as RequestReviewChecklist;
}

async function applyMigrations(query: (sql: string) => Promise<unknown>) {
  const migrationsDir = new URL("../../db/migrations/", import.meta.url);
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = await readFile(new URL(file, migrationsDir), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await query(statement);
    }
  }
}

async function withTestDb(run: () => Promise<void>) {
  const client = new PGlite();

  await applyMigrations((sql) => client.exec(sql));
  setDbForTest({
    db: drizzle(client, { schema }) as never,
  });

  try {
    await run();
  } finally {
    resetDbForTest();
    await client.close();
  }
}

test("merchant-submitted requests stay out of dispatch until reviewed", async () => {
  await withTestDb(async () => {
    const merchant = await createMerchant({
      name: "Bloom Boutique",
      remittanceCycle: "weekly",
      proofRequirement: "photo+otp",
      codFeePercent: 0.08,
      deliveryFeeAed: 18,
      disputeWindowDays: 7,
    });
    const rider = await createRider({
      name: "Hassan Ali",
      zone: "Dubai Marina",
      status: "available",
      personalFloatAed: 150,
    });
    const parcel = await createParcel({
      merchantId: merchant.id,
      customerName: "Rania Tariq",
      customerPhone: "+971523009011",
      pickupAddress: "Bloom Boutique, Al Quoz industrial area 3, gate 2",
      area: "Business Bay",
      address: "Executive Towers, podium level, apt 1804",
      codAmountAed: 280,
      averageShippingChargeAed: 18,
      itemSummary: "Abaya set",
      notes: "Call before arrival.",
      source: "merchant",
      actorLabel: merchant.name,
    });

    assert.ok(parcel);
    assert.equal(parcel.reviewState, "under_review");

    const reviewData = await getRequestReviewQueueData();
    assert.equal(reviewData.summary.underReviewCount, 1);
    assert.equal(reviewData.summary.dispatchReadyCount, 0);

    await assert.rejects(
      assignManifest({
        riderId: rider.id,
        parcelIds: [parcel.id],
      }),
      /dispatch-ready/,
    );
  });
});

test("operator clarification messages stay open until the merchant resubmits", async () => {
  await withTestDb(async () => {
    const merchant = await createMerchant({
      name: "Noon Bakehouse",
      remittanceCycle: "weekly",
      proofRequirement: "photo",
      codFeePercent: 0.05,
      deliveryFeeAed: 15,
      disputeWindowDays: 5,
    });
    const parcel = await createParcel({
      merchantId: merchant.id,
      customerName: "Lina Darwish",
      customerPhone: "+971581230088",
      pickupAddress: "Noon Bakehouse, JVC circle mall loading bay",
      area: "JVC",
      address: "Belgravia Heights, tower B",
      codAmountAed: 120,
      averageShippingChargeAed: 15,
      itemSummary: "Dessert box",
      notes: "Customer prefers afternoon drop.",
      source: "merchant",
      actorLabel: merchant.name,
    });

    assert.ok(parcel);

    await sendParcelFollowUp({
      parcelId: parcel.id,
      checklist: {
        addressConfirmed: true,
      },
      message: "Please add the building gate code and exact apartment number.",
      actorLabel: "Ops desk",
    });

    const afterFollowUp = (await getParcelsForMerchant(merchant.id))[0];
    assert.equal(afterFollowUp.reviewState, "needs_clarification");
    assert.equal(afterFollowUp.latestFollowUp?.status, "open");
    assert.match(
      afterFollowUp.latestFollowUp?.message ?? "",
      /gate code and exact apartment number/i,
    );

    const updated = await updateParcelRequestByMerchant({
      parcelId: parcel.id,
      merchantId: merchant.id,
      customerName: "Lina Darwish",
      customerPhone: "+971581230088",
      pickupAddress: "Noon Bakehouse, JVC circle mall loading bay",
      area: "JVC",
      address: "Belgravia Heights, tower B, apartment 304, gate code 5521",
      codAmountAed: 120,
      averageShippingChargeAed: 15,
      itemSummary: "Dessert box",
      notes: "Gate code added after ops follow-up.",
      actorLabel: merchant.name,
    });

    assert.ok(updated);
    assert.equal(updated.reviewState, "under_review");
    assert.equal(updated.latestFollowUp?.status, "resolved");
    assert.match(updated.address, /apartment 304/i);

    const reviewData = await getRequestReviewQueueData();
    assert.equal(reviewData.summary.needsClarificationCount, 0);
    assert.equal(reviewData.summary.underReviewCount, 1);
  });
});

test("held requests can be approved later and then assigned", async () => {
  await withTestDb(async () => {
    const merchant = await createMerchant({
      name: "Safa Pharmacy",
      remittanceCycle: "biweekly",
      proofRequirement: "otp",
      codFeePercent: 0.06,
      deliveryFeeAed: 20,
      disputeWindowDays: 10,
    });
    const rider = await createRider({
      name: "Umar Khan",
      zone: "Deira",
      status: "available",
      personalFloatAed: 100,
    });
    const parcel = await createParcel({
      merchantId: merchant.id,
      customerName: "Ahmed Rashid",
      customerPhone: "+971569008812",
      pickupAddress: "Safa Pharmacy, Sheikh Zayed branch",
      area: "Deira",
      address: "Naif road, shop 12",
      codAmountAed: 180,
      averageShippingChargeAed: 20,
      itemSummary: "OTC pharmacy bundle",
      notes: "Customer asked for evening window.",
      source: "merchant",
      actorLabel: merchant.name,
    });

    assert.ok(parcel);

    await holdParcelRequest({
      parcelId: parcel.id,
      message:
        "We are holding this request until the contact window is confirmed.",
      note: "Merchant asked for evening-only serviceability confirmation.",
      actorLabel: "Ops lead",
    });

    const heldParcel = (await getParcelsForMerchant(merchant.id))[0];
    assert.equal(heldParcel.reviewState, "on_hold");
    assert.equal(heldParcel.latestFollowUp?.status, "open");

    await approveParcelForDispatch({
      parcelId: parcel.id,
      checklist: buildCompleteChecklist(),
      note: "Serviceability confirmed. Ready for dispatch.",
      actorLabel: "Ops lead",
    });

    const dispatchReady = await listDispatchReadyParcels();
    assert.equal(dispatchReady.length, 1);
    assert.equal(dispatchReady[0]?.id, parcel.id);
    assert.equal(dispatchReady[0]?.latestFollowUp?.status, "resolved");

    const manifest = await assignManifest({
      riderId: rider.id,
      parcelIds: [parcel.id],
      actorLabel: "Ops lead",
    });

    assert.deepEqual(manifest.parcelIds, [parcel.id]);

    const eventTypes = (await getEventLogForParcel(parcel.id)).map(
      (event) => event.type,
    );
    assert.ok(eventTypes.includes("request.on_hold"));
    assert.ok(eventTypes.includes("request.approved_for_dispatch"));
    assert.ok(eventTypes.includes("manifest.assigned"));
  });
});
