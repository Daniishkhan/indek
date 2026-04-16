CREATE TYPE "public"."fulfillment_mode" AS ENUM('pickup', 'dropoff');--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "fulfillment_mode" "fulfillment_mode" DEFAULT 'pickup' NOT NULL;