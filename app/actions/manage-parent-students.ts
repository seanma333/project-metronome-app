"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function addParentStudent(firstName: string, lastName: string, dateOfBirth?: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const parentId = user[0].id;

    // Create date at UTC midnight to avoid timezone conversion
    let dob: Date | null = null;
    if (dateOfBirth) {
      // Parse YYYY-MM-DD and create UTC date
      const [year, month, day] = dateOfBirth.split("-").map(Number);
      dob = new Date(Date.UTC(year, month - 1, day));
    }

    const newStudent = await db.insert(students).values({
      id: randomUUID(),
      parentId: parentId,
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      dateOfBirth: dob,
    }).returning();

    return { success: true, student: newStudent[0] };
  } catch (error) {
    console.error("Error adding parent student:", error);
    return { error: "Failed to add student" };
  }
}

export async function updateParentStudent(studentId: string, firstName: string, lastName: string, dateOfBirth?: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const parentId = user[0].id;

    // Verify this student belongs to this parent
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student not found" };
    }

    if (student[0].parentId !== parentId) {
      return { error: "Unauthorized" };
    }

    // Create date at UTC midnight to avoid timezone conversion
    let dob: Date | null = null;
    if (dateOfBirth) {
      // Parse YYYY-MM-DD and create UTC date
      const [year, month, day] = dateOfBirth.split("-").map(Number);
      dob = new Date(Date.UTC(year, month - 1, day));
    }

    await db
      .update(students)
      .set({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        dateOfBirth: dob,
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    return { success: true };
  } catch (error) {
    console.error("Error updating parent student:", error);
    return { error: "Failed to update student" };
  }
}

export async function removeParentStudent(studentId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    const parentId = user[0].id;

    // Verify this student belongs to this parent
    const student = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student not found" };
    }

    if (student[0].parentId !== parentId) {
      return { error: "Unauthorized" };
    }

    await db.delete(students).where(eq(students.id, studentId));

    return { success: true };
  } catch (error) {
    console.error("Error removing parent student:", error);
    return { error: "Failed to remove student" };
  }
}
