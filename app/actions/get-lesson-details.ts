"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  students,
  lessons,
  teacherTimeslots,
  teachers,
  instruments,
  lessonNotes,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getLessonDetails(lessonId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated", authorized: false };
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found", authorized: false };
    }

    const userData = user[0];

    // Get lesson with all related data
    const lessonData = await db
      .select({
        lesson: {
          id: lessons.id,
          lessonFormat: lessons.lessonFormat,
          createdAt: lessons.createdAt,
          updatedAt: lessons.updatedAt,
        },
        timeslot: {
          id: teacherTimeslots.id,
          dayOfWeek: teacherTimeslots.dayOfWeek,
          startTime: teacherTimeslots.startTime,
          endTime: teacherTimeslots.endTime,
        },
        teacher: {
          id: teachers.id,
          imageUrl: teachers.imageUrl,
          profileName: teachers.profileName,
        },
        teacherUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
        },
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          imageUrl: students.imageUrl,
          userId: students.userId,
          parentId: students.parentId,
        },
        instrument: {
          id: instruments.id,
          name: instruments.name,
        },
      })
      .from(lessons)
      .innerJoin(teacherTimeslots, eq(lessons.timeslotId, teacherTimeslots.id))
      .innerJoin(teachers, eq(lessons.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.id, users.id))
      .innerJoin(students, eq(lessons.studentId, students.id))
      .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lessonData.length === 0) {
      return { error: "Lesson not found", authorized: false };
    }

    const lesson = lessonData[0];

    // Check authorization: user must be either the teacher or the student
    let isAuthorized = false;

    if (userData.role === "TEACHER" && lesson.teacher.id === userData.id) {
      isAuthorized = true;
    } else if (userData.role === "STUDENT") {
      // Check if the student's user ID matches the lesson's student
      if (lesson.student.userId === userData.id) {
        isAuthorized = true;
      }
    } else if (userData.role === "PARENT") {
      // Check if the parent's user ID matches the lesson's student's parent ID
      if (lesson.student.parentId === userData.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { error: "Unauthorized", authorized: false };
    }

    // Get all notes for this lesson, ordered by latest first
    const notes = await db
      .select()
      .from(lessonNotes)
      .where(eq(lessonNotes.lessonId, lessonId))
      .orderBy(desc(lessonNotes.createdAt));

    return {
      authorized: true,
      lesson: {
        ...lesson,
        notes,
      },
    };
  } catch (error) {
    console.error("Error fetching lesson details:", error);
    return { error: "Failed to fetch lesson details", authorized: false };
  }
}
