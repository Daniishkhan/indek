import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import {
  events,
  getDb,
  manifests,
  merchantProfile,
  merchants,
  parcelFollowUps,
  parcels,
  riderProfile,
  riders,
} from "@indek/db";
import {
  encodeParcelWorkflowNotes,
  failureReasons,
  parseParcelWorkflowNotes,
  requestReviewChecklistFields,
  type FailureReason,
  type RequestReviewChecklist,
} from "@indek/shared";
import type {
  DispatchBoardData,
  EventLogEntry,
  Manifest,
  Merchant,
  MerchantPortalData,
  OperatorIntakeData,
  OperatorOverviewData,
  OpsSnapshot,
  Parcel,
  ParcelFollowUp,
  ProofRequirement,
  RequestReviewQueueData,
  RemittanceCycle,
  RemittanceStatement,
  Rider,
} from "@indek/shared";

const ACTIVE_WORK_STATES = new Set<Parcel["state"]>(["assigned", "in_transit"]);
const REVIEW_QUEUE_STATES = new Set<Parcel["reviewState"]>([
  "under_review",
  "needs_clarification",
  "on_hold",
]);
const RIDER_CUSTODY_STATES = new Set<Parcel["state"]>([
  "assigned",
  "in_transit",
  "failed",
  "in_return",
]);
const FAILURE_REASON_SET = new Set<FailureReason>(failureReasons);
const REVIEW_CHECKLIST_KEYS = requestReviewChecklistFields.map(
  (field) => field.key,
);

const baseParcelSelection = {
  id: parcels.id,
  awb: parcels.awb,
  merchantId: parcels.merchantId,
  riderId: parcels.riderId,
  manifestId: parcels.manifestId,
  customerName: parcels.customerName,
  customerPhone: parcels.customerPhone,
  area: parcels.area,
  address: parcels.address,
  codAmountAed: parcels.codAmountAed,
  deliveryFeeAed: parcels.deliveryFeeAed,
  state: parcels.state,
  reviewState: parcels.reviewState,
  reviewChecklist: parcels.reviewChecklist,
  reviewNote: parcels.reviewNote,
  reviewedAt: parcels.reviewedAt,
  reviewedByLabel: parcels.reviewedByLabel,
  itemSummary: parcels.itemSummary,
  notes: parcels.notes,
  createdAt: parcels.createdAt,
  updatedAt: parcels.updatedAt,
};

