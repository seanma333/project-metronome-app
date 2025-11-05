CREATE TYPE "public"."proficiency_level" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED');--> statement-breakpoint
CREATE TABLE "student_instrument_proficiency" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" uuid NOT NULL,
	"instrument_id" integer NOT NULL,
	"proficiency" "proficiency_level" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_instrument_proficiency_student_id_instrument_id_unique" UNIQUE("student_id","instrument_id")
);
--> statement-breakpoint
ALTER TABLE "student_instrument_proficiency" ADD CONSTRAINT "student_instrument_proficiency_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_instrument_proficiency" ADD CONSTRAINT "student_instrument_proficiency_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_instrument_proficiency_student_id_idx" ON "student_instrument_proficiency" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_instrument_proficiency_instrument_id_idx" ON "student_instrument_proficiency" USING btree ("instrument_id");--> statement-breakpoint
CREATE INDEX "student_instrument_proficiency_proficiency_idx" ON "student_instrument_proficiency" USING btree ("proficiency");