CREATE TYPE "public"."event_status" AS ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('LESSON', 'AVAILABILITY', 'PERSONAL', 'OTHER');--> statement-breakpoint
CREATE TABLE "calendar_event_attendees" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"participation_status" varchar(20) DEFAULT 'NEEDS-ACTION' NOT NULL,
	"role" varchar(20) DEFAULT 'REQ-PARTICIPANT' NOT NULL,
	"response_requested" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_event_attendees_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"uid" varchar(255) NOT NULL,
	"summary" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(500),
	"dt_start" timestamp NOT NULL,
	"dt_end" timestamp NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"timezone" varchar(50),
	"rrule" text,
	"exdates" jsonb,
	"status" "event_status" DEFAULT 'CONFIRMED' NOT NULL,
	"event_type" "event_type" DEFAULT 'OTHER' NOT NULL,
	"priority" integer DEFAULT 0,
	"organizer_id" uuid NOT NULL,
	"lesson_id" uuid,
	"timeslot_id" uuid,
	"sequence" integer DEFAULT 0 NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	"created" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_events_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "calendar_event_attendees" ADD CONSTRAINT "calendar_event_attendees_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event_attendees" ADD CONSTRAINT "calendar_event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_timeslot_id_teacher_timeslots_id_fk" FOREIGN KEY ("timeslot_id") REFERENCES "public"."teacher_timeslots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_event_attendees_event_id_idx" ON "calendar_event_attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "calendar_event_attendees_user_id_idx" ON "calendar_event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_event_attendees_participation_status_idx" ON "calendar_event_attendees" USING btree ("participation_status");--> statement-breakpoint
CREATE INDEX "calendar_events_uid_idx" ON "calendar_events" USING btree ("uid");--> statement-breakpoint
CREATE INDEX "calendar_events_organizer_id_idx" ON "calendar_events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "calendar_events_dt_start_idx" ON "calendar_events" USING btree ("dt_start");--> statement-breakpoint
CREATE INDEX "calendar_events_dt_end_idx" ON "calendar_events" USING btree ("dt_end");--> statement-breakpoint
CREATE INDEX "calendar_events_event_type_idx" ON "calendar_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "calendar_events_status_idx" ON "calendar_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "calendar_events_lesson_id_idx" ON "calendar_events" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "calendar_events_timeslot_id_idx" ON "calendar_events" USING btree ("timeslot_id");--> statement-breakpoint
CREATE INDEX "calendar_events_organizer_date_idx" ON "calendar_events" USING btree ("organizer_id","dt_start");--> statement-breakpoint
CREATE INDEX "calendar_events_rrule_idx" ON "calendar_events" USING btree ("rrule");