type ParcelRow = {
  id: string;
  awb: string;
  merchantId: string;
  merchantName?: string;
  riderId: string | null;
  manifestId: string | null;
  customerName: string;
  customerPhone: string;
  area: string;
  address: string;
  codAmountAed: string | number;
  deliveryFeeAed: string | number | null;
  state: Parcel["state"];
  reviewState: Parcel["reviewState"];
  reviewChecklist: RequestReviewChecklist | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedByLabel: string | null;
  itemSummary: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return 0;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function buildDefaultReviewChecklist() {
  return Object.fromEntries(
    REVIEW_CHECKLIST_KEYS.map((key) => [key, false]),
  ) as RequestReviewChecklist;
}

function normalizeReviewChecklist(
  input?: Partial<RequestReviewChecklist> | null,
): RequestReviewChecklist {
  const normalized = buildDefaultReviewChecklist();

  for (const key of REVIEW_CHECKLIST_KEYS) {
    normalized[key] = Boolean(input?.[key]);
  }

  return normalized;
}

function buildApprovedReviewChecklist() {
  return Object.fromEntries(
    REVIEW_CHECKLIST_KEYS.map((key) => [key, true]),
  ) as RequestReviewChecklist;
}

function isReviewChecklistComplete(checklist: RequestReviewChecklist) {
  return REVIEW_CHECKLIST_KEYS.every((key) => checklist[key]);
}

function isDispatchReadyParcel(parcel: Pick<Parcel, "state" | "reviewState">) {
  return (
    parcel.state === "unassigned" && parcel.reviewState === "dispatch_ready"
  );
}

function isReviewQueueParcel(parcel: Pick<Parcel, "state" | "reviewState">) {
  return (
    parcel.state === "unassigned" && REVIEW_QUEUE_STATES.has(parcel.reviewState)
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function buildMerchantToken(name: string) {
  const stem = slugify(name) || "merchant";
  return `${stem}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

function buildAwb() {
  const dayStamp = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `IDK-${dayStamp}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function formatMerchant(row: typeof merchants.$inferSelect): Merchant {
  return {
    id: row.id,
    name: row.name,
    token: row.token,
    remittanceCycle: row.remittanceCycle,
    proofRequirement: row.proofRequirement,
    codFeePercent: toNumber(row.codFeePercent),
    deliveryFeeAed: toNumber(row.deliveryFeeAed),
    fulfillmentMode: row.fulfillmentMode,
    pickupAddress: row.pickupAddress ?? undefined,
    disputeWindowDays: row.disputeWindowDays,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function formatParcelFollowUp(row: {
  id: string;
  parcelId: string;
  message: string;
  status: ParcelFollowUp["status"];
  createdAt: Date;
  createdByLabel: string | null;
  resolvedAt: Date | null;
  resolvedByLabel: string | null;
}): ParcelFollowUp {
  return {
    id: row.id,
    parcelId: row.parcelId,
    message: row.message,
    status: row.status,
    createdAt: toIso(row.createdAt),
    createdByLabel: row.createdByLabel ?? "Operator",
    resolvedAt: row.resolvedAt ? toIso(row.resolvedAt) : undefined,
    resolvedByLabel: row.resolvedByLabel ?? undefined,
  };
}

function formatParcel(row: ParcelRow, latestFollowUp?: ParcelFollowUp): Parcel {
  const workflowNotes = parseParcelWorkflowNotes(row.notes);

  return {
    id: row.id,
    awb: row.awb,
    merchantId: row.merchantId,
    merchantName: row.merchantName,
    riderId: row.riderId ?? undefined,
    manifestId: row.manifestId ?? undefined,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    area: row.area,
    address: row.address,
    pickupAddress: workflowNotes.pickupAddress,
    codAmountAed: roundCurrency(toNumber(row.codAmountAed)),
    deliveryFeeAed: row.deliveryFeeAed
      ? roundCurrency(toNumber(row.deliveryFeeAed))
      : undefined,
    averageShippingChargeAed: workflowNotes.averageShippingChargeAed,
    state: row.state,
    reviewState: row.reviewState,
    reviewChecklist: row.reviewChecklist
      ? normalizeReviewChecklist(row.reviewChecklist)
      : undefined,
    reviewNote: row.reviewNote ?? undefined,
    reviewedAt: row.reviewedAt ? toIso(row.reviewedAt) : undefined,
    reviewedByLabel: row.reviewedByLabel ?? undefined,
    latestFollowUp,
    lastUpdateAt: toIso(row.updatedAt),
    itemSummary: row.itemSummary ?? "Parcel request",
    notes: workflowNotes.customerNotes,
    createdAt: toIso(row.createdAt),
  };
}

function formatRider(
  row: typeof riders.$inferSelect,
  parcelRows: Array<{
    state: Parcel["state"];
    codAmountAed: string | number;
    updatedAt: Date;
  }>,
): Rider {
  let parcelsInCustody = 0;
  let deliveredToday = 0;
  let cashHeldAed = 0;
  let lastEventAt = row.updatedAt;

  for (const parcel of parcelRows) {
    if (RIDER_CUSTODY_STATES.has(parcel.state)) {
      parcelsInCustody += 1;
    }

    if (parcel.state === "delivered") {
      deliveredToday += 1;
      cashHeldAed += toNumber(parcel.codAmountAed);
    }

    if (parcel.updatedAt > lastEventAt) {
      lastEventAt = parcel.updatedAt;
    }
  }

  return {
    id: row.id,
    name: row.name,
    zone: row.zone,
    status: row.status,
    parcelsInCustody,
    deliveredToday,
    cashHeldAed: roundCurrency(cashHeldAed),
    lastEventAt: toIso(lastEventAt),
    personalFloatAed: roundCurrency(toNumber(row.personalFloatAed)),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function formatManifest(
  row: typeof manifests.$inferSelect,
  parcelRows: Array<{
    id: string;
    merchantId: string;
    area: string;
    codAmountAed: string | number;
  }>,
  riderName?: string,
): Manifest {
  const areas = Array.from(new Set(parcelRows.map((parcel) => parcel.area)));
  const merchantIds = new Set(parcelRows.map((parcel) => parcel.merchantId));
  const expectedCodAed = parcelRows.reduce(
    (sum, parcel) => sum + toNumber(parcel.codAmountAed),
    0,
  );

  return {
    id: row.id,
    riderId: row.riderId,
    riderName,
    pickupCount: merchantIds.size,
    parcelIds: parcelRows.map((parcel) => parcel.id),
    expectedCodAed: roundCurrency(expectedCodAed),
    zoneSummary: row.zoneSummary ?? areas.join(", "),
    accepted: Boolean(row.acceptedAt),
    createdAt: toIso(row.createdAt),
  };
}

function buildRemittanceStatement(
  merchant: Merchant,
  deliveredParcels: Parcel[],
): RemittanceStatement | undefined {
  if (deliveredParcels.length === 0) {
    return undefined;
  }

  const lines = deliveredParcels.map((parcel) => {
    const handlingFeeAed = roundCurrency(
      parcel.codAmountAed * merchant.codFeePercent,
    );

    return {
      parcelId: parcel.id,
      awb: parcel.awb,
      codAed: parcel.codAmountAed,
      deliveryFeeAed: parcel.deliveryFeeAed ?? merchant.deliveryFeeAed,
      handlingFeeAed,
    };
  });

  const feeSubtotal = lines.reduce(
    (sum, line) => sum + line.deliveryFeeAed + line.handlingFeeAed,
    0,
  );
  const vatAed = roundCurrency(feeSubtotal * 0.05);
  const grossCod = lines.reduce((sum, line) => sum + line.codAed, 0);

  return {
    merchantId: merchant.id,
    cycleLabel: "Current open cycle",
    vatAed,
    netPayableAed: roundCurrency(grossCod - feeSubtotal - vatAed),
    heldAmountAed: 0,
    lines,
  };
}

async function buildMerchantPortalData(
  merchant: Merchant,
): Promise<MerchantPortalData> {
  const [merchantParcels, remittance] = await Promise.all([
    getParcelsForMerchant(merchant.id),
    getRemittanceForMerchant(merchant.id),
  ]);

  return {
    merchant,
    parcels: merchantParcels,
    remittance,
    summary: {
      activeCount: merchantParcels.filter((parcel) =>
        ACTIVE_WORK_STATES.has(parcel.state),
      ).length,
      deliveredCount: merchantParcels.filter(
        (parcel) => parcel.state === "delivered",
      ).length,
      failedCount: merchantParcels.filter((parcel) => parcel.state === "failed")
        .length,
      underReviewCount: merchantParcels.filter(
        (parcel) =>
          parcel.state === "unassigned" &&
          parcel.reviewState === "under_review",
      ).length,
      needsClarificationCount: merchantParcels.filter(
        (parcel) =>
          parcel.state === "unassigned" &&
          parcel.reviewState === "needs_clarification",
      ).length,
      awaitingAssignmentCount: merchantParcels.filter((parcel) =>
        isDispatchReadyParcel(parcel),
      ).length,
    },
  };
}

async function getMerchantIdForUser(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ merchantId: merchantProfile.merchantId })
    .from(merchantProfile)
    .where(eq(merchantProfile.userId, userId))
    .limit(1);

  return rows[0]?.merchantId;
}

async function getRiderIdForUser(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ riderId: riderProfile.riderId })
    .from(riderProfile)
    .where(eq(riderProfile.userId, userId))
    .limit(1);

  return rows[0]?.riderId;
}

async function getParcelRowsByManifestIds(manifestIds: string[]) {
  if (manifestIds.length === 0) return [];

  const db = getDb();
  return db
    .select({
      id: parcels.id,
      manifestId: parcels.manifestId,
      merchantId: parcels.merchantId,
      area: parcels.area,
      codAmountAed: parcels.codAmountAed,
    })
    .from(parcels)
    .where(inArray(parcels.manifestId, manifestIds));
}

async function getLatestFollowUpsByParcelIds(parcelIds: string[]) {
  if (parcelIds.length === 0) {
    return new Map<string, ParcelFollowUp>();
  }

  const db = getDb();
  const rows = await db
    .select({
      id: parcelFollowUps.id,
      parcelId: parcelFollowUps.parcelId,
      message: parcelFollowUps.message,
      status: parcelFollowUps.status,
      createdAt: parcelFollowUps.createdAt,
      createdByLabel: parcelFollowUps.createdByLabel,
      resolvedAt: parcelFollowUps.resolvedAt,
      resolvedByLabel: parcelFollowUps.resolvedByLabel,
    })
    .from(parcelFollowUps)
    .where(inArray(parcelFollowUps.parcelId, parcelIds))
    .orderBy(desc(parcelFollowUps.createdAt));

  const latestByParcel = new Map<string, ParcelFollowUp>();
  for (const row of rows) {
    if (!latestByParcel.has(row.parcelId)) {
      latestByParcel.set(row.parcelId, formatParcelFollowUp(row));
    }
  }

  return latestByParcel;
}

async function hydrateParcels(rows: ParcelRow[]) {
  const latestFollowUps = await getLatestFollowUpsByParcelIds(
    rows.map((row) => row.id),
  );

  return rows.map((row) => formatParcel(row, latestFollowUps.get(row.id)));
}

export async function listMerchants(): Promise<Merchant[]> {
  const db = getDb();
  const rows = await db.select().from(merchants).orderBy(asc(merchants.name));
  return rows.map(formatMerchant);
}

export async function listParcels(): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .orderBy(desc(parcels.createdAt));

  return hydrateParcels(rows);
}

export async function listUnassignedParcels(): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.state, "unassigned"))
    .orderBy(desc(parcels.createdAt));

  return hydrateParcels(rows);
}

