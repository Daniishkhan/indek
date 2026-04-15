export type RiderStatus = "available" | "on_shift" | "returning" | "off_duty";
export type ParcelState =
  | "unassigned"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "returning";

export interface Merchant {
  id: string;
  name: string;
  remittanceCycle: "weekly" | "biweekly";
  proofRequirement: "photo" | "otp" | "photo+otp";
  codFeePercent: number;
  deliveryFeeAed: number;
  disputeWindowDays: number;
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
}

export interface Parcel {
  id: string;
  awb: string;
  merchantId: string;
  riderId?: string;
  customerName: string;
  customerPhone: string;
  area: string;
  address: string;
  codAmountAed: number;
  state: ParcelState;
  lastUpdateAt: string;
  itemSummary: string;
  notes?: string;
}

export interface Manifest {
  id: string;
  riderId: string;
  pickupCount: number;
  parcelIds: string[];
  expectedCodAed: number;
  zoneSummary: string;
  accepted: boolean;
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

export interface IndekSeed {
  merchants: Merchant[];
  riders: Rider[];
  parcels: Parcel[];
  manifests: Manifest[];
  eventLog: EventLogEntry[];
  remittances: RemittanceStatement[];
}
