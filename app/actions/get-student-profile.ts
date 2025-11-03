"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentStudentProfile() {
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

    const student = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (student.length === 0) {
      return null;
    }

    return {
      ...student[0],
      user: user[0],
    };
  } catch (error) {
    console.error("Error fetching current student profile:", error);
    return null;
  }
}

export async function getParentStudentProfiles() {
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

    const parentId = user[0].id;

    const parentStudents = await db
      .select()
      .from(students)
      .where(eq(students.parentId, parentId));

    return {
      user: user[0],
      students: parentStudents,
    };
  } catch (error) {
    console.error("Error fetching parent student profiles:", error);
    return null;
  }
}

export async function getStudentById(studentId: string) {
  try {
    const studentResult = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentResult.length === 0) {
      return null;
    }

    const student = studentResult[0];
    let userData = null;

    // If student has a userId, fetch the user data
    if (student.userId) {
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, student.userId))
        .limit(1);

      if (userResult.length > 0) {
        userData = userResult[0];
      }
    }

    return {
      ...student,
      user: userData,
    };
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    return null;
  }
}