export async function listReviewQueueParcels(): Promise<Parcel[]> {
  const unassigned = await listUnassignedParcels();
  return unassigned.filter((parcel) => isReviewQueueParcel(parcel));
}

export async function listDispatchReadyParcels(): Promise<Parcel[]> {
  const unassigned = await listUnassignedParcels();
  return unassigned.filter((parcel) => isDispatchReadyParcel(parcel));
}

export async function listRiders(): Promise<Rider[]> {
  const db = getDb();
  const riderRows = await db.select().from(riders).orderBy(asc(riders.name));

  if (riderRows.length === 0) {
    return [];
  }

  const riderIds = riderRows.map((rider) => rider.id);
  const parcelRows = await db
    .select({
      riderId: parcels.riderId,
      state: parcels.state,
      codAmountAed: parcels.codAmountAed,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .where(inArray(parcels.riderId, riderIds));

  const parcelsByRider = new Map<string, typeof parcelRows>();
  for (const riderId of riderIds) {
    parcelsByRider.set(riderId, []);
  }

  for (const parcel of parcelRows) {
    if (!parcel.riderId) continue;
    parcelsByRider.get(parcel.riderId)?.push(parcel);
  }

  return riderRows.map((rider) =>
    formatRider(rider, parcelsByRider.get(rider.id) ?? []),
  );
}

export async function listActiveManifests(): Promise<Manifest[]> {
  const db = getDb();
  const manifestRows = await db
    .select()
    .from(manifests)
    .orderBy(desc(manifests.createdAt));

  if (manifestRows.length === 0) {
    return [];
  }

  const riderIds = Array.from(
    new Set(manifestRows.map((manifest) => manifest.riderId)),
  );
  const [riderRows, parcelRows] = await Promise.all([
    db
      .select({ id: riders.id, name: riders.name })
      .from(riders)
      .where(inArray(riders.id, riderIds)),
    getParcelRowsByManifestIds(manifestRows.map((manifest) => manifest.id)),
  ]);

  const riderNameMap = new Map(
    riderRows.map((rider) => [rider.id, rider.name]),
  );
  const parcelsByManifest = new Map<string, typeof parcelRows>();
  for (const manifest of manifestRows) {
    parcelsByManifest.set(manifest.id, []);
  }

  for (const parcel of parcelRows) {
    if (!parcel.manifestId) continue;
    parcelsByManifest.get(parcel.manifestId)?.push(parcel);
  }

  return manifestRows.map((manifest) =>
    formatManifest(
      manifest,
      parcelsByManifest.get(manifest.id) ?? [],
      riderNameMap.get(manifest.riderId),
    ),
  );
}

export async function getRiderById(
  riderId: string,
): Promise<Rider | undefined> {
  const ridersList = await listRiders();
  return ridersList.find((rider) => rider.id === riderId);
}

export async function getManifestForRider(
  riderId: string,
): Promise<Manifest | undefined> {
  const manifestList = await listActiveManifests();
  return manifestList.find((manifest) => manifest.riderId === riderId);
}

export async function getParcelsForRider(riderId: string): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.riderId, riderId))
    .orderBy(desc(parcels.updatedAt));

  return hydrateParcels(rows);
}

