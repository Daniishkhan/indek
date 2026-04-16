CREATE TYPE "public"."parcel_follow_up_status" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."parcel_review_state" AS ENUM('under_review', 'needs_clarification', 'on_hold', 'dispatch_ready');--> statement-breakpoint
CREATE TABLE "parcel_follow_ups" (
	"id" text PRIMARY KEY NOT NULL,
	"parcel_id" text NOT NULL,
	"message" text NOT NULL,
	"status" "parcel_follow_up_status" DEFAULT 'open' NOT NULL,
	"created_by_user_id" text,
	"created_by_label" text,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" text,
	"resolved_by_label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "review_state" "parcel_review_state" DEFAULT 'dispatch_ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "review_checklist" jsonb;--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "reviewed_by_user_id" text;--> statement-breakpoint
ALTER TABLE "parcels" ADD COLUMN "reviewed_by_label" text;--> statement-breakpoint
ALTER TABLE "parcel_follow_ups" ADD CONSTRAINT "parcel_follow_ups_parcel_id_parcels_id_fk" FOREIGN KEY ("parcel_id") REFERENCES "public"."parcels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_follow_ups" ADD CONSTRAINT "parcel_follow_ups_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcel_follow_ups" ADD CONSTRAINT "parcel_follow_ups_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;