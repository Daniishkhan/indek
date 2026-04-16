"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  acceptManifest,
  approveParcelForDispatch,
  assignManifest,
  createMerchant,
  createMerchantWithProfile,
  createParcel,
  createRider,
  getMerchantById,
  getMerchantByToken,
  holdParcelRequest,
  updateMerchantFulfillment,
  recordParcelDelivered,
  recordParcelFailed,
  sendParcelFollowUp,
  updateParcelRequestByMerchant,
} from "@indek/domain";
import {
  estimateAverageShippingCharge,
  failureReasons,
  requestReviewChecklistFields,
  type FailureReason,
  type ProofRequirement,
  type RequestReviewChecklist,
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

function getReviewChecklist(formData: FormData): RequestReviewChecklist {
  return Object.fromEntries(
    requestReviewChecklistFields.map(({ key }) => [
      key,
      formData.get(key) === "on" || formData.get(key) === "true",
    ]),
  ) as RequestReviewChecklist;
}

function revalidateOperatorSurfaces(extraPaths: string[] = []) {
  for (const path of [
    "/",
    "/merchant",
    "/operator",
    "/operator/requests",
    "/operator/dispatch",
    "/operator/live",
    "/operator/merchants",
    "/operator/riders",
    ...extraPaths,
  ]) {
    revalidatePath(path);
  }

  revalidatePath("/m/[token]", "page");
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
  await requireOperator("/operator/merchants");

  const name = getText(formData, "name");
  if (!name) {
    redirect(withNotice("/operator/merchants", "merchant-missing-name"));
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
  redirect(withNotice("/operator/merchants", "merchant-created"));
}

export async function createRiderAction(formData: FormData) {
  await requireOperator("/operator/riders");

  const name = getText(formData, "name");
  const zone = getText(formData, "zone");
  if (!name || !zone) {
    redirect(withNotice("/operator/riders", "rider-missing-fields"));
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
  redirect(withNotice("/operator/riders", "rider-created"));
}

export async function createOperatorParcelAction(formData: FormData) {
  const actor = await requireOperator("/operator/requests");

  const merchantId = getText(formData, "merchantId");
  const merchant = merchantId ? await getMerchantById(merchantId) : undefined;
  if (!merchant) {
    redirect(withNotice("/operator/requests", "order-missing-merchant"));
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
  redirect(withNotice("/operator/requests", "order-created"));
}

export async function createMerchantParcelAction(formData: FormData) {
  const token = getText(formData, "token");
  const merchant = token ? await getMerchantByToken(token) : undefined;

  if (!merchant) {
    redirect("/");
  }

  const defaultPickup = merchant.pickupAddress || `${merchant.name} pickup`;

  await createParcel({
    merchantId: merchant.id,
    customerName: getText(formData, "customerName"),
    customerPhone: getText(formData, "customerPhone"),
    pickupAddress: getText(formData, "pickupAddress") || defaultPickup,
    area: getText(formData, "area"),
    address: getText(formData, "address"),
    codAmountAed: getNumber(formData, "codAmountAed", 0),
    averageShippingChargeAed: getAverageShippingCharge(
      formData,
      merchant.deliveryFeeAed,
      defaultPickup,
    ),
    itemSummary: getText(formData, "itemSummary"),
    notes: getText(formData, "notes"),
    source: "merchant",
    actorLabel: merchant.name,
  });

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(withNotice(`/m/${merchant.token}/orders`, "order-submitted"));
}

export async function approveParcelForDispatchAction(formData: FormData) {
  const actor = await requireOperator("/operator/requests");
  const parcelId = getText(formData, "parcelId");

  if (!parcelId) {
    redirect(withNotice("/operator/requests", "review-failed"));
  }

  const rawFee = formData.get("deliveryFeeAed");
  const deliveryFeeAed =
    rawFee != null && String(rawFee).trim() !== ""
      ? parseFloat(String(rawFee))
      : undefined;

  try {
    await approveParcelForDispatch({
      parcelId,
      checklist: getReviewChecklist(formData),
      note: getText(formData, "reviewNote"),
      deliveryFeeAed:
        deliveryFeeAed != null && !isNaN(deliveryFeeAed)
          ? deliveryFeeAed
          : undefined,
      actorUserId: actor.userId,
      actorLabel: actor.label,
    });
  } catch {
    redirect(withNotice("/operator/requests", "review-failed"));
  }

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/requests", "request-approved"));
}

export async function sendParcelFollowUpAction(formData: FormData) {
  const actor = await requireOperator("/operator/requests");
  const parcelId = getText(formData, "parcelId");

  if (!parcelId) {
    redirect(withNotice("/operator/requests", "follow-up-failed"));
  }

  try {
    await sendParcelFollowUp({
      parcelId,
      checklist: getReviewChecklist(formData),
      message: getText(formData, "message"),
      note: getText(formData, "reviewNote"),
      actorUserId: actor.userId,
      actorLabel: actor.label,
    });
  } catch {
    redirect(withNotice("/operator/requests", "follow-up-failed"));
  }

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/requests", "follow-up-sent"));
}

export async function holdParcelRequestAction(formData: FormData) {
  const actor = await requireOperator("/operator/requests");
  const parcelId = getText(formData, "parcelId");

  if (!parcelId) {
    redirect(withNotice("/operator/requests", "hold-failed"));
  }

  try {
    await holdParcelRequest({
      parcelId,
      checklist: getReviewChecklist(formData),
      note: getText(formData, "reviewNote"),
      message: getText(formData, "message"),
      actorUserId: actor.userId,
      actorLabel: actor.label,
    });
  } catch {
    redirect(withNotice("/operator/requests", "hold-failed"));
  }

  revalidateOperatorSurfaces();
  redirect(withNotice("/operator/requests", "request-held"));
}

export async function updateMerchantParcelAction(formData: FormData) {
  const token = getText(formData, "token");
  const parcelId = getText(formData, "parcelId");
  const merchant = token ? await getMerchantByToken(token) : undefined;

  if (!merchant || !parcelId) {
    redirect("/");
  }

  try {
    await updateParcelRequestByMerchant({
      parcelId,
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
      actorLabel: merchant.name,
    });
  } catch {
    redirect(withNotice(`/m/${merchant.token}`, "request-update-failed"));
  }

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(withNotice(`/m/${merchant.token}`, "request-updated"));
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

export async function completeMerchantOnboardingAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/sign-in/merchant?next=/merchant");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "merchant") {
    redirect(getRoleHome(role));
  }

  const name = getText(formData, "companyName");
  if (!name) {
    redirect(withNotice("/merchant", "onboarding-missing-name"));
  }

  await createMerchantWithProfile({
    userId: session.user.id,
    name,
  });

  revalidateOperatorSurfaces();
  redirect("/merchant");
}

export async function updateMerchantFulfillmentAction(formData: FormData) {
  const token = getText(formData, "token");
  const mode = getText(formData, "fulfillmentMode");
  const pickupAddress = getText(formData, "pickupAddress");
  const merchant = token ? await getMerchantByToken(token) : undefined;

  if (!merchant) {
    redirect("/");
  }

  const fulfillmentMode =
    mode === "pickup" || mode === "dropoff" ? mode : "pickup";

  if (fulfillmentMode === "pickup" && !pickupAddress) {
    redirect(withNotice(`/m/${merchant.token}`, "pickup-missing"));
  }

  await updateMerchantFulfillment(
    merchant.id,
    fulfillmentMode,
    fulfillmentMode === "pickup" ? pickupAddress : undefined,
  );

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(withNotice(`/m/${merchant.token}`, "fulfillment-saved"));
}

export async function createBulkParcelsAction(formData: FormData) {
  const token = getText(formData, "token");
  const rawRows = getText(formData, "rows");
  const merchant = token ? await getMerchantByToken(token) : undefined;

  if (!merchant) {
    redirect("/");
  }

  let parsed: Array<{
    customerName: string;
    customerPhone: string;
    deliveryArea: string;
    deliveryAddress: string;
    codAmount: number;
    itemSummary: string;
    pickupAddress: string;
    notes: string;
  }>;

  try {
    parsed = JSON.parse(rawRows);
  } catch {
    redirect(withNotice(`/m/${merchant.token}/orders`, "bulk-upload-failed"));
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    redirect(withNotice(`/m/${merchant.token}/orders`, "bulk-upload-failed"));
  }

  let created = 0;
  for (const row of parsed) {
    const customerName = String(row.customerName ?? "").trim();
    const customerPhone = String(row.customerPhone ?? "").trim();
    const deliveryArea = String(row.deliveryArea ?? "").trim();
    const deliveryAddress = String(row.deliveryAddress ?? "").trim();
    const itemSummary = String(row.itemSummary ?? "").trim();
    const codAmount = Number(row.codAmount) || 0;
    const pickupAddress =
      String(row.pickupAddress ?? "").trim() ||
      merchant.pickupAddress ||
      `${merchant.name} pickup`;
    const notes = String(row.notes ?? "").trim();

    if (
      !customerName ||
      !customerPhone ||
      !deliveryArea ||
      !deliveryAddress ||
      !itemSummary
    ) {
      continue;
    }

    const avg = estimateAverageShippingCharge({
      baseFeeAed: merchant.deliveryFeeAed,
      pickupAddress,
      deliveryArea,
      deliveryAddress,
    });

    await createParcel({
      merchantId: merchant.id,
      customerName,
      customerPhone,
      pickupAddress,
      area: deliveryArea,
      address: deliveryAddress,
      codAmountAed: codAmount,
      averageShippingChargeAed: avg.averageChargeAed,
      itemSummary,
      notes,
      source: "merchant",
      actorLabel: merchant.name,
    });

    created++;
  }

  revalidateOperatorSurfaces([`/m/${merchant.token}`]);
  redirect(
    withNotice(
      `/m/${merchant.token}/orders`,
      created > 0 ? "bulk-uploaded" : "bulk-upload-failed",
    ),
  );
}
