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

    const dateOfBirth = params.dateOfBirth ? new Date(params.dateOfBirth) : null;

    if (existingStudents.length > 0) {
      // Update existing student entry (first child)
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
      await db.insert(students).values({
        id: randomUUID(),
        parentId: parentId,
        firstName: params.firstName,
        lastName: params.lastName,
        dateOfBirth: dateOfBirth,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving parent profile:", error);
    return { error: "Failed to save parent profile" };
  }
}
