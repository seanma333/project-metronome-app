"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  students,
  lessons,
  instruments,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getLessonByTimeslot(timeslotId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get lesson with student and instrument data
    const lessonData = await db
      .select({
        lesson: {
          id: lessons.id,
          lessonFormat: lessons.lessonFormat,
          createdAt: lessons.createdAt,
        },
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          imageUrl: students.imageUrl,
        },
        instrument: {
          id: instruments.id,
          name: instruments.name,
          imagePath: instruments.imagePath,
        },
      })
      .from(lessons)
      .innerJoin(students, eq(lessons.studentId, students.id))
      .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
      .where(eq(lessons.timeslotId, timeslotId))
      .limit(1);

    if (lessonData.length === 0) {
      return { error: "Lesson not found" };
    }

    return {
      lesson: lessonData[0],
    };
  } catch (error) {
    console.error("Error fetching lesson by timeslot:", error);
    return { error: "Failed to fetch lesson details" };
  }
}

