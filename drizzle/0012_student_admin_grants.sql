CREATE TABLE "student_admin_grants" (
	"university_id" text PRIMARY KEY NOT NULL,
	"granted_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "student_admin_grants_university_id_format" CHECK ("student_admin_grants"."university_id" ~ '^[0-9]{9}$')
);
--> statement-breakpoint
ALTER TABLE "student_admin_grants" ADD CONSTRAINT "student_admin_grants_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
