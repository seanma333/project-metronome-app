"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateAcceptingStudents(acceptingStudents: boolean) {
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

    await db
      .update(teachers)
      .set({
        acceptingStudents: acceptingStudents,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating accepting students:", error);
    return { error: "Failed to update accepting students" };
  }
}

export async function updateTeachingFormat(teachingFormat: "IN_PERSON_ONLY" | "ONLINE_ONLY" | "IN_PERSON_AND_ONLINE") {
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

    await db
      .update(teachers)
      .set({
        teachingFormat: teachingFormat,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating teaching format:", error);
    return { error: "Failed to update teaching format" };
  }
}

export async function updateAgePreference(agePreference: "ALL_AGES" | "13+" | "ADULTS_ONLY") {
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

    await db
      .update(teachers)
      .set({
        agePreference: agePreference,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Error updating age preference:", error);
    return { error: "Failed to update age preference" };
  }
}

