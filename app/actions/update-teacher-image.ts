"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateTeacherImageUrl(imageUrl: string) {
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

    // Update teacher imageUrl in database
    await db
      .update(teachers)
      .set({
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, userId));

    // Update Clerk user's profile image
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerkUser.id, {
        imageUrl: imageUrl || undefined,
      });
    } catch (clerkError) {
      console.error("Error updating Clerk user image:", clerkError);
      // Don't fail the entire operation if Clerk update fails
    }

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error updating teacher image:", error);
    return { error: "Failed to update image" };
  }
}