export async function getParcelForRider(
  parcelId: string,
  riderUserId: string,
): Promise<Parcel | undefined> {
  const riderId = await getRiderIdForUser(riderUserId);
  if (!riderId) return undefined;

  const db = getDb();
  const rows = await db
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(and(eq(parcels.id, parcelId), eq(parcels.riderId, riderId)));

  const hydrated = await hydrateParcels(rows);
  return hydrated[0];
}

export async function getMerchantById(
  merchantId: string,
): Promise<Merchant | undefined> {
  const db = getDb();
  const row = await db.query.merchants.findFirst({
    where: eq(merchants.id, merchantId),
  });

  return row ? formatMerchant(row) : undefined;
}

export async function getMerchantByToken(
  token: string,
): Promise<Merchant | undefined> {
  const db = getDb();
  const row = await db.query.merchants.findFirst({
    where: eq(merchants.token, token),
  });

  return row ? formatMerchant(row) : undefined;
}

export async function getMerchantForUser(
  userId: string,
): Promise<Merchant | undefined> {
  const merchantId = await getMerchantIdForUser(userId);
  if (!merchantId) return undefined;
  return getMerchantById(merchantId);
}

export async function getParcelsForMerchant(
  merchantId: string,
): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.merchantId, merchantId))
    .orderBy(desc(parcels.createdAt));

  return hydrateParcels(rows);
}

export async function getEventLogForParcel(
  parcelId: string,
): Promise<EventLogEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.parcelId, parcelId))
    .orderBy(desc(events.occurredAt));

  return rows.map((event) => ({
    id: event.id,
    parcelId: event.parcelId,
    type: event.type,
    actor: event.actorLabel ?? "Indek",
    timestamp: toIso(event.occurredAt),
    location: event.location ?? "Dispatch desk",
    proof: event.proof ?? undefined,
  }));
}

export async function getRemittanceForMerchant(
  merchantId: string,
): Promise<RemittanceStatement | undefined> {
  const merchant = await getMerchantById(merchantId);
  if (!merchant) return undefined;

  const parcelsForMerchant = await getParcelsForMerchant(merchantId);
  return buildRemittanceStatement(
    merchant,
    parcelsForMerchant.filter((parcel) => parcel.state === "delivered"),
  );
}

export async function getRequestReviewQueueData(): Promise<RequestReviewQueueData> {
  const [queue, dispatchReady] = await Promise.all([
    listReviewQueueParcels(),
    listDispatchReadyParcels(),
  ]);

  return {
    queue,
    dispatchReady,
    summary: {
      underReviewCount: queue.filter(
        (parcel) => parcel.reviewState === "under_review",
      ).length,
      needsClarificationCount: queue.filter(
        (parcel) => parcel.reviewState === "needs_clarification",
      ).length,
      onHoldCount: queue.filter((parcel) => parcel.reviewState === "on_hold")
        .length,
      dispatchReadyCount: dispatchReady.length,
    },
  };
}

export async function getOpsSnapshot(): Promise<OpsSnapshot> {
  const [merchantRows, riderRows, parcelRows, manifestRows] = await Promise.all(
    [listMerchants(), listRiders(), listParcels(), listActiveManifests()],
  );

  return {
    merchantCount: merchantRows.length,
    riderCount: riderRows.length,
    activeDeliveries: parcelRows.filter(
      (parcel) => parcel.state === "in_transit",
    ).length,
    failedAttempts: parcelRows.filter((parcel) => parcel.state === "failed")
      .length,
    unassigned: parcelRows.filter((parcel) => parcel.state === "unassigned")
      .length,
    reviewQueue: parcelRows.filter((parcel) => isReviewQueueParcel(parcel))
      .length,
    needsClarification: parcelRows.filter(
      (parcel) =>
        parcel.state === "unassigned" &&
        parcel.reviewState === "needs_clarification",
    ).length,
    onHold: parcelRows.filter(
      (parcel) =>
        parcel.state === "unassigned" && parcel.reviewState === "on_hold",
    ).length,
    dispatchReady: parcelRows.filter((parcel) => isDispatchReadyParcel(parcel))
      .length,
    activeManifests: manifestRows.length,
    codExposureAed: roundCurrency(
      riderRows.reduce((sum, rider) => sum + rider.cashHeldAed, 0),
    ),
  };
}

export async function getOperatorOverviewData(): Promise<OperatorOverviewData> {
  const [
    snapshot,
    merchantsList,
    riderList,
    manifestList,
    unassigned,
    reviewQueue,
    dispatchReady,
    recentParcels,
  ] = await Promise.all([
    getOpsSnapshot(),
    listMerchants(),
    listRiders(),
    listActiveManifests(),
    listUnassignedParcels(),
    listReviewQueueParcels(),
    listDispatchReadyParcels(),
    listParcels(),
  ]);

  return {
    snapshot,
    merchants: merchantsList,
    riders: riderList,
    manifests: manifestList,
    unassigned,
    reviewQueue,
    dispatchReady,
    recentParcels: recentParcels.slice(0, 8),
  };
}

export async function getOperatorIntakeData(): Promise<OperatorIntakeData> {
  const [merchantsList, riderList, queue, dispatchReady, recentParcels] =
    await Promise.all([
      listMerchants(),
      listRiders(),
      listReviewQueueParcels(),
      listDispatchReadyParcels(),
      listParcels(),
    ]);

  return {
    merchants: merchantsList,
    riders: riderList,
    queue,
    dispatchReady,
    recentParcels: recentParcels.slice(0, 6),
  };
}

export async function getDispatchBoardData(): Promise<DispatchBoardData> {
  const [riderList, parcelList, manifestList] = await Promise.all([
    listRiders(),
    listDispatchReadyParcels(),
    listActiveManifests(),
  ]);

  return {
    riders: riderList,
    parcels: parcelList,
    manifests: manifestList,
  };
}

