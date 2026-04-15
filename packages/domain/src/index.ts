import { randomUUID } from "node:crypto";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  events,
  getDb,
  manifests,
  merchantProfile,
  merchants,
  parcels,
  riderProfile,
  riders,
} from "@indek/db";
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
  ProofRequirement,
  RemittanceCycle,
  RemittanceStatement,
  Rider,
} from "@indek/shared";

const ACTIVE_CUSTODY_STATES = new Set([
  "assigned",
  "in_transit",
  "failed",
  "in_return",
]);

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
    disputeWindowDays: row.disputeWindowDays,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function formatParcel(row: {
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
  state: Parcel["state"];
  itemSummary: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Parcel {
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
    codAmountAed: roundCurrency(toNumber(row.codAmountAed)),
    state: row.state,
    lastUpdateAt: toIso(row.updatedAt),
    itemSummary: row.itemSummary ?? "Parcel request",
    notes: row.notes ?? undefined,
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
    if (ACTIVE_CUSTODY_STATES.has(parcel.state)) {
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
      deliveryFeeAed: merchant.deliveryFeeAed,
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
        ACTIVE_CUSTODY_STATES.has(parcel.state),
      ).length,
      deliveredCount: merchantParcels.filter(
        (parcel) => parcel.state === "delivered",
      ).length,
      failedCount: merchantParcels.filter((parcel) => parcel.state === "failed")
        .length,
      awaitingAssignmentCount: merchantParcels.filter(
        (parcel) => parcel.state === "unassigned",
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

export async function listMerchants(): Promise<Merchant[]> {
  const db = getDb();
  const rows = await db.select().from(merchants).orderBy(asc(merchants.name));
  return rows.map(formatMerchant);
}

export async function listParcels(): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: parcels.id,
      awb: parcels.awb,
      merchantId: parcels.merchantId,
      merchantName: merchants.name,
      riderId: parcels.riderId,
      manifestId: parcels.manifestId,
      customerName: parcels.customerName,
      customerPhone: parcels.customerPhone,
      area: parcels.area,
      address: parcels.address,
      codAmountAed: parcels.codAmountAed,
      state: parcels.state,
      itemSummary: parcels.itemSummary,
      notes: parcels.notes,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .orderBy(desc(parcels.createdAt));

  return rows.map(formatParcel);
}

export async function listUnassignedParcels(): Promise<Parcel[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: parcels.id,
      awb: parcels.awb,
      merchantId: parcels.merchantId,
      merchantName: merchants.name,
      riderId: parcels.riderId,
      manifestId: parcels.manifestId,
      customerName: parcels.customerName,
      customerPhone: parcels.customerPhone,
      area: parcels.area,
      address: parcels.address,
      codAmountAed: parcels.codAmountAed,
      state: parcels.state,
      itemSummary: parcels.itemSummary,
      notes: parcels.notes,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.state, "unassigned"))
    .orderBy(desc(parcels.createdAt));

  return rows.map(formatParcel);
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
      id: parcels.id,
      awb: parcels.awb,
      merchantId: parcels.merchantId,
      merchantName: merchants.name,
      riderId: parcels.riderId,
      manifestId: parcels.manifestId,
      customerName: parcels.customerName,
      customerPhone: parcels.customerPhone,
      area: parcels.area,
      address: parcels.address,
      codAmountAed: parcels.codAmountAed,
      state: parcels.state,
      itemSummary: parcels.itemSummary,
      notes: parcels.notes,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.riderId, riderId))
    .orderBy(desc(parcels.updatedAt));

  return rows.map(formatParcel);
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
      id: parcels.id,
      awb: parcels.awb,
      merchantId: parcels.merchantId,
      merchantName: merchants.name,
      riderId: parcels.riderId,
      manifestId: parcels.manifestId,
      customerName: parcels.customerName,
      customerPhone: parcels.customerPhone,
      area: parcels.area,
      address: parcels.address,
      codAmountAed: parcels.codAmountAed,
      state: parcels.state,
      itemSummary: parcels.itemSummary,
      notes: parcels.notes,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.merchantId, merchantId))
    .orderBy(desc(parcels.createdAt));

  return rows.map(formatParcel);
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
    recentParcels,
  ] = await Promise.all([
    getOpsSnapshot(),
    listMerchants(),
    listRiders(),
    listActiveManifests(),
    listUnassignedParcels(),
    listParcels(),
  ]);

  return {
    snapshot,
    merchants: merchantsList,
    riders: riderList,
    manifests: manifestList,
    unassigned,
    recentParcels: recentParcels.slice(0, 8),
  };
}

export async function getOperatorIntakeData(): Promise<OperatorIntakeData> {
  const [merchantsList, riderList, queue, recentParcels] = await Promise.all([
    listMerchants(),
    listRiders(),
    listUnassignedParcels(),
    listParcels(),
  ]);

  return {
    merchants: merchantsList,
    riders: riderList,
    queue,
    recentParcels: recentParcels.slice(0, 6),
  };
}

export async function getDispatchBoardData(): Promise<DispatchBoardData> {
  const [riderList, parcelList, manifestList] = await Promise.all([
    listRiders(),
    listUnassignedParcels(),
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
  area: string;
  address: string;
  codAmountAed: number;
  itemSummary: string;
  notes?: string;
  source: "operator" | "merchant";
  actorUserId?: string;
  actorLabel?: string;
}) {
  const db = getDb();
  const now = new Date();
  const parcelId = buildId("p");

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
      itemSummary: input.itemSummary.trim(),
      notes: input.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(events).values({
      id: buildId("evt"),
      parcelId,
      type: input.source === "merchant" ? "parcel.requested" : "parcel.created",
      actorUserId: input.actorUserId ?? null,
      actorLabel:
        input.actorLabel ??
        (input.source === "merchant" ? "Merchant portal" : "Operator"),
      location: input.area.trim(),
      payload: { source: input.source },
      occurredAt: now,
    });
  });

  const rows = await getDb()
    .select({
      id: parcels.id,
      awb: parcels.awb,
      merchantId: parcels.merchantId,
      merchantName: merchants.name,
      riderId: parcels.riderId,
      manifestId: parcels.manifestId,
      customerName: parcels.customerName,
      customerPhone: parcels.customerPhone,
      area: parcels.area,
      address: parcels.address,
      codAmountAed: parcels.codAmountAed,
      state: parcels.state,
      itemSummary: parcels.itemSummary,
      notes: parcels.notes,
      createdAt: parcels.createdAt,
      updatedAt: parcels.updatedAt,
    })
    .from(parcels)
    .innerJoin(merchants, eq(parcels.merchantId, merchants.id))
    .where(eq(parcels.id, parcelId));

  return rows[0] ? formatParcel(rows[0]) : undefined;
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
      })
      .from(parcels)
      .where(inArray(parcels.id, parcelIds));

    if (selectedParcels.length !== parcelIds.length) {
      throw new Error("One or more selected parcels could not be found.");
    }

    if (selectedParcels.some((parcel) => parcel.state !== "unassigned")) {
      throw new Error(
        "Only unassigned parcels can be added to a new manifest.",
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
