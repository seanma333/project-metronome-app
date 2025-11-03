CREATE TYPE "public"."age_preference" AS ENUM('ALL_AGES', '13+', 'ADULTS_ONLY');--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "age_preference" "age_preference" DEFAULT 'ALL_AGES';