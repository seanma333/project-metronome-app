CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'ACCEPTED', 'DENIED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"timeslot_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"booking_status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_requests_student_id_timeslot_id_unique" UNIQUE("student_id","timeslot_id")
);
--> statement-breakpoint
CREATE TABLE "teacher_timeslots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"teacher_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"is_booked" boolean DEFAULT false NOT NULL,
	"student_id" uuid,
	"teaching_format" "teaching_format" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_timeslot_id_teacher_timeslots_id_fk" FOREIGN KEY ("timeslot_id") REFERENCES "public"."teacher_timeslots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timeslots" ADD CONSTRAINT "teacher_timeslots_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_timeslots" ADD CONSTRAINT "teacher_timeslots_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_timeslot_id_idx" ON "booking_requests" USING btree ("timeslot_id");--> statement-breakpoint
CREATE INDEX "booking_requests_student_id_idx" ON "booking_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "booking_requests_status_idx" ON "booking_requests" USING btree ("booking_status");--> statement-breakpoint
CREATE INDEX "booking_requests_student_status_idx" ON "booking_requests" USING btree ("student_id","booking_status");--> statement-breakpoint
CREATE INDEX "teacher_timeslots_teacher_id_idx" ON "teacher_timeslots" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "teacher_timeslots_day_of_week_idx" ON "teacher_timeslots" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "teacher_timeslots_is_booked_idx" ON "teacher_timeslots" USING btree ("is_booked");--> statement-breakpoint
CREATE INDEX "teacher_timeslots_teacher_availability_idx" ON "teacher_timeslots" USING btree ("teacher_id","day_of_week","is_booked");