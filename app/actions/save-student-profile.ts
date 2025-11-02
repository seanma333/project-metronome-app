"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SaveStudentProfileParams {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export async function saveStudentProfile(params: SaveStudentProfileParams) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return { error: "User not authenticated" };
    }

    // Get the user from our database
    const { users } = await import("@/lib/db/schema");
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found in database" };
    }

    const userId = user[0].id;

    // Check if student profile already exists
    const existingStudent = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth) : null;

    if (existingStudent.length > 0) {
      // Update existing student
      await db
        .update(students)
        .set({
          firstName: params.firstName,
          lastName: params.lastName,
          dateOfBirth: dateOfBirth,
          updatedAt: new Date(),
        })
        .where(eq(students.userId, userId));
    } else {
      // Create new student profile
      await db.insert(students).values({
        id: randomUUID(),
        userId: userId,
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: dateOfBirth,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving student profile:", error);
    return { error: "Failed to save student profile" };
  }
}

