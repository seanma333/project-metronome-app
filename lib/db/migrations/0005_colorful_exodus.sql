CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY NOT NULL,
	"teacher_id" uuid NOT NULL,
	"timeslot_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"instrument_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_timeslot_id_unique" UNIQUE("timeslot_id")
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "instrument_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_timeslot_id_teacher_timeslots_id_fk" FOREIGN KEY ("timeslot_id") REFERENCES "public"."teacher_timeslots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lessons_teacher_id_idx" ON "lessons" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "lessons_timeslot_id_idx" ON "lessons" USING btree ("timeslot_id");--> statement-breakpoint
CREATE INDEX "lessons_student_id_idx" ON "lessons" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "lessons_instrument_id_idx" ON "lessons" USING btree ("instrument_id");--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_instrument_id_idx" ON "booking_requests" USING btree ("instrument_id");