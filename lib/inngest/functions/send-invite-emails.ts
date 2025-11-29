import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { invites, users, teachers, teacherTimeslots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resend } from "@/lib/email/resend-client";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Prepare template variables for Resend template
function prepareTemplateVariables(data: {
  recipientName: string;
  teacherName: string;
  role: "PARENT" | "STUDENT";
  signUpUrl: string;
}) {
  // User will add the actual variable names to match their Resend template
  return {
    student_name: data.recipientName,
    teacher_name: data.teacherName,
    you: data.role === "STUDENT" ? "you" : "your child",
    signup_url: data.signUpUrl,
  };
}

// Function to send invite email
async function sendInviteEmail(invite: any, teacher: any, teacherUser: any, timeslot: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const signUpUrl = `${appUrl}/sign-up?role=${invite.role.toLowerCase()}&invitationId=${invite.id}`;

  const teacherName = `${teacherUser.firstName || ""} ${teacherUser.lastName || ""}`.trim() || "Your teacher";

  const templateVariables = prepareTemplateVariables({
    recipientName: invite.fullName,
    teacherName,
    role: invite.role,
    signUpUrl,
  });

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "TempoLink";

  const result = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: invite.email,
    template: {
      id: "teacher-invite-student",
      variables: templateVariables,
    },
  });

  return result;
}

// Immediate trigger: Process invite when created
export const sendInviteEmailImmediate = inngest.createFunction(
  { id: "send-invite-email-immediate" },
  { event: "invite.created" },
  async ({ event, step }) => {
    const inviteId = event.data.inviteId;

    return await step.run("fetch-and-send-invite", async () => {
      // Fetch invite with related data
      const invite = await db
        .select()
        .from(invites)
        .where(eq(invites.id, inviteId))
        .limit(1);

      if (invite.length === 0) {
        throw new Error(`Invite ${inviteId} not found`);
      }

      const inviteData = invite[0];

      // Check if already sent
      if (inviteData.emailSent) {
        return { skipped: true, reason: "Email already sent" };
      }

      // Fetch teacher data
      const teacher = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, inviteData.teacherId))
        .limit(1);

      if (teacher.length === 0) {
        throw new Error(`Teacher ${inviteData.teacherId} not found`);
      }

      // Fetch teacher user data
      const teacherUser = await db
        .select()
        .from(users)
        .where(eq(users.id, inviteData.teacherId))
        .limit(1);

      if (teacherUser.length === 0) {
        throw new Error(`Teacher user ${inviteData.teacherId} not found`);
      }

      // Fetch timeslot if provided
      let timeslot = null;
      if (inviteData.timeslotId) {
        const timeslots = await db
          .select()
          .from(teacherTimeslots)
          .where(eq(teacherTimeslots.id, inviteData.timeslotId))
          .limit(1);
        if (timeslots.length > 0) {
          timeslot = timeslots[0];
        }
      }

      // Send email
      const emailResult = await sendInviteEmail(
        inviteData,
        teacher[0],
        teacherUser[0],
        timeslot
      );

      if (emailResult.error) {
        throw new Error(`Failed to send email: ${emailResult.error.message}`);
      }

      // Update invite as sent
      await db
        .update(invites)
        .set({ emailSent: true, updatedAt: new Date() })
        .where(eq(invites.id, inviteId));

      return {
        success: true,
        inviteId,
        emailId: emailResult.data?.id,
      };
    });
  }
);

// Periodic cleanup: Process any missed invites
export const sendInviteEmailsPeriodic = inngest.createFunction(
  { id: "send-invite-emails-periodic" },
  { cron: "*/10 * * * *" }, // Every 10 minutes
  async ({ step }) => {
    return await step.run("fetch-and-send-pending-invites", async () => {
      // Fetch all unsent invites
      const pendingInvites = await db
        .select()
        .from(invites)
        .where(eq(invites.emailSent, false));

      if (pendingInvites.length === 0) {
        return { processed: 0, message: "No pending invites" };
      }

      const results = [];

      for (const invite of pendingInvites) {
        try {
          // Fetch teacher data
          const teacher = await db
            .select()
            .from(teachers)
            .where(eq(teachers.id, invite.teacherId))
            .limit(1);

          if (teacher.length === 0) {
            results.push({ inviteId: invite.id, error: "Teacher not found" });
            continue;
          }

          // Fetch teacher user data
          const teacherUser = await db
            .select()
            .from(users)
            .where(eq(users.id, invite.teacherId))
            .limit(1);

          if (teacherUser.length === 0) {
            results.push({ inviteId: invite.id, error: "Teacher user not found" });
            continue;
          }

          // Fetch timeslot if provided
          let timeslot = null;
          if (invite.timeslotId) {
            const timeslots = await db
              .select()
              .from(teacherTimeslots)
              .where(eq(teacherTimeslots.id, invite.timeslotId))
              .limit(1);
            if (timeslots.length > 0) {
              timeslot = timeslots[0];
            }
          }

          // Send email
          const emailResult = await sendInviteEmail(
            invite,
            teacher[0],
            teacherUser[0],
            timeslot
          );

          if (emailResult.error) {
            results.push({
              inviteId: invite.id,
              error: emailResult.error.message,
            });
            continue;
          }

          // Update invite as sent
          await db
            .update(invites)
            .set({ emailSent: true, updatedAt: new Date() })
            .where(eq(invites.id, invite.id));

          results.push({
            inviteId: invite.id,
            success: true,
            emailId: emailResult.data?.id,
          });
        } catch (error: any) {
          results.push({
            inviteId: invite.id,
            error: error.message || "Unknown error",
          });
        }
      }

      return {
        processed: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => r.error).length,
        results,
      };
    });
  }
);

// Export both functions
export const sendInviteEmails = [sendInviteEmailImmediate, sendInviteEmailsPeriodic];

