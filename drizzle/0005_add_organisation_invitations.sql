CREATE TABLE "organisation_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "org_invitation_email_unique" UNIQUE("organisation_id","email")
);
--> statement-breakpoint
ALTER TABLE "organisation_invitations" ADD CONSTRAINT "organisation_invitations_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_invitations" ADD CONSTRAINT "organisation_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;