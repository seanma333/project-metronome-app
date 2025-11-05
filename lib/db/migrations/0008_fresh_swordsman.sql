CREATE TABLE "lesson_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lesson_id" uuid NOT NULL,
	"note_title" varchar(255),
	"notes" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lesson_notes_lesson_id_idx" ON "lesson_notes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_notes_created_at_idx" ON "lesson_notes" USING btree ("created_at");