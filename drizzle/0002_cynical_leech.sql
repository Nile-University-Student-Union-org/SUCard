CREATE TABLE "card_claim_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"card_id" uuid,
	"result" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"university_id" text NOT NULL,
	"card_flow" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"suspend_reason" text,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_profiles_university_id_unique" UNIQUE("university_id")
);
--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "linked_by" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "voided_by" text;--> statement-breakpoint
ALTER TABLE "card_claim_attempts" ADD CONSTRAINT "card_claim_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_claim_attempts" ADD CONSTRAINT "card_claim_attempts_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_claim_attempts_user_created_idx" ON "card_claim_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_linked_by_user_id_fk" FOREIGN KEY ("linked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_voided_by_user_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;