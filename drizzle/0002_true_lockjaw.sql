ALTER TABLE "orders" ADD COLUMN "delivery_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(30) DEFAULT 'cod' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "payment_method_check" CHECK ("orders"."payment_method" IN ('cod'));