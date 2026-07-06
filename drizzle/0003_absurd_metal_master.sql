CREATE TYPE "public"."observation_severity" AS ENUM('gentle', 'noteworthy', 'important');--> statement-breakpoint
CREATE TYPE "public"."observation_status" AS ENUM('new', 'seen', 'acted_on', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."observation_type" AS ENUM('dormant', 'dependency', 'gap', 'theme', 'quality_shift', 'bridge_risk');--> statement-breakpoint
CREATE TABLE "observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"type" "observation_type" NOT NULL,
	"content" text NOT NULL,
	"connections" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"severity" "observation_severity" DEFAULT 'gentle' NOT NULL,
	"status" "observation_status" DEFAULT 'new' NOT NULL,
	"user_response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;