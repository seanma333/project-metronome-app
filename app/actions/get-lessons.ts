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
import { eq, and, desc } from "drizzle-orm";

export async function getStudentLessons() {
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

    if (userData.role !== "STUDENT") {
      return { error: "Access denied" };
    }

    // Get student record
    const studentRecords = await db
      .select()
      .from(students)
      .where(eq(students.userId, userData.id))
      .limit(1);

    if (studentRecords.length === 0) {
      return { lessons: [] };
    }

    const studentId = studentRecords[0].id;

    // Get lessons with all related data
    const lessonsData = await db
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
        instrument: {
          id: instruments.id,
          name: instruments.name,
        },
      })
      .from(lessons)
      .innerJoin(teacherTimeslots, eq(lessons.timeslotId, teacherTimeslots.id))
      .innerJoin(teachers, eq(lessons.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.id, users.id))
      .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
      .where(eq(lessons.studentId, studentId));

    // Get latest note for each lesson
    const lessonsWithNotes = await Promise.all(
      lessonsData.map(async (lessonData) => {
        const latestNote = await db
          .select()
          .from(lessonNotes)
          .where(eq(lessonNotes.lessonId, lessonData.lesson.id))
          .orderBy(desc(lessonNotes.createdAt))
          .limit(1);

        return {
          ...lessonData,
          latestNote: latestNote.length > 0 ? latestNote[0] : null,
        };
      })
    );

    return { lessons: lessonsWithNotes };
  } catch (error) {
    console.error("Error fetching student lessons:", error);
    return { error: "Failed to fetch lessons" };
  }
}

export async function getParentLessons() {
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

    if (userData.role !== "PARENT") {
      return { error: "Access denied" };
    }

    // Get all student records for this parent
    const studentRecords = await db
      .select()
      .from(students)
      .where(eq(students.parentId, userData.id));

    if (studentRecords.length === 0) {
      return { students: [] };
    }

    // Get lessons for each student
    const studentsWithLessons = await Promise.all(
      studentRecords.map(async (student) => {
        const lessonsData = await db
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
            instrument: {
              id: instruments.id,
              name: instruments.name,
            },
          })
          .from(lessons)
          .innerJoin(teacherTimeslots, eq(lessons.timeslotId, teacherTimeslots.id))
          .innerJoin(teachers, eq(lessons.teacherId, teachers.id))
          .innerJoin(users, eq(teachers.id, users.id))
          .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
          .where(eq(lessons.studentId, student.id));

        // Get latest note for each lesson
        const lessonsWithNotes = await Promise.all(
          lessonsData.map(async (lessonData) => {
            const latestNote = await db
              .select()
              .from(lessonNotes)
              .where(eq(lessonNotes.lessonId, lessonData.lesson.id))
              .orderBy(desc(lessonNotes.createdAt))
              .limit(1);

            return {
              ...lessonData,
              latestNote: latestNote.length > 0 ? latestNote[0] : null,
            };
          })
        );

        return {
          student,
          lessons: lessonsWithNotes,
        };
      })
    );

    return { students: studentsWithLessons };
  } catch (error) {
    console.error("Error fetching parent lessons:", error);
    return { error: "Failed to fetch lessons" };
  }
}

export async function getTeacherLessons() {
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

    if (userData.role !== "TEACHER") {
      return { error: "Access denied" };
    }

    // Get lessons with all related data
    const lessonsData = await db
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
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          imageUrl: students.imageUrl,
        },
        instrument: {
          id: instruments.id,
          name: instruments.name,
        },
      })
      .from(lessons)
      .innerJoin(teacherTimeslots, eq(lessons.timeslotId, teacherTimeslots.id))
      .innerJoin(students, eq(lessons.studentId, students.id))
      .innerJoin(instruments, eq(lessons.instrumentId, instruments.id))
      .where(eq(lessons.teacherId, userData.id));

    // Get latest note for each lesson
    const lessonsWithNotes = await Promise.all(
      lessonsData.map(async (lessonData) => {
        const latestNote = await db
          .select()
          .from(lessonNotes)
          .where(eq(lessonNotes.lessonId, lessonData.lesson.id))
          .orderBy(desc(lessonNotes.createdAt))
          .limit(1);

        return {
          ...lessonData,
          latestNote: latestNote.length > 0 ? latestNote[0] : null,
        };
      })
    );

    return { lessons: lessonsWithNotes };
  } catch (error) {
    console.error("Error fetching teacher lessons:", error);
    return { error: "Failed to fetch lessons" };
  }
}
