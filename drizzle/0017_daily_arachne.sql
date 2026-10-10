CREATE TABLE "mailer_credentials" (
	"id" text PRIMARY KEY NOT NULL,
	"account_email" text NOT NULL,
	"encrypted_refresh_token" text,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"last_error" text,
	"connected_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connected_by" text
);
--> statement-breakpoint
ALTER TABLE "mailer_credentials" ADD CONSTRAINT "mailer_credentials_connected_by_user_id_fk" FOREIGN KEY ("connected_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;