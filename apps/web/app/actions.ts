"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  acceptManifest,
  assignManifest,
  createMerchant,
  createParcel,
  createRider,
  getMerchantById,
  getMerchantByToken,
  recordParcelDelivered,
  recordParcelFailed,
} from "@indek/domain";
import {
  estimateAverageShippingCharge,
  failureReasons,
  type FailureReason,
  type ProofRequirement,
  type RemittanceCycle,
} from "@indek/shared";
import { getCurrentSession } from "@/lib/session";
import { getRoleHome, roleConfig } from "@/lib/role-config";

const REMITTANCE_CYCLES: RemittanceCycle[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
];
const PROOF_REQUIREMENTS: ProofRequirement[] = ["photo", "otp", "photo+otp"];
const RIDER_STATUSES = [
  "available",
  "on_shift",
  "returning",
  "off_shift",
] as const;

function getText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number.parseFloat(getText(formData, key));
  return Number.isFinite(value) ? value : fallback;
}

function getAverageShippingCharge(
  formData: FormData,
  baseFeeAed: number,
  fallbackPickupAddress: string,
) {
  const submittedValue = Number.parseFloat(
    getText(formData, "averageShippingChargeAed"),
  );
  if (Number.isFinite(submittedValue) && submittedValue >= 0) {
    return submittedValue;
  }

  return estimateAverageShippingCharge({
    baseFeeAed,
    pickupAddress: getText(formData, "pickupAddress") || fallbackPickupAddress,
    deliveryArea: getText(formData, "area"),
    deliveryAddress: getText(formData, "address"),
  }).averageChargeAed;
}

