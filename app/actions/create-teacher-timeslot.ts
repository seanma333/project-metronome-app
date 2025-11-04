"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, teachers, teacherTimeslots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface CreateTimeslotParams {
  dayOfWeek: number;
  startTime: string; // Format: "HH:MM:SS"
  endTime: string; // Format: "HH:MM:SS"
  teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE";
}

export async function createTeacherTimeslot(params: CreateTimeslotParams) {
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

    // Validate day of week (0-6)
    if (params.dayOfWeek < 0 || params.dayOfWeek > 6) {
      return { error: "Invalid day of week" };
    }

    // Validate time format and ensure end time is after start time
    const startParts = params.startTime.split(":").map(Number);
    const endParts = params.endTime.split(":").map(Number);

    if (startParts.length < 2 || endParts.length < 2) {
      return { error: "Invalid time format" };
    }

    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];

    if (endMinutes <= startMinutes) {
      return { error: "End time must be after start time" };
    }

    // Create the timeslot
    const timeslotId = randomUUID();
    const now = new Date();
    const newTimeslot = {
      id: timeslotId,
      teacherId: userId,
      dayOfWeek: params.dayOfWeek,
      startTime: params.startTime,
      endTime: params.endTime,
      isBooked: false,
      studentId: null,
      teachingFormat: params.teachingFormat,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(teacherTimeslots).values(newTimeslot);

    return { success: true, timeslot: newTimeslot };
  } catch (error) {
    console.error("Error creating teacher timeslot:", error);
    return { error: "Failed to create timeslot" };
  }
}
