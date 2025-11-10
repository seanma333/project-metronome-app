"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, students, lessons, teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getLessonParticipants(lessonId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "Unauthorized" };
    }

    // Get user from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userResult.length === 0) {
      return { error: "User not found" };
    }

    const currentUserData = userResult[0];

    // Get lesson with student and teacher information
    const lessonData = await db
      .select({
        lesson: lessons,
        student: {
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          userId: students.userId,
          parentId: students.parentId,
        },
        teacher: {
          id: teachers.id,
        },
      })
      .from(lessons)
      .innerJoin(students, eq(lessons.studentId, students.id))
      .innerJoin(teachers, eq(lessons.teacherId, teachers.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lessonData.length === 0) {
      return { error: "Lesson not found" };
    }

    const lesson = lessonData[0];

    // Get student user information (if student has a userId)
    let studentUser = null;
    if (lesson.student.userId) {
      const studentUserResult = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, lesson.student.userId))
        .limit(1);
      
      if (studentUserResult.length > 0) {
        studentUser = studentUserResult[0];
      }
    }

    // Get parent user information (if student has a parentId)
    let parentUser = null;
    if (lesson.student.parentId) {
      const parentUserResult = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, lesson.student.parentId))
        .limit(1);
      
      if (parentUserResult.length > 0) {
        parentUser = parentUserResult[0];
      }
    }

    // Get teacher user information
    const teacherUserResult = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.id, lesson.teacher.id))
      .limit(1);

    if (teacherUserResult.length === 0) {
      return { error: "Teacher not found" };
    }

    const teacherUser = teacherUserResult[0];

    // Determine email recipient based on role
    let emailRecipient = null;
    let emailRecipientName = null;
    
    if (currentUserData.role === "TEACHER") {
      // For teachers: email student if they have a userId, otherwise email parent
      if (studentUser) {
        emailRecipient = studentUser;
        emailRecipientName = `${studentUser.firstName || ""} ${studentUser.lastName || ""}`.trim() || "Student";
      } else if (parentUser) {
        emailRecipient = parentUser;
        emailRecipientName = `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim() || "Parent";
      }
    } else if (currentUserData.role === "STUDENT" || currentUserData.role === "PARENT") {
      // For students/parents: email teacher
      emailRecipient = teacherUser;
      emailRecipientName = `${teacherUser.firstName || ""} ${teacherUser.lastName || ""}`.trim() || "Teacher";
    }

    return {
      student: {
        firstName: lesson.student.firstName,
        lastName: lesson.student.lastName,
        fullName: `${lesson.student.firstName || ""} ${lesson.student.lastName || ""}`.trim() || "Student",
        email: studentUser?.email || null,
      },
      parent: parentUser ? {
        firstName: parentUser.firstName,
        lastName: parentUser.lastName,
        fullName: `${parentUser.firstName || ""} ${parentUser.lastName || ""}`.trim() || "Parent",
        email: parentUser.email,
      } : null,
      teacher: {
        firstName: teacherUser.firstName,
        lastName: teacherUser.lastName,
        fullName: `${teacherUser.firstName || ""} ${teacherUser.lastName || ""}`.trim() || "Teacher",
        email: teacherUser.email,
      },
      emailRecipient: emailRecipient ? {
        email: emailRecipient.email,
        name: emailRecipientName || "Recipient",
      } : null,
    };
  } catch (error) {
    console.error("Error fetching lesson participants:", error);
    return { error: "Failed to fetch lesson participants" };
  }
}

