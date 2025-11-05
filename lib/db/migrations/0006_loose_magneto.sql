CREATE TYPE "public"."lesson_format" AS ENUM('IN_PERSON', 'ONLINE');--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "lesson_format" "lesson_format" NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "lesson_format" "lesson_format" NOT NULL;--> statement-breakpoint
CREATE INDEX "booking_requests_lesson_format_idx" ON "booking_requests" USING btree ("lesson_format");--> statement-breakpoint
CREATE INDEX "lessons_lesson_format_idx" ON "lessons" USING btree ("lesson_format");