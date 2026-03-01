CREATE TABLE "character_bible" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeline_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"appearance_guide" text,
	"reference_image_url" text,
	"aliases" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "character_bible_timeline_id_name_unique" UNIQUE("timeline_id","name")
);
--> statement-breakpoint
ALTER TABLE "character_bible" ADD CONSTRAINT "character_bible_timeline_id_timelines_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."timelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_character_bible_timeline_id" ON "character_bible" USING btree ("timeline_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");