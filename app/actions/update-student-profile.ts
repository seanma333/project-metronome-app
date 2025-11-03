"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateStudentName(firstName: string, lastName: string, syncWithUser: boolean = false) {
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

    const userId = user[0].id;

    // Get student profile
    const student = await db
      .select()
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);

    if (student.length === 0) {
      return { error: "Student profile not found" };
    }

    // Update student profile
    await db
      .update(students)
      .set({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(students.userId, userId));

    // Sync with User table and Clerk if requested
    if (syncWithUser) {
      await db
        .update(users)
        .set({
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      try {
        const client = await clerkClient();
        await client.users.updateUser(clerkUser.id, {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        });
      } catch (clerkError) {
        console.error("Error updating Clerk user name:", clerkError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating student name:", error);
    return { error: "Failed to update name" };
  }
}

export async function updateStudentDateOfBirth(dateOfBirth: string | null) {
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

    const userId = user[0].id;

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
        dateOfBirth: dob,
        updatedAt: new Date(),
      })
      .where(eq(students.userId, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating student date of birth:", error);
    return { error: "Failed to update date of birth" };
  }
}