function withNotice(path: string, notice: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}notice=${encodeURIComponent(notice)}`;
}

function revalidateOperatorSurfaces(extraPaths: string[] = []) {
  for (const path of [
    "/",
    "/merchant",
    "/operator",
    "/operator/intake",
    "/operator/dispatch",
    "/operator/live",
    ...extraPaths,
  ]) {
    revalidatePath(path);
  }
}

function revalidateDeliverySurfaces(input: {
  merchantTokens?: string[];
  riderId?: string;
}) {
  revalidateOperatorSurfaces();
  revalidatePath("/rider");
  revalidatePath("/m/[token]", "page");
  revalidatePath("/operator/reconciliation/[riderId]", "page");

  if (input.riderId) {
    revalidatePath(`/operator/reconciliation/${input.riderId}`);
  }

  for (const token of input.merchantTokens ?? []) {
    revalidatePath(`/m/${token}`);
  }
}

async function requireOperator(nextPath: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(
      `${roleConfig.operator.signInPath}?next=${encodeURIComponent(nextPath)}`,
    );
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "operator") {
    redirect(getRoleHome(role));
  }

  return {
    userId: session.user.id,
    label: session.user.name ?? session.user.email ?? "Operator",
  };
}

async function requireRider(nextPath: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(
      `${roleConfig.rider.signInPath}?next=${encodeURIComponent(nextPath)}`,
    );
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "rider") {
    redirect(getRoleHome(role));
  }

  return {
    userId: session.user.id,
    label: session.user.name ?? session.user.email ?? "Rider",
  };
}

export async function createMerchantAction(formData: FormData) {
  await requireOperator("/operator/intake");

  const name = getText(formData, "name");
  if (!name) {
    redirect(withNotice("/operator/intake", "merchant-missing-name"));
  }

  const remittanceCycleValue = getText(formData, "remittanceCycle");
  const proofRequirementValue = getText(formData, "proofRequirement");
  const remittanceCycle = REMITTANCE_CYCLES.includes(
    remittanceCycleValue as RemittanceCycle,
  )
    ? (remittanceCycleValue as RemittanceCycle)
    : "weekly";
  const proofRequirement = PROOF_REQUIREMENTS.includes(
    proofRequirementValue as ProofRequirement,
  )
    ? (proofRequirementValue as ProofRequirement)
    : "photo";

  await createMerchant({
    name,
    remittanceCycle,
    proofRequirement,
    codFeePercent: getNumber(formData, "codFeePercent", 0.05),
    deliveryFeeAed: getNumber(formData, "deliveryFeeAed", 15),
    disputeWindowDays: Math.max(
      1,
      Math.round(getNumber(formData, "disputeWindowDays", 7)),
    ),
  });

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/intake", "merchant-created"));
}

export async function createRiderAction(formData: FormData) {
  await requireOperator("/operator/intake");

  const name = getText(formData, "name");
  const zone = getText(formData, "zone");
  if (!name || !zone) {
    redirect(withNotice("/operator/intake", "rider-missing-fields"));
  }

  const statusValue = getText(formData, "status");
  const status = RIDER_STATUSES.includes(
    statusValue as (typeof RIDER_STATUSES)[number],
  )
    ? (statusValue as (typeof RIDER_STATUSES)[number])
    : "available";

  await createRider({
    name,
    zone,
    status,
    personalFloatAed: getNumber(formData, "personalFloatAed", 100),
  });

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/intake", "rider-created"));
}

export async function createOperatorParcelAction(formData: FormData) {
  const actor = await requireOperator("/operator/intake");

  const merchantId = getText(formData, "merchantId");
  const merchant = merchantId ? await getMerchantById(merchantId) : undefined;
  if (!merchant) {
    redirect(withNotice("/operator/intake", "order-missing-merchant"));
  }

  await createParcel({
    merchantId: merchant.id,
    customerName: getText(formData, "customerName"),
    customerPhone: getText(formData, "customerPhone"),
    pickupAddress:
      getText(formData, "pickupAddress") || `${merchant.name} pickup`,
    area: getText(formData, "area"),
    address: getText(formData, "address"),
    codAmountAed: getNumber(formData, "codAmountAed", 0),
    averageShippingChargeAed: getAverageShippingCharge(
      formData,
      merchant.deliveryFeeAed,
      `${merchant.name} pickup`,
    ),
    itemSummary: getText(formData, "itemSummary"),
    notes: getText(formData, "notes"),
    source: "operator",
    actorUserId: actor.userId,
    actorLabel: actor.label,
  });

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(withNotice("/operator/intake", "order-created"));
}

export async function createMerchantParcelAction(formData: FormData) {
  const token = getText(formData, "token");
  const merchant = token ? await getMerchantByToken(token) : undefined;

  if (!merchant) {
    redirect("/");
  }

  await createParcel({
    merchantId: merchant.id,
    customerName: getText(formData, "customerName"),
    customerPhone: getText(formData, "customerPhone"),
    pickupAddress:
      getText(formData, "pickupAddress") || `${merchant.name} pickup`,
    area: getText(formData, "area"),
    address: getText(formData, "address"),
    codAmountAed: getNumber(formData, "codAmountAed", 0),
    averageShippingChargeAed: getAverageShippingCharge(
      formData,
      merchant.deliveryFeeAed,
      `${merchant.name} pickup`,
    ),
    itemSummary: getText(formData, "itemSummary"),
    notes: getText(formData, "notes"),
    source: "merchant",
    actorLabel: merchant.name,
  });

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(withNotice(`/m/${merchant.token}`, "order-submitted"));
}

export async function assignManifestAction(formData: FormData) {
  const actor = await requireOperator("/operator/dispatch");

  const riderId = getText(formData, "riderId");
  const parcelIds = formData
    .getAll("parcelIds")
    .map((value) => String(value))
    .filter(Boolean);

  if (!riderId || parcelIds.length === 0) {
    redirect(withNotice("/operator/dispatch", "manifest-missing-selection"));
  }

  try {
    await assignManifest({
      riderId,
      parcelIds,
      actorUserId: actor.userId,
      actorLabel: actor.label,
    });
  } catch {
    redirect(withNotice("/operator/dispatch", "manifest-failed"));
  }

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/dispatch", "manifest-created"));
}

export async function acceptManifestAction(formData: FormData) {
  const actor = await requireRider("/rider");
  const manifestId = getText(formData, "manifestId");

  if (!manifestId) {
    redirect(withNotice("/rider", "manifest-accept-failed"));
  }

  let result: Awaited<ReturnType<typeof acceptManifest>>;
  try {
    result = await acceptManifest(manifestId, actor.userId, actor.label);
  } catch {
    redirect(withNotice("/rider", "manifest-accept-failed"));
  }

  revalidateDeliverySurfaces(result);
  redirect(withNotice("/rider", "manifest-accepted"));
}

export async function recordParcelDeliveredAction(formData: FormData) {
  const actor = await requireRider("/rider");
  const parcelId = getText(formData, "parcelId");

  if (!parcelId) {
    redirect(withNotice("/rider", "delivery-failed"));
  }

  let result: Awaited<ReturnType<typeof recordParcelDelivered>>;
  try {
    result = await recordParcelDelivered(parcelId, actor.userId, actor.label);
  } catch {
    redirect(withNotice("/rider", "delivery-failed"));
  }

  revalidateDeliverySurfaces({
    merchantTokens: result.merchantToken ? [result.merchantToken] : [],
    riderId: result.riderId,
  });
  redirect(withNotice("/rider", "parcel-delivered"));
}

export async function recordParcelFailedAction(formData: FormData) {
  const actor = await requireRider("/rider");
  const parcelId = getText(formData, "parcelId");
  const reasonValue = getText(formData, "reason");

  if (!parcelId || !failureReasons.includes(reasonValue as FailureReason)) {
    redirect(withNotice("/rider", "failure-reason-required"));
  }

  let result: Awaited<ReturnType<typeof recordParcelFailed>>;
  try {
    result = await recordParcelFailed(
      parcelId,
      actor.userId,
      reasonValue as FailureReason,
      actor.label,
    );
  } catch {
    redirect(withNotice("/rider", "delivery-failed"));
  }

  revalidateDeliverySurfaces({
    merchantTokens: result.merchantToken ? [result.merchantToken] : [],
    riderId: result.riderId,
  });
  redirect(withNotice("/rider", "parcel-failed"));
}
