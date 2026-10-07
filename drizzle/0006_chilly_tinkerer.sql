DROP INDEX "wallet_passes_student_platform_idx";--> statement-breakpoint
ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_passes_student_id_platform_pk" PRIMARY KEY("student_id","platform");