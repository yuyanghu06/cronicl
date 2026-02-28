CREATE TABLE "branch_canon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"setting" text,
	"characters" text[],
	"tone" text,
	"rules" text[],
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "branch_canon_branch_id_unique" UNIQUE("branch_id")
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeline_id" uuid NOT NULL,
	"branch_point_node_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"style_preferences" text[],
	"favorite_themes" text[],
	"preferred_tone" text,
	"exploration_ratio" text DEFAULT '0.3',
	"disliked_elements" text[],
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timeline_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timeline_id" uuid NOT NULL,
	"parent_id" uuid,
	"label" text,
	"title" text NOT NULL,
	"content" text DEFAULT '',
	"status" text DEFAULT 'draft',
	"position_x" integer DEFAULT 0,
	"position_y" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"system_prompt" text,
	"tags" text[],
	"status" text DEFAULT 'draft',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "branch_canon" ADD CONSTRAINT "branch_canon_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_timeline_id_timelines_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."timelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_branch_point_node_id_timeline_nodes_id_fk" FOREIGN KEY ("branch_point_node_id") REFERENCES "public"."timeline_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD CONSTRAINT "creator_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_timeline_id_timelines_id_fk" FOREIGN KEY ("timeline_id") REFERENCES "public"."timelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_nodes" ADD CONSTRAINT "timeline_nodes_parent_id_timeline_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."timeline_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timelines" ADD CONSTRAINT "timelines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_branches_timeline_id" ON "branches" USING btree ("timeline_id");--> statement-breakpoint
CREATE INDEX "idx_timeline_nodes_timeline_id" ON "timeline_nodes" USING btree ("timeline_id");--> statement-breakpoint
CREATE INDEX "idx_timelines_user_id" ON "timelines" USING btree ("user_id");