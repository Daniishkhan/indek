CREATE TYPE "public"."user_role" AS ENUM('operator', 'merchant', 'rider');--> statement-breakpoint
CREATE TYPE "public"."parcel_state" AS ENUM('unassigned', 'assigned', 'in_transit', 'delivered', 'failed', 'in_return', 'returned');--> statement-breakpoint
CREATE TYPE "public"."proof_requirement" AS ENUM('photo', 'otp', 'photo+otp');--> statement-breakpoint
CREATE TYPE "public"."remittance_cycle" AS ENUM('daily', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."rider_status" AS ENUM('available', 'on_shift', 'returning', 'off_shift');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'operator' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"parcel_id" text NOT NULL,
	"type" text NOT NULL,
	"actor_user_id" text,
	"actor_label" text,
	"location" text,
	"proof" text,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manifests" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"zone_summary" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchant_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token" text NOT NULL,
	"remittance_cycle" "remittance_cycle" DEFAULT 'weekly' NOT NULL,
	"proof_requirement" "proof_requirement" DEFAULT 'photo' NOT NULL,
	"cod_fee_percent" numeric(5, 4) DEFAULT '0.05' NOT NULL,
	"delivery_fee_aed" numeric(10, 2) DEFAULT '15' NOT NULL,
	"dispute_window_days" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "operator_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text
);
--> statement-breakpoint
CREATE TABLE "parcels" (
	"id" text PRIMARY KEY NOT NULL,
	"awb" text NOT NULL,
	"merchant_id" text NOT NULL,
	"rider_id" text,
	"manifest_id" text,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"area" text NOT NULL,
	"address" text NOT NULL,
	"cod_amount_aed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"state" "parcel_state" DEFAULT 'unassigned' NOT NULL,
	"item_summary" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parcels_awb_unique" UNIQUE("awb")
);
--> statement-breakpoint
CREATE TABLE "rider_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"phone" text
);
--> statement-breakpoint
CREATE TABLE "riders" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zone" text NOT NULL,
	"status" "rider_status" DEFAULT 'off_shift' NOT NULL,
	"personal_float_aed" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manifests" ADD CONSTRAINT "manifests_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_profile" ADD CONSTRAINT "merchant_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_profile" ADD CONSTRAINT "merchant_profile_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_profile" ADD CONSTRAINT "operator_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_manifest_id_manifests_id_fk" FOREIGN KEY ("manifest_id") REFERENCES "public"."manifests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_profile" ADD CONSTRAINT "rider_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_profile" ADD CONSTRAINT "rider_profile_rider_id_riders_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."riders"("id") ON DELETE cascade ON UPDATE no action;