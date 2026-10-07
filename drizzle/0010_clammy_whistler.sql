CREATE TABLE "auth_failed_attempts" (
	"email_hash" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"last_failed_at" timestamp with time zone NOT NULL
);
