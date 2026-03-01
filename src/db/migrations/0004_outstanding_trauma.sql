CREATE INDEX "idx_auth_events_user_id" ON "auth_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_oauth_identities_user_id" ON "oauth_identities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_timeline_nodes_parent_id" ON "timeline_nodes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_usage_records_user_id_created_at" ON "usage_records" USING btree ("user_id","created_at");