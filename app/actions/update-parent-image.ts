"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateParentImageUrl(imageUrl: string) {
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

    // Update user imageUrl in database
    // Note: The image is already uploaded to Clerk via setProfileImage() on the client side
    await db
      .update(users)
      .set({
        imageUrl: imageUrl || null,
      })
      .where(eq(users.clerkId, clerkUser.id));

    return { success: true, imageUrl };
  } catch (error) {
    console.error("Error updating parent image:", error);
    return { error: "Failed to update image" };
  }
}
