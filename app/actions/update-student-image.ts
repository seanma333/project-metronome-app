"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { students, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateStudentImageUrl(imageUrl: string) {
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

    // Update student imageUrl in database
    // Note: The image is already uploaded to Clerk via setProfileImage() on the client side
    await db
      .update(students)
      .set({
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(students.userId, userId));

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error updating student image:", error);
    return { error: "Failed to update image" };
  }
}
