"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { lessons, teacherTimeslots, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function deleteLesson(lessonId: string) {
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

    // Get the lesson to verify ownership and get timeslotId
    const lessonResult = await db
      .select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lessonResult.length === 0) {
      return { error: "Lesson not found" };
    }

    const lesson = lessonResult[0];

    // Verify authorization - only teachers can delete lessons
    if (userData.role !== "TEACHER") {
      return { error: "Unauthorized: Only teachers can delete lessons" };
    }

    // Verify the teacher owns this lesson
    if (lesson.teacherId !== userData.id) {
      return { error: "Unauthorized: You can only delete your own lessons" };
    }

    const timeslotId = lesson.timeslotId;

    // Update the timeslot to be unbooked
    await db
      .update(teacherTimeslots)
      .set({
        isBooked: false,
        studentId: null,
        updatedAt: new Date(),
      })
      .where(eq(teacherTimeslots.id, timeslotId));

    // Delete the lesson (this will cascade delete notes and calendar events)
    await db.delete(lessons).where(eq(lessons.id, lessonId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete lesson",
    };
  }
}

