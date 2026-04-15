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
  codAmountAed: number;
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
