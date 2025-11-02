"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateUniqueProfileName } from "./generate-profile-name";

export async function updateTeacherName(firstName: string, lastName: string) {
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

    // Update user name
    await db
      .update(users)
      .set({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update teacher profileName if name changed
    if (firstName.trim() && lastName.trim()) {
      const newProfileName = await generateUniqueProfileName(firstName.trim(), lastName.trim());

      await db
        .update(teachers)
        .set({
          profileName: newProfileName,
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, userId));
    }

    // Also update Clerk user's name
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerkUser.id, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
    } catch (clerkError) {
      console.error("Error updating Clerk user name:", clerkError);
      // Don't fail the entire operation if Clerk update fails
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating teacher name:", error);
    return { error: "Failed to update name" };
  }
}
