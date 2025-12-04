"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, invites } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { inngest } from "@/lib/inngest/client";

interface CreateInviteParams {
  email: string;
  fullName: string;
  role: "PARENT" | "STUDENT";
  timeslotId?: string;
}

export async function createInvite(params: CreateInviteParams) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const userData = user[0];

    // Verify user is a teacher
    if (userData.role !== "TEACHER") {
      return { error: "Only teachers can create invites" };
    }

    // Get teacher record
    const teacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userData.id))
      .limit(1);

    if (teacher.length === 0) {
      return { error: "Teacher profile not found" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(params.email)) {
      return { error: "Invalid email format" };
    }

    // Validate full name
    if (!params.fullName.trim()) {
      return { error: "Full name is required" };
    }

    // If timeslotId is provided, verify it belongs to this teacher
    if (params.timeslotId) {
      const { teacherTimeslots } = await import("@/lib/db/schema");
      const timeslot = await db
        .select()
        .from(teacherTimeslots)
        .where(eq(teacherTimeslots.id, params.timeslotId))
        .limit(1);

      if (timeslot.length === 0) {
        return { error: "Timeslot not found" };
      }

      if (timeslot[0].teacherId !== userData.id) {
        return { error: "Timeslot does not belong to this teacher" };
      }
    }

    // Check if a user exists with the same email (case-insensitive)
    const trimmedEmail = params.email.trim().toLowerCase();
    const existingUser = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${trimmedEmail}`)
      .limit(1);

    const existingUserId = existingUser.length > 0 ? existingUser[0].id : null;
    const emailAlreadySent = existingUserId !== null; // If user exists, mark email as sent

    // Create invite
    const inviteId = randomUUID();
    await db.insert(invites).values({
      id: inviteId,
      teacherId: userData.id,
      userId: existingUserId,
      email: params.email.trim(),
      fullName: params.fullName.trim(),
      timeslotId: params.timeslotId || null,
      role: params.role,
      emailSent: emailAlreadySent,
    });

    // Trigger Inngest event to send email only if email hasn't been sent
    if (!emailAlreadySent) {
      try {
        await inngest.send({
          name: "invite.created",
          data: {
            inviteId,
          },
        });
      } catch (error) {
        console.error("Error triggering Inngest event:", error);
        // Don't fail the invite creation if event trigger fails
        // The periodic cleanup will pick it up
      }
    }

    return { success: true, inviteId, userExists: emailAlreadySent };
  } catch (error) {
    console.error("Error creating invite:", error);
    return { error: "Failed to create invite" };
  }
}

