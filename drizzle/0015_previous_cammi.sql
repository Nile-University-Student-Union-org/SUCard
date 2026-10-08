ALTER TABLE "email_outbox" ADD COLUMN "lease_id" uuid;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD COLUMN "lease_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD COLUMN "last_error" text;