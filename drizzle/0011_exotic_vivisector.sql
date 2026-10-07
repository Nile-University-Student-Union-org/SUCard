ALTER TABLE "user" DROP CONSTRAINT "user_admin_vendor_null_check";--> statement-breakpoint
ALTER TABLE "scan_events" DROP CONSTRAINT "scan_events_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "scan_events" DROP COLUMN "branch_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "branch_id";--> statement-breakpoint
DROP TABLE "branches";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_admin_vendor_null_check" CHECK ("user"."role" not in ('super_admin', 'admin', 'student') or "user"."vendor_id" is null);
