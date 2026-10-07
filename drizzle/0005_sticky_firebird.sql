CREATE TABLE "wallet_passes" (
	"student_id" text NOT NULL,
	"platform" text NOT NULL,
	"object_id" text NOT NULL,
	"first_issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scan_events" ADD COLUMN "student_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_passes_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_passes_student_platform_idx" ON "wallet_passes" USING btree ("student_id","platform");--> statement-breakpoint
CREATE INDEX "scan_events_confirmed_at_idx" ON "scan_events" USING btree ("confirmed_at") WHERE "scan_events"."confirmed" = true and "scan_events"."voided" = false;