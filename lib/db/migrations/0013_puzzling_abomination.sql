CREATE TYPE "public"."invite_role" AS ENUM('PARENT', 'STUDENT');--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"teacher_id" uuid NOT NULL,
	"user_id" uuid,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"timeslot_id" uuid,
	"role" "invite_role" NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_timeslot_id_teacher_timeslots_id_fk" FOREIGN KEY ("timeslot_id") REFERENCES "public"."teacher_timeslots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invites_teacher_id_idx" ON "invites" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "invites_user_id_idx" ON "invites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invites_timeslot_id_idx" ON "invites" USING btree ("timeslot_id");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invites_email_sent_idx" ON "invites" USING btree ("email_sent");--> statement-breakpoint
CREATE INDEX "invites_role_idx" ON "invites" USING btree ("role");