export async function getMerchantPortalData(
  token: string,
): Promise<MerchantPortalData | undefined> {
  const merchant = await getMerchantByToken(token);
  if (!merchant) return undefined;

  return buildMerchantPortalData(merchant);
}

export async function getMerchantPortalDataForUser(
  userId: string,
): Promise<MerchantPortalData | undefined> {
  const merchant = await getMerchantForUser(userId);
  if (!merchant) return undefined;
  return buildMerchantPortalData(merchant);
}

export async function getRiderForUser(
  userId: string,
): Promise<Rider | undefined> {
  const riderId = await getRiderIdForUser(userId);
  if (!riderId) return undefined;
  return getRiderById(riderId);
}

export async function getRiderDashboardDataForUser(userId: string) {
  const riderId = await getRiderIdForUser(userId);
  if (!riderId) return undefined;

  const [rider, manifest, riderParcels] = await Promise.all([
    getRiderById(riderId),
    getManifestForRider(riderId),
    getParcelsForRider(riderId),
  ]);

  if (!rider) {
    return undefined;
  }

  return {
    rider,
    manifest,
    parcels: riderParcels,
  };
}

export async function createMerchant(input: {
  name: string;
  remittanceCycle: RemittanceCycle;
  proofRequirement: ProofRequirement;
  codFeePercent: number;
  deliveryFeeAed: number;
  disputeWindowDays: number;
}) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(merchants)
    .values({
      id: buildId("m"),
      name: input.name.trim(),
      token: buildMerchantToken(input.name),
      remittanceCycle: input.remittanceCycle,
      proofRequirement: input.proofRequirement,
      codFeePercent: Math.max(0, input.codFeePercent).toFixed(4),
      deliveryFeeAed: roundCurrency(input.deliveryFeeAed).toFixed(2),
      disputeWindowDays: input.disputeWindowDays,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return formatMerchant(row);
}

export async function createMerchantWithProfile(input: {
  userId: string;
  name: string;
}) {
  const db = getDb();
  const now = new Date();
  const merchantId = buildId("m");

  await db.transaction(async (tx) => {
    await tx.insert(merchants).values({
      id: merchantId,
      name: input.name.trim(),
      token: buildMerchantToken(input.name),
      remittanceCycle: "weekly",
      proofRequirement: "photo",
      codFeePercent: "0.0500",
      deliveryFeeAed: "15.00",
      disputeWindowDays: 7,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(merchantProfile).values({
      userId: input.userId,
      merchantId,
    });
  });

  const row = await db.query.merchants.findFirst({
    where: eq(merchants.id, merchantId),
  });

  return row ? formatMerchant(row) : undefined;
}

export async function updateMerchantFulfillment(
  merchantId: string,
  fulfillmentMode: "pickup" | "dropoff",
  pickupAddress?: string,
) {
  const db = getDb();
  await db
    .update(merchants)
    .set({
      fulfillmentMode,
      pickupAddress: pickupAddress?.trim() ?? null,
      updatedAt: new Date(),
    })
    .where(eq(merchants.id, merchantId));
}

export async function createRider(input: {
  name: string;
  zone: string;
  status: Rider["status"];
  personalFloatAed: number;
}) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(riders)
    .values({
      id: buildId("r"),
      name: input.name.trim(),
      zone: input.zone.trim(),
      status: input.status,
      personalFloatAed: roundCurrency(input.personalFloatAed).toFixed(2),
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return formatRider(row, []);
}

export async function createParcel(input: {
  merchantId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  area: string;
  address: string;
  codAmountAed: number;
  averageShippingChargeAed?: number;
  itemSummary: string;
  notes?: string;
  source: "operator" | "merchant";
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const now = new Date();
  const parcelId = buildId("p");
  const pickupAddress = input.pickupAddress.trim();
  const averageShippingChargeAed =
    typeof input.averageShippingChargeAed === "number"
      ? roundCurrency(input.averageShippingChargeAed)
      : undefined;
  const storedNotes = encodeParcelWorkflowNotes({
    pickupAddress,
    averageShippingChargeAed,
    customerNotes: input.notes,
  });
  const reviewState =
    input.source === "merchant" ? "under_review" : "dispatch_ready";
  const reviewChecklist =
    input.source === "operator" ? buildApprovedReviewChecklist() : null;

  await db.transaction(async (tx) => {
    await tx.insert(parcels).values({
      id: parcelId,
      awb: buildAwb(),
      merchantId: input.merchantId,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      area: input.area.trim(),
      address: input.address.trim(),
      codAmountAed: roundCurrency(input.codAmountAed).toFixed(2),
      state: "unassigned",
      reviewState,
      reviewChecklist,
      reviewedAt: input.source === "operator" ? now : null,
      reviewedByUserId:
        input.source === "operator" ? (input.actorUserId ?? null) : null,
      reviewedByLabel:
        input.source === "operator" ? (input.actorLabel ?? "Operator") : null,
      itemSummary: input.itemSummary.trim(),
      notes: storedNotes ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(events).values({
      id: buildId("evt"),
      parcelId,
      type:
        input.source === "merchant" ? "request.submitted" : "parcel.created",
      actorUserId: input.actorUserId ?? null,
      actorLabel:
        input.actorLabel ??
        (input.source === "merchant" ? "Merchant portal" : "Operator"),
      location: input.area.trim(),
      payload: {
        source: input.source,
        pickupAddress,
        averageShippingChargeAed,
        reviewState,
      },
      occurredAt: now,
    });
  });

  const rows = await getDb()
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.id, parcelId));

  return rows[0] ? (await hydrateParcels(rows))[0] : undefined;
}

export async function approveParcelForDispatch(input: {
  parcelId: string;
  checklist: Partial<RequestReviewChecklist>;
  note?: string;
  deliveryFeeAed?: number;
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const checklist = normalizeReviewChecklist(input.checklist);

  if (!isReviewChecklistComplete(checklist)) {
    throw new Error(
      "Complete the review checklist before approving this request for dispatch.",
    );
  }

  return db.transaction(async (tx) => {
    const parcel = await tx.query.parcels.findFirst({
      where: eq(parcels.id, input.parcelId),
    });

    if (!parcel) {
      throw new Error("That request could not be found.");
    }

    if (parcel.state !== "unassigned") {
      throw new Error("Only unassigned requests can be reviewed.");
    }

    const now = new Date();
    const reviewNote = input.note?.trim() || null;

    await tx
      .update(parcels)
      .set({
        reviewState: "dispatch_ready",
        reviewChecklist: checklist,
        reviewNote,
        ...(input.deliveryFeeAed != null
          ? { deliveryFeeAed: roundCurrency(input.deliveryFeeAed).toFixed(2) }
          : {}),
        reviewedAt: now,
        reviewedByUserId: input.actorUserId ?? null,
        reviewedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(eq(parcels.id, input.parcelId));

    await tx
      .update(parcelFollowUps)
      .set({
        status: "resolved",
        resolvedAt: now,
        resolvedByUserId: input.actorUserId ?? null,
        resolvedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelFollowUps.parcelId, input.parcelId),
          eq(parcelFollowUps.status, "open"),
        ),
      );

    await tx.insert(events).values([
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.reviewed",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          reviewState: "dispatch_ready",
          checklist,
          note: reviewNote,
        },
        occurredAt: now,
      },
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.approved_for_dispatch",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          checklist,
        },
        occurredAt: now,
      },
    ]);

    return { parcelId: input.parcelId };
  });
}

export async function sendParcelFollowUp(input: {
  parcelId: string;
  checklist?: Partial<RequestReviewChecklist>;
  message: string;
  note?: string;
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const message = input.message.trim();
  if (!message) {
    throw new Error("A follow-up message is required.");
  }

  return db.transaction(async (tx) => {
    const parcel = await tx.query.parcels.findFirst({
      where: eq(parcels.id, input.parcelId),
    });

    if (!parcel) {
      throw new Error("That request could not be found.");
    }

    if (parcel.state !== "unassigned") {
      throw new Error(
        "Only unassigned requests can be sent for clarification.",
      );
    }

    const now = new Date();
    const checklist = normalizeReviewChecklist(input.checklist);
    const reviewNote = input.note?.trim() || null;

    await tx
      .update(parcelFollowUps)
      .set({
        status: "resolved",
        resolvedAt: now,
        resolvedByUserId: input.actorUserId ?? null,
        resolvedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelFollowUps.parcelId, input.parcelId),
          eq(parcelFollowUps.status, "open"),
        ),
      );

    const followUpId = buildId("fu");
    await tx.insert(parcelFollowUps).values({
      id: followUpId,
      parcelId: input.parcelId,
      message,
      status: "open",
      createdByUserId: input.actorUserId ?? null,
      createdByLabel: input.actorLabel ?? "Operator",
      createdAt: now,
      updatedAt: now,
    });

    await tx
      .update(parcels)
      .set({
        reviewState: "needs_clarification",
        reviewChecklist: checklist,
        reviewNote,
        reviewedAt: now,
        reviewedByUserId: input.actorUserId ?? null,
        reviewedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(eq(parcels.id, input.parcelId));

    await tx.insert(events).values([
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.reviewed",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          reviewState: "needs_clarification",
          checklist,
          note: reviewNote,
        },
        occurredAt: now,
      },
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.needs_clarification",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          followUpId,
          message,
        },
        occurredAt: now,
      },
    ]);

    return { followUpId, parcelId: input.parcelId };
  });
}

export async function holdParcelRequest(input: {
  parcelId: string;
  checklist?: Partial<RequestReviewChecklist>;
  note?: string;
  message?: string;
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const reviewNote = input.note?.trim() || null;
  const message = input.message?.trim() || null;

  if (!reviewNote && !message) {
    throw new Error(
      "Add a hold reason or merchant-facing message before holding.",
    );
  }

  return db.transaction(async (tx) => {
    const parcel = await tx.query.parcels.findFirst({
      where: eq(parcels.id, input.parcelId),
    });

    if (!parcel) {
      throw new Error("That request could not be found.");
    }

    if (parcel.state !== "unassigned") {
      throw new Error("Only unassigned requests can be held.");
    }

    const now = new Date();
    const checklist = normalizeReviewChecklist(input.checklist);

    await tx
      .update(parcelFollowUps)
      .set({
        status: "resolved",
        resolvedAt: now,
        resolvedByUserId: input.actorUserId ?? null,
        resolvedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelFollowUps.parcelId, input.parcelId),
          eq(parcelFollowUps.status, "open"),
        ),
      );

    let followUpId: string | undefined;
    if (message) {
      followUpId = buildId("fu");
      await tx.insert(parcelFollowUps).values({
        id: followUpId,
        parcelId: input.parcelId,
        message,
        status: "open",
        createdByUserId: input.actorUserId ?? null,
        createdByLabel: input.actorLabel ?? "Operator",
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx
      .update(parcels)
      .set({
        reviewState: "on_hold",
        reviewChecklist: checklist,
        reviewNote,
        reviewedAt: now,
        reviewedByUserId: input.actorUserId ?? null,
        reviewedByLabel: input.actorLabel ?? "Operator",
        updatedAt: now,
      })
      .where(eq(parcels.id, input.parcelId));

    await tx.insert(events).values([
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.reviewed",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          reviewState: "on_hold",
          checklist,
          note: reviewNote,
        },
        occurredAt: now,
      },
      {
        id: buildId("evt"),
        parcelId: input.parcelId,
        type: "request.on_hold",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: parcel.area,
        payload: {
          followUpId,
          message,
          note: reviewNote,
        },
        occurredAt: now,
      },
    ]);

    return { followUpId, parcelId: input.parcelId };
  });
}

export async function updateParcelRequestByMerchant(input: {
  parcelId: string;
  merchantId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  area: string;
  address: string;
  codAmountAed: number;
  averageShippingChargeAed?: number;
  itemSummary: string;
  notes?: string;
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const now = new Date();
  const pickupAddress = input.pickupAddress.trim();
  const averageShippingChargeAed =
    typeof input.averageShippingChargeAed === "number"
      ? roundCurrency(input.averageShippingChargeAed)
      : undefined;
  const storedNotes = encodeParcelWorkflowNotes({
    pickupAddress,
    averageShippingChargeAed,
    customerNotes: input.notes,
  });

  await db.transaction(async (tx) => {
    const parcel = await tx.query.parcels.findFirst({
      where: and(
        eq(parcels.id, input.parcelId),
        eq(parcels.merchantId, input.merchantId),
      ),
    });

    if (!parcel) {
      throw new Error("That request could not be found for this merchant.");
    }

    if (parcel.state !== "unassigned") {
      throw new Error(
        "Only unassigned requests can be updated by the merchant.",
      );
    }

    await tx
      .update(parcels)
      .set({
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        area: input.area.trim(),
        address: input.address.trim(),
        codAmountAed: roundCurrency(input.codAmountAed).toFixed(2),
        reviewState: "under_review",
        reviewChecklist: null,
        reviewNote: null,
        reviewedAt: null,
        reviewedByUserId: null,
        reviewedByLabel: null,
        itemSummary: input.itemSummary.trim(),
        notes: storedNotes ?? null,
        updatedAt: now,
      })
      .where(eq(parcels.id, input.parcelId));

    await tx
      .update(parcelFollowUps)
      .set({
        status: "resolved",
        resolvedAt: now,
        resolvedByUserId: input.actorUserId ?? null,
        resolvedByLabel: input.actorLabel ?? "Merchant",
        updatedAt: now,
      })
      .where(
        and(
          eq(parcelFollowUps.parcelId, input.parcelId),
          eq(parcelFollowUps.status, "open"),
        ),
      );

    await tx.insert(events).values({
      id: buildId("evt"),
      parcelId: input.parcelId,
      type: "request.updated_by_merchant",
      actorUserId: input.actorUserId ?? null,
      actorLabel: input.actorLabel ?? "Merchant",
      location: input.area.trim(),
      payload: {
        pickupAddress,
        averageShippingChargeAed,
        reviewState: "under_review",
      },
      occurredAt: now,
    });
  });

  const rows = await getDb()
    .select({
      ...baseParcelSelection,
      merchantName: merchants.name,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.id, input.parcelId));

  return rows[0] ? (await hydrateParcels(rows))[0] : undefined;
}

export async function assignManifest(input: {
  riderId: string;
  parcelIds: string[];
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const parcelIds = Array.from(new Set(input.parcelIds.filter(Boolean)));

  if (parcelIds.length === 0) {
    throw new Error("Select at least one parcel before assigning a manifest.");
  }

  return db.transaction(async (tx) => {
    const selectedParcels = await tx
      .select({
        id: parcels.id,
        merchantId: parcels.merchantId,
        area: parcels.area,
        codAmountAed: parcels.codAmountAed,
        state: parcels.state,
        reviewState: parcels.reviewState,
      })
      .from(parcels)
      .where(inArray(parcels.id, parcelIds));

    if (selectedParcels.length !== parcelIds.length) {
      throw new Error("One or more selected parcels could not be found.");
    }

    if (selectedParcels.some((parcel) => !isDispatchReadyParcel(parcel))) {
      throw new Error(
        "Only dispatch-ready parcels can be added to a new manifest.",
      );
    }

    const now = new Date();
    const manifestId = buildId("man");
    const zoneSummary = Array.from(
      new Set(selectedParcels.map((parcel) => parcel.area)),
    ).join(", ");

    const [manifestRow] = await tx
      .insert(manifests)
      .values({
        id: manifestId,
        riderId: input.riderId,
        zoneSummary,
        createdAt: now,
      })
      .returning();

    await tx
      .update(parcels)
      .set({
        riderId: input.riderId,
        manifestId,
        state: "assigned",
        updatedAt: now,
      })
      .where(inArray(parcels.id, parcelIds));

    await tx.insert(events).values(
      selectedParcels.map((parcel) => ({
        id: buildId("evt"),
        parcelId: parcel.id,
        type: "manifest.assigned",
        actorUserId: input.actorUserId ?? null,
        actorLabel: input.actorLabel ?? "Operator",
        location: zoneSummary,
        payload: { manifestId, riderId: input.riderId },
        occurredAt: now,
      })),
    );

    const riderRow = await tx.query.riders.findFirst({
      where: eq(riders.id, input.riderId),
    });

    return formatManifest(
      manifestRow,
      selectedParcels.map((parcel) => ({
        id: parcel.id,
        merchantId: parcel.merchantId,
        area: parcel.area,
        codAmountAed: parcel.codAmountAed,
      })),
      riderRow?.name,
    );
  });
}

export async function acceptManifest(
  manifestId: string,
  riderUserId: string,
  actorLabel = "Rider",
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [riderLink] = await tx
      .select({
        riderId: riderProfile.riderId,
        riderName: riders.name,
      })
      .from(riderProfile)
      .innerJoin(riders, eq(riderProfile.riderId, riders.id))
      .where(eq(riderProfile.userId, riderUserId))
      .limit(1);

    if (!riderLink) {
      throw new Error("No rider profile is linked to this account.");
    }

    const manifest = await tx.query.manifests.findFirst({
      where: and(
        eq(manifests.id, manifestId),
        eq(manifests.riderId, riderLink.riderId),
      ),
    });

    if (!manifest) {
      throw new Error("This manifest is not assigned to the signed-in rider.");
    }

    if (manifest.acceptedAt) {
      throw new Error("This manifest has already been accepted.");
    }

    const manifestParcels = await tx
      .select({
        id: parcels.id,
        merchantId: parcels.merchantId,
        state: parcels.state,
      })
      .from(parcels)
      .where(
        and(
          eq(parcels.manifestId, manifestId),
          eq(parcels.riderId, riderLink.riderId),
        ),
      );

    const assignedParcels = manifestParcels.filter(
      (parcel) => parcel.state === "assigned",
    );

    if (assignedParcels.length === 0) {
      throw new Error("There are no assigned parcels left on this manifest.");
    }

    const merchantIds = Array.from(
      new Set(assignedParcels.map((parcel) => parcel.merchantId)),
    );
    const merchantRows =
      merchantIds.length > 0
        ? await tx
            .select({
              id: merchants.id,
              token: merchants.token,
            })
            .from(merchants)
            .where(inArray(merchants.id, merchantIds))
        : [];

    const now = new Date();

    await tx
      .update(manifests)
      .set({
        acceptedAt: now,
      })
      .where(eq(manifests.id, manifestId));

    await tx
      .update(parcels)
      .set({
        state: "in_transit",
        updatedAt: now,
      })
      .where(
        and(
          eq(parcels.manifestId, manifestId),
          eq(parcels.riderId, riderLink.riderId),
          eq(parcels.state, "assigned"),
        ),
      );

    await tx
      .update(riders)
      .set({
        status: "on_shift",
        updatedAt: now,
      })
      .where(eq(riders.id, riderLink.riderId));

    await tx.insert(events).values(
      assignedParcels.map((parcel) => ({
        id: buildId("evt"),
        parcelId: parcel.id,
        type: "parcel.in_transit",
        actorUserId: riderUserId,
        actorLabel,
        location: manifest.zoneSummary ?? "On route",
        payload: { manifestId, state: "in_transit" },
        occurredAt: now,
      })),
    );

    return {
      manifestId,
      merchantTokens: merchantRows.map((merchant) => merchant.token),
      riderId: riderLink.riderId,
    };
  });
}

export async function recordParcelDelivered(
  parcelId: string,
  riderUserId: string,
  actorLabel = "Rider",
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [riderLink] = await tx
      .select({
        riderId: riderProfile.riderId,
      })
      .from(riderProfile)
      .where(eq(riderProfile.userId, riderUserId))
      .limit(1);

    if (!riderLink) {
      throw new Error("No rider profile is linked to this account.");
    }

    const parcel = await tx
      .select({
        id: parcels.id,
        manifestId: parcels.manifestId,
        merchantId: parcels.merchantId,
        state: parcels.state,
      })
      .from(parcels)
      .where(
        and(eq(parcels.id, parcelId), eq(parcels.riderId, riderLink.riderId)),
      )
      .limit(1);

    const currentParcel = parcel[0];

    if (!currentParcel) {
      throw new Error("This parcel is not assigned to the signed-in rider.");
    }

    if (currentParcel.state !== "in_transit") {
      throw new Error("Only in-transit parcels can be marked delivered.");
    }

    const [merchantRow] = await tx
      .select({
        token: merchants.token,
      })
      .from(merchants)
      .where(eq(merchants.id, currentParcel.merchantId))
      .limit(1);

    const now = new Date();

    await tx
      .update(parcels)
      .set({
        state: "delivered",
        updatedAt: now,
      })
      .where(eq(parcels.id, parcelId));

    await tx.insert(events).values({
      id: buildId("evt"),
      parcelId,
      type: "parcel.delivered",
      actorUserId: riderUserId,
      actorLabel,
      location: "Customer doorstep",
      payload: { state: "delivered", manifestId: currentParcel.manifestId },
      occurredAt: now,
    });

    return {
      merchantToken: merchantRow?.token,
      riderId: riderLink.riderId,
    };
  });
}

