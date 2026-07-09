ALTER TYPE "public"."observation_status" ADD VALUE 'scheduled';--> statement-breakpoint
ALTER TYPE "public"."observation_type" ADD VALUE 'follow_up';--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "observations" ADD COLUMN "source_moment_id" uuid;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_source_moment_id_moments_id_fk" FOREIGN KEY ("source_moment_id") REFERENCES "public"."moments"("id") ON DELETE set null ON UPDATE no action;