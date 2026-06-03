ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "role_check";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "role_check" CHECK ("users"."role" IN ('admin', 'user'));