export type RiderStatus = "available" | "on_shift" | "returning" | "off_shift";

export type ParcelState =
  | "unassigned"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "failed"
  | "in_return"
  | "returned";

export type ProofRequirement = "photo" | "otp" | "photo+otp";

export type RemittanceCycle = "daily" | "weekly" | "biweekly" | "monthly";

export const failureReasons = [
  "customer_not_home",
  "customer_refused",
  "reschedule_requested",
  "other",
] as const;

export type FailureReason = (typeof failureReasons)[number];

export type ShippingEstimateBand =
  | "same_zone"
  | "nearby"
  | "cross_city"
  | "manual_review";

type ZoneProfile = {
  label: string;
  cluster: "coastal" | "central" | "residential" | "north" | "outer";
  aliases: string[];
};

type ParcelWorkflowNotePayload = {
  pickupAddress?: string;
  averageShippingChargeAed?: number;
  customerNotes?: string;
};

const WORKFLOW_NOTE_PREFIX = "[[indek.workflow]]";

const ZONE_PROFILES: ZoneProfile[] = [
  {
    label: "Dubai Marina",
    cluster: "coastal",
    aliases: ["dubai marina", "marina", "jbr", "bluewaters"],
  },
  {
    label: "JLT",
    cluster: "coastal",
    aliases: ["jlt", "jumeirah lake towers", "cluster c", "cluster d"],
  },
  {
    label: "JVC",
    cluster: "residential",
    aliases: ["jvc", "jumeirah village circle"],
  },
  {
    label: "Motor City",
    cluster: "residential",
    aliases: ["motor city", "sports city", "studio city"],
  },
  {
    label: "Dubai Hills",
    cluster: "residential",
    aliases: ["dubai hills", "al barsha south", "park heights"],
  },
  {
    label: "Business Bay",
    cluster: "central",
    aliases: ["business bay", "executive towers", "bay square"],
  },
  {
    label: "Downtown",
    cluster: "central",
    aliases: ["downtown", "burj khalifa", "difc"],
  },
  {
    label: "Al Quoz",
    cluster: "central",
    aliases: ["al quoz", "safa", "umm suqeim"],
  },
  {
    label: "Deira",
    cluster: "north",
    aliases: ["deira", "naif", "al rigga", "muraqqabat"],
  },
  {
    label: "Bur Dubai",
    cluster: "north",
    aliases: ["bur dubai", "karama", "oud metha", "satwa"],
  },
  {
    label: "Mirdif",
    cluster: "outer",
    aliases: ["mirdif", "rashidiya", "warqa"],
  },
  {
    label: "Dubai Silicon Oasis",
    cluster: "outer",
    aliases: ["dso", "dubai silicon oasis", "silicon oasis"],
  },
  {
    label: "DIP",
    cluster: "outer",
    aliases: ["dip", "dubai investment park", "jafza"],
  },
];

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeText(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function detectZone(value: string | undefined) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;

  return ZONE_PROFILES.find((profile) =>
    profile.aliases.some((alias) => normalized.includes(alias)),
  );
}

export function estimateAverageShippingCharge(input: {
  baseFeeAed: number;
  pickupAddress: string;
  deliveryArea?: string;
  deliveryAddress: string;
}) {
  const pickupAddress = input.pickupAddress.trim();
  const deliveryAddress = input.deliveryAddress.trim();
  const deliveryArea = input.deliveryArea?.trim() ?? "";
  const pickupZone = detectZone(pickupAddress);
  const deliveryZone = detectZone(`${deliveryArea} ${deliveryAddress}`);

  let band: ShippingEstimateBand = "manual_review";
  let addOnAed = 0;
  let summary =
    "Average charge based on the merchant's base fee while ops reviews the exact lane.";

  if (pickupAddress && deliveryAddress) {
    if (pickupZone && deliveryZone && pickupZone.label === deliveryZone.label) {
      band = "same_zone";
      addOnAed = 0;
      summary =
        "Pickup and delivery look like the same zone, so this stays near the merchant's standard run rate.";
    } else if (
      pickupZone &&
      deliveryZone &&
      pickupZone.cluster === deliveryZone.cluster
    ) {
      band = "nearby";
      addOnAed = 4;
      summary =
        "This looks like a nearby cross-neighborhood run, so the quote includes a small lane uplift.";
    } else if (pickupZone || deliveryZone) {
      band = "cross_city";
      addOnAed = 8;
      summary =
        "This looks like a longer cross-zone run, so the quote includes a broader city-lane uplift.";
    } else {
      band = "manual_review";
      addOnAed = 5;
    }
  }

  return {
    averageChargeAed: roundCurrency(Math.max(0, input.baseFeeAed) + addOnAed),
    band,
    bandLabel:
      band === "same_zone"
        ? "Same-zone average"
        : band === "nearby"
          ? "Nearby cross-zone average"
          : band === "cross_city"
            ? "Cross-city average"
            : "Average pending exact review",
    summary,
    pickupZone: pickupZone?.label,
    deliveryZone: deliveryZone?.label,
  };
}

