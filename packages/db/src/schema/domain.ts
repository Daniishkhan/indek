import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import type { RequestReviewChecklist } from "@indek/shared";
import { user } from "./auth";

export const parcelStateEnum = pgEnum("parcel_state", [
  "unassigned",
  "assigned",
  "in_transit",
  "delivered",
  "failed",
  "in_return",
  "returned",
]);

export const riderStatusEnum = pgEnum("rider_status", [
  "available",
  "on_shift",
  "returning",
  "off_shift",
]);

export const parcelReviewStateEnum = pgEnum("parcel_review_state", [
  "under_review",
  "needs_clarification",
  "on_hold",
  "dispatch_ready",
]);

export const parcelFollowUpStatusEnum = pgEnum("parcel_follow_up_status", [
  "open",
  "resolved",
]);

export const proofRequirementEnum = pgEnum("proof_requirement", [
  "photo",
  "otp",
  "photo+otp",
]);

export const remittanceCycleEnum = pgEnum("remittance_cycle", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

export const fulfillmentModeEnum = pgEnum("fulfillment_mode", [
  "pickup",
  "dropoff",
]);

// --- Domain tables ---

export const merchants = pgTable("merchants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  remittanceCycle: remittanceCycleEnum("remittance_cycle")
    .notNull()
    .default("weekly"),
  proofRequirement: proofRequirementEnum("proof_requirement")
    .notNull()
    .default("photo"),
  codFeePercent: numeric("cod_fee_percent", { precision: 5, scale: 4 })
    .notNull()
    .default("0.05"),
  deliveryFeeAed: numeric("delivery_fee_aed", { precision: 10, scale: 2 })
    .notNull()
    .default("15"),
  fulfillmentMode: fulfillmentModeEnum("fulfillment_mode")
    .notNull()
    .default("pickup"),
  pickupAddress: text("pickup_address"),
  disputeWindowDays: integer("dispute_window_days").notNull().default(7),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const riders = pgTable("riders", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  zone: text("zone").notNull(),
  status: riderStatusEnum("status").notNull().default("off_shift"),
  personalFloatAed: numeric("personal_float_aed", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// --- Profile links (user -> domain entity) ---

export const merchantProfile = pgTable("merchant_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" }),
});

export const riderProfile = pgTable("rider_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  riderId: text("rider_id")
    .notNull()
    .references(() => riders.id, { onDelete: "cascade" }),
  phone: text("phone"),
});

export const operatorProfile = pgTable("operator_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
});

// --- Parcels / manifests / events (skeletal — Epic 1 will expand) ---

export const manifests = pgTable("manifests", {
  id: text("id").primaryKey(),
  riderId: text("rider_id")
    .notNull()
    .references(() => riders.id, { onDelete: "restrict" }),
  zoneSummary: text("zone_summary"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const parcels = pgTable("parcels", {
  id: text("id").primaryKey(),
  awb: text("awb").notNull().unique(),
  merchantId: text("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "restrict" }),
  riderId: text("rider_id").references(() => riders.id, {
    onDelete: "set null",
  }),
  manifestId: text("manifest_id").references(() => manifests.id, {
    onDelete: "set null",
  }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  area: text("area").notNull(),
  address: text("address").notNull(),
  codAmountAed: numeric("cod_amount_aed", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  deliveryFeeAed: numeric("delivery_fee_aed", { precision: 10, scale: 2 }),
  state: parcelStateEnum("state").notNull().default("unassigned"),
  reviewState: parcelReviewStateEnum("review_state")
    .notNull()
    .default("dispatch_ready"),
  reviewChecklist: jsonb("review_checklist").$type<RequestReviewChecklist>(),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedByUserId: text("reviewed_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewedByLabel: text("reviewed_by_label"),
  itemSummary: text("item_summary"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const parcelFollowUps = pgTable("parcel_follow_ups", {
  id: text("id").primaryKey(),
  parcelId: text("parcel_id")
    .notNull()
    .references(() => parcels.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: parcelFollowUpStatusEnum("status").notNull().default("open"),
  createdByUserId: text("created_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdByLabel: text("created_by_label"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedByUserId: text("resolved_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  resolvedByLabel: text("resolved_by_label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Append-only event log. The product's whole chain-of-custody story depends on this.
export const events = pgTable("events", {
  id: text("id").primaryKey(),
  parcelId: text("parcel_id")
    .notNull()
    .references(() => parcels.id, { onDelete: "restrict" }),
  type: text("type").notNull(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  actorLabel: text("actor_label"),
  location: text("location"),
  proof: text("proof"),
  payload: jsonb("payload"),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
