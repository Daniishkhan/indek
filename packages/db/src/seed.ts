import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { getDb, getPool } from "./client";
import {
  account,
  events,
  manifests,
  merchantProfile,
  merchants,
  operatorProfile,
  parcels,
  riderProfile,
  riders,
  session,
  user,
  verification,
} from "./schema";
import { seedData } from "./seed-data";

config({ path: ".env.local" });
config({ path: ".env" });

export async function resetSeedData() {
  const db = getDb();

  await db.delete(events);
  await db.delete(parcels);
  await db.delete(manifests);
  await db.delete(riderProfile);
  await db.delete(merchantProfile);
  await db.delete(operatorProfile);
  await db.delete(riders);
  await db.delete(merchants);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

export async function seedDomainData() {
  const db = getDb();

  await db.insert(merchants).values(
    seedData.merchants.map((merchant) => ({
      id: merchant.id,
      name: merchant.name,
      token: merchant.token,
      remittanceCycle: merchant.remittanceCycle,
      proofRequirement: merchant.proofRequirement,
      codFeePercent: merchant.codFeePercent.toFixed(4),
      deliveryFeeAed: merchant.deliveryFeeAed.toFixed(2),
      fulfillmentMode: merchant.fulfillmentMode,
      pickupAddress: merchant.pickupAddress ?? null,
      disputeWindowDays: merchant.disputeWindowDays,
      createdAt: new Date(merchant.createdAt),
      updatedAt: new Date(merchant.updatedAt),
    })),
  );

  await db.insert(riders).values(
    seedData.riders.map((rider) => ({
      id: rider.id,
      name: rider.name,
      zone: rider.zone,
      status: rider.status,
      personalFloatAed: rider.personalFloatAed.toFixed(2),
      createdAt: new Date(rider.createdAt),
      updatedAt: new Date(rider.updatedAt),
    })),
  );

  await db.insert(manifests).values(
    seedData.manifests.map((manifest) => ({
      id: manifest.id,
      riderId: manifest.riderId,
      zoneSummary: manifest.zoneSummary,
      acceptedAt: manifest.accepted ? new Date(manifest.createdAt) : null,
      createdAt: new Date(manifest.createdAt),
    })),
  );

  await db.insert(parcels).values(
    seedData.parcels.map((parcel) => ({
      id: parcel.id,
      awb: parcel.awb,
      merchantId: parcel.merchantId,
      riderId: parcel.riderId ?? null,
      manifestId:
        seedData.manifests.find((manifest) =>
          manifest.parcelIds.includes(parcel.id),
        )?.id ?? null,
      customerName: parcel.customerName,
      customerPhone: parcel.customerPhone,
      area: parcel.area,
      address: parcel.address,
      codAmountAed: parcel.codAmountAed.toFixed(2),
      deliveryFeeAed: parcel.deliveryFeeAed?.toFixed(2) ?? null,
      state: parcel.state,
      reviewState: parcel.reviewState,
      itemSummary: parcel.itemSummary ?? null,
      notes: parcel.notes ?? null,
      createdAt: new Date(parcel.createdAt),
      updatedAt: new Date(parcel.lastUpdateAt),
    })),
  );

  await db.insert(events).values(
    seedData.eventLog.map((event) => ({
      id: event.id,
      parcelId: event.parcelId,
      type: event.type,
      actorLabel: event.actor,
      location: event.location ?? null,
      proof: event.proof ?? null,
      payload: null,
      occurredAt: new Date(event.timestamp),
    })),
  );

  return {
    merchants: seedData.merchants.length,
    riders: seedData.riders.length,
    manifests: seedData.manifests.length,
    parcels: seedData.parcels.length,
    events: seedData.eventLog.length,
  };
}

async function main() {
  await resetSeedData();
  const counts = await seedDomainData();

  console.log(
    `Seeded ${counts.merchants} merchants, ${counts.riders} riders, ${counts.manifests} manifests, ${counts.parcels} parcels, and ${counts.events} events.`,
  );

  await getPool().end();
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
