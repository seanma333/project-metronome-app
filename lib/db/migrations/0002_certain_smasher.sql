CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"address" jsonb NOT NULL,
	"address_formatted" varchar(500) NOT NULL,
	"latitude" real,
	"longitude" real,
	"location" geography(Point, 4326),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_address_formatted_unique" UNIQUE("address_formatted")
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"address_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_addresses_user_id_address_id_unique" UNIQUE("user_id","address_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_timezone" varchar(50);--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "address_formatted_idx" ON "addresses" USING btree ("address_formatted");--> statement-breakpoint
CREATE INDEX "location_idx" ON "addresses" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_addresses_address_id_idx" ON "user_addresses" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX "addresses_location_gix" ON "addresses" USING GIST ("location");--> statement-breakpoint
