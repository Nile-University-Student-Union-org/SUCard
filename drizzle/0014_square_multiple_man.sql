ALTER TABLE "wallet_passes" DROP CONSTRAINT "wallet_passes_student_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD COLUMN "last_attempted_at" timestamp with time zone;