import { seedData } from "../../db/src/index";
import type {
  EventLogEntry,
  Manifest,
  Merchant,
  Parcel,
  RemittanceStatement,
  Rider
} from "@indek/shared";

export function listMerchants(): Merchant[] {
  return seedData.merchants;
}

export function listRiders(): Rider[] {
  return seedData.riders;
}

export function listParcels(): Parcel[] {
  return seedData.parcels;
}

export function listUnassignedParcels(): Parcel[] {
  return seedData.parcels.filter((parcel) => parcel.state === "unassigned");
}

export function listActiveManifests(): Manifest[] {
  return seedData.manifests;
}

export function getRiderById(riderId: string): Rider | undefined {
  return seedData.riders.find((rider) => rider.id === riderId);
}

export function getManifestForRider(riderId: string): Manifest | undefined {
  return seedData.manifests.find((manifest) => manifest.riderId === riderId);
}

export function getParcelsForRider(riderId: string): Parcel[] {
  return seedData.parcels.filter((parcel) => parcel.riderId === riderId);
}

export function getMerchantById(merchantId: string): Merchant | undefined {
  return seedData.merchants.find((merchant) => merchant.id === merchantId);
}

export function getMerchantByToken(token: string): Merchant | undefined {
  const tokenMap: Record<string, string> = {
    "bloom-demo": "m-bloom",
    "noon-demo": "m-noonbake",
    "safa-demo": "m-safa"
  };

  const merchantId = tokenMap[token];
  return merchantId ? getMerchantById(merchantId) : undefined;
}

export function getParcelsForMerchant(merchantId: string): Parcel[] {
  return seedData.parcels.filter((parcel) => parcel.merchantId === merchantId);
}

export function getEventLogForParcel(parcelId: string): EventLogEntry[] {
  return seedData.eventLog.filter((entry) => entry.parcelId === parcelId);
}

export function getRemittanceForMerchant(
  merchantId: string
): RemittanceStatement | undefined {
  return seedData.remittances.find(
    (statement) => statement.merchantId === merchantId
  );
}

export function getOpsSnapshot() {
  const riders = listRiders();
  const parcels = listParcels();

  return {
    riders,
    activeDeliveries: parcels.filter((parcel) => parcel.state === "in_transit").length,
    failedAttempts: parcels.filter((parcel) => parcel.state === "failed").length,
    unassigned: parcels.filter((parcel) => parcel.state === "unassigned").length,
    codExposureAed: riders.reduce((sum, rider) => sum + rider.cashHeldAed, 0)
  };
}
