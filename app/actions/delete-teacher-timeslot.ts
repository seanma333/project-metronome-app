"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, teacherTimeslots } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function deleteTeacherTimeslot(timeslotId: string) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get the user from our database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found in database" };
    }

    const userId = user[0].id;

    // Verify user is a teacher
    const teacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (teacher.length === 0) {
      return { error: "User is not a teacher" };
    }

    // Verify the timeslot belongs to this teacher
    const timeslot = await db
      .select()
      .from(teacherTimeslots)
      .where(
        and(
          eq(teacherTimeslots.id, timeslotId),
          eq(teacherTimeslots.teacherId, userId)
        )
      )
      .limit(1);

    if (timeslot.length === 0) {
      return { error: "Timeslot not found or unauthorized" };
    }

    // Don't allow deleting booked timeslots
    if (timeslot[0].isBooked) {
      return { error: "Cannot delete booked timeslots" };
    }

    // Delete the timeslot
    await db
      .delete(teacherTimeslots)
      .where(eq(teacherTimeslots.id, timeslotId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting teacher timeslot:", error);
    return { error: "Failed to delete timeslot" };
  }
}
