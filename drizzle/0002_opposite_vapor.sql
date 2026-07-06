ALTER TABLE "moments" DROP CONSTRAINT "moments_space_id_spaces_id_fk";
--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_space_id_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id") ON DELETE set null ON UPDATE no action;