CREATE INDEX "memberships_org_idx" ON "organisation_memberships" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "connection_spaces_space_idx" ON "connection_spaces" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "connections_org_idx" ON "connections" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "moment_connections_connection_idx" ON "moment_connections" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "moments_org_created_idx" ON "moments" USING btree ("organisation_id","created_at");--> statement-breakpoint
CREATE INDEX "moments_space_idx" ON "moments" USING btree ("space_id");--> statement-breakpoint
CREATE INDEX "moments_author_idx" ON "moments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "qualities_connection_idx" ON "qualities" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "qualities_moment_idx" ON "qualities" USING btree ("moment_id");--> statement-breakpoint
CREATE INDEX "network_links_org_idx" ON "network_links" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "observations_org_status_idx" ON "observations" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "observations_due_idx" ON "observations" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_status_retry_idx" ON "webhook_deliveries" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_endpoint_idx" ON "webhook_deliveries" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_org_idx" ON "webhook_endpoints" USING btree ("organisation_id");