export function encodeParcelWorkflowNotes(input: ParcelWorkflowNotePayload) {
  const customerNotes = input.customerNotes?.trim() || undefined;
  const pickupAddress = input.pickupAddress?.trim() || undefined;
  const averageShippingChargeAed = Number.isFinite(
    input.averageShippingChargeAed,
  )
    ? roundCurrency(Number(input.averageShippingChargeAed))
    : undefined;

  if (!pickupAddress && averageShippingChargeAed === undefined) {
    return customerNotes;
  }

  return `${WORKFLOW_NOTE_PREFIX}${JSON.stringify({
    pickupAddress,
    averageShippingChargeAed,
    customerNotes,
  })}`;
}

export function parseParcelWorkflowNotes(notes?: string | null) {
  const trimmed = notes?.trim();
  if (!trimmed) {
    return {};
  }

  if (!trimmed.startsWith(WORKFLOW_NOTE_PREFIX)) {
    return {
      customerNotes: trimmed,
    };
  }

  try {
    const payload = JSON.parse(
      trimmed.slice(WORKFLOW_NOTE_PREFIX.length),
    ) as ParcelWorkflowNotePayload;

    return {
      pickupAddress: payload.pickupAddress?.trim() || undefined,
      averageShippingChargeAed: Number.isFinite(
        payload.averageShippingChargeAed,
      )
        ? roundCurrency(Number(payload.averageShippingChargeAed))
        : undefined,
      customerNotes: payload.customerNotes?.trim() || undefined,
    };
  } catch {
    return {
      customerNotes: trimmed,
    };
  }
}

export interface Merchant {
  id: string;
  name: string;
  token: string;
  remittanceCycle: RemittanceCycle;
  proofRequirement: ProofRequirement;
  codFeePercent: number;
  deliveryFeeAed: number;
  disputeWindowDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  name: string;
  zone: string;
  status: RiderStatus;
  parcelsInCustody: number;
  deliveredToday: number;
  cashHeldAed: number;
  lastEventAt: string;
  personalFloatAed: number;
  createdAt: string;
  updatedAt: string;
}

export interface Parcel {
  id: string;
  awb: string;
  merchantId: string;
  merchantName?: string;
  riderId?: string;
  manifestId?: string;
  customerName: string;
  customerPhone: string;
  area: string;
  address: string;
  pickupAddress?: string;
  codAmountAed: number;
  averageShippingChargeAed?: number;
  state: ParcelState;
  lastUpdateAt: string;
  itemSummary: string;
  notes?: string;
  createdAt: string;
}

export interface Manifest {
  id: string;
  riderId: string;
  riderName?: string;
  pickupCount: number;
  parcelIds: string[];
  expectedCodAed: number;
  zoneSummary: string;
  accepted: boolean;
  createdAt: string;
}

export interface EventLogEntry {
  id: string;
  parcelId: string;
  type: string;
  actor: string;
  timestamp: string;
  location: string;
  proof?: string;
}

export interface RemittanceLine {
  parcelId: string;
  awb: string;
  codAed: number;
  deliveryFeeAed: number;
  handlingFeeAed: number;
}

export interface RemittanceStatement {
  merchantId: string;
  cycleLabel: string;
  vatAed: number;
  netPayableAed: number;
  heldAmountAed: number;
  lines: RemittanceLine[];
}

export interface OpsSnapshot {
  merchantCount: number;
  riderCount: number;
  activeDeliveries: number;
  failedAttempts: number;
  unassigned: number;
  activeManifests: number;
  codExposureAed: number;
}

export interface OperatorOverviewData {
  snapshot: OpsSnapshot;
  merchants: Merchant[];
  riders: Rider[];
  manifests: Manifest[];
  unassigned: Parcel[];
  recentParcels: Parcel[];
}

export interface OperatorIntakeData {
  merchants: Merchant[];
  riders: Rider[];
  queue: Parcel[];
  recentParcels: Parcel[];
}

export interface DispatchBoardData {
  riders: Rider[];
  parcels: Parcel[];
  manifests: Manifest[];
}

export interface MerchantPortalData {
  merchant: Merchant;
  parcels: Parcel[];
  remittance?: RemittanceStatement;
  summary: {
    activeCount: number;
    deliveredCount: number;
    failedCount: number;
    awaitingAssignmentCount: number;
  };
}

export interface IndekSeed {
  merchants: Merchant[];
  riders: Rider[];
  parcels: Parcel[];
  manifests: Manifest[];
  eventLog: EventLogEntry[];
  remittances: RemittanceStatement[];
}
