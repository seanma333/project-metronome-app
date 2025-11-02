"use server";

import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function updateUserRole(role: "TEACHER" | "STUDENT" | "PARENT") {
  try {
    const user = await currentUser();

    if (!user) {
      return { error: "User not authenticated" };
    }

    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: role,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user metadata:", error);
    return { error: "Failed to update user role" };
  }
}
