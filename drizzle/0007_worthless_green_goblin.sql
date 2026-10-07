CREATE TABLE "qr_style_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"style_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"config" jsonb NOT NULL,
	"checks" jsonb NOT NULL,
	"accepted_warnings_reason" text,
	"published_by" text,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_styles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_default_print" boolean DEFAULT false NOT NULL,
	"is_default_web" boolean DEFAULT false NOT NULL,
	"draft_config" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qr_styles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "card_batches" ADD COLUMN "qr_style_version_id" uuid;--> statement-breakpoint
ALTER TABLE "card_batches" ADD COLUMN "print_status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "card_batches" ADD COLUMN "print_status_note" text;--> statement-breakpoint
ALTER TABLE "card_batches" ADD COLUMN "print_status_changed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "qr_style_versions" ADD CONSTRAINT "qr_style_versions_style_id_qr_styles_id_fk" FOREIGN KEY ("style_id") REFERENCES "public"."qr_styles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_style_versions" ADD CONSTRAINT "qr_style_versions_published_by_user_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_styles" ADD CONSTRAINT "qr_styles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "qr_style_versions_style_version_idx" ON "qr_style_versions" USING btree ("style_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "qr_styles_default_print_idx" ON "qr_styles" USING btree ("is_default_print") WHERE "qr_styles"."is_default_print" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "qr_styles_default_web_idx" ON "qr_styles" USING btree ("is_default_web") WHERE "qr_styles"."is_default_web" = true;--> statement-breakpoint
ALTER TABLE "card_batches" ADD CONSTRAINT "card_batches_qr_style_version_id_qr_style_versions_id_fk" FOREIGN KEY ("qr_style_version_id") REFERENCES "public"."qr_style_versions"("id") ON DELETE no action ON UPDATE no action;