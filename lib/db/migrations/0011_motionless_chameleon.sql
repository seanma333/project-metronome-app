ALTER TABLE "lesson_notes" ADD COLUMN "lesson_date" timestamp;--> statement-breakpoint
CREATE INDEX "lesson_notes_lesson_date_idx" ON "lesson_notes" USING btree ("lesson_date");