export async function recordParcelFailed(
  parcelId: string,
  riderUserId: string,
  reason: FailureReason,
  actorLabel = "Rider",
) {
  if (!FAILURE_REASON_SET.has(reason)) {
    throw new Error("A valid failure reason is required.");
  }

  const db = getDb();

  return db.transaction(async (tx) => {
    const [riderLink] = await tx
      .select({
        riderId: riderProfile.riderId,
      })
      .from(riderProfile)
      .where(eq(riderProfile.userId, riderUserId))
      .limit(1);

    if (!riderLink) {
      throw new Error("No rider profile is linked to this account.");
    }

    const parcel = await tx
      .select({
        id: parcels.id,
        manifestId: parcels.manifestId,
        merchantId: parcels.merchantId,
        state: parcels.state,
      })
      .from(parcels)
      .where(
        and(eq(parcels.id, parcelId), eq(parcels.riderId, riderLink.riderId)),
      )
      .limit(1);

    const currentParcel = parcel[0];

    if (!currentParcel) {
      throw new Error("This parcel is not assigned to the signed-in rider.");
    }

    if (currentParcel.state !== "in_transit") {
      throw new Error("Only in-transit parcels can be marked failed.");
    }

    const [merchantRow] = await tx
      .select({
        token: merchants.token,
      })
      .from(merchants)
      .where(eq(merchants.id, currentParcel.merchantId))
      .limit(1);

    const now = new Date();

    await tx
      .update(parcels)
      .set({
        state: "failed",
        updatedAt: now,
      })
      .where(eq(parcels.id, parcelId));

    await tx.insert(events).values({
      id: buildId("evt"),
      parcelId,
      type: "parcel.failed",
      actorUserId: riderUserId,
      actorLabel,
      location: "Delivery attempt",
      payload: {
        state: "failed",
        manifestId: currentParcel.manifestId,
        reason,
      },
      occurredAt: now,
    });

    return {
      merchantToken: merchantRow?.token,
      riderId: riderLink.riderId,
    };
  });
}
