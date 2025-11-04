"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, teacherTimeslots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentTeacherTimeslots() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return null;
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    const userId = user[0].id;

    // Check if user is a teacher
    const teacher = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, userId))
      .limit(1);

    if (teacher.length === 0) {
      return null;
    }

    // Get all timeslots for this teacher
    const timeslots = await db
      .select()
      .from(teacherTimeslots)
      .where(eq(teacherTimeslots.teacherId, userId));

    // Sort by day of week, then by start time
    timeslots.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    return timeslots;
  } catch (error) {
    console.error("Error fetching teacher timeslots:", error);
    return null;
  }
}
