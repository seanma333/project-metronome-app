"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SaveParentProfileParams {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  instrumentProficiencies?: Array<{
    instrumentId: number;
    proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  }>;
}

export async function saveParentProfile(params: SaveParentProfileParams) {
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

    const parentId = user[0].id;

    // Check if parent has any student entries
    const existingStudents = await db
      .select()
      .from(students)
      .where(eq(students.parentId, parentId))
      .limit(1);

    // Create date at UTC midnight to avoid timezone conversion
    let dateOfBirth: Date | null = null;
    if (params.dateOfBirth) {
      // Parse YYYY-MM-DD and create UTC date
      const [year, month, day] = params.dateOfBirth.split("-").map(Number);
      dateOfBirth = new Date(Date.UTC(year, month - 1, day));
    }

    let studentId: string;

    if (existingStudents.length > 0) {
      // Update existing student entry (first child)
      studentId = existingStudents[0].id;
      await db
        .update(students)
        .set({
          firstName: params.firstName,
          lastName: params.lastName,
          dateOfBirth: dateOfBirth,
          updatedAt: new Date(),
        })
        .where(eq(students.parentId, parentId));
    } else {
      // Create new student entry for parent's first child
      studentId = randomUUID();
      await db.insert(students).values({
        id: studentId,
        parentId: parentId,
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: dateOfBirth,
      });
    }

    return { success: true, studentId };
  } catch (error) {
    console.error("Error saving parent profile:", error);
    return { error: "Failed to save parent profile" };
  